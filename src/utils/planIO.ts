import type { PlannerId } from "@/config/planners";
import { normalizeDocument, type PlannerDocument } from "@/stores/planners";
import { WeekDay } from "@/types/course";
import { ALL_WEEK_DAYS, type PlannerColumn, type ScheduleEvent } from "@/types/schedule";
import { createId } from "./ids";
import { validateScheduleEvent } from "./schedule";

export const FILE_KIND = "timetablecraft.planner";
export const FILE_VERSION = 1;

export function exportPlannerJSON(planner: PlannerId, document: PlannerDocument): string {
  return JSON.stringify({ kind: FILE_KIND, version: FILE_VERSION, planner, exportedAt: new Date().toISOString(), document }, null, 2);
}

export interface ParsedPlan { document: PlannerDocument; dropped: number }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function cleanColumns(value: unknown): PlannerColumn[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is PlannerColumn => isRecord(item) && typeof item.id === "string" && typeof item.label === "string" && ["day", "date", "text"].includes(String(item.kind)));
}

/** Throws a localization key when the file is not a TimetableCraft plan for this tool. */
export function parsePlannerJSON(text: string, planner: PlannerId): ParsedPlan {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("errorImportFormat"); }
  if (!isRecord(raw) || raw.kind !== FILE_KIND || !isRecord(raw.document) || !Array.isArray(raw.document.events)) throw new Error("errorImportFormat");
  if (typeof raw.version === "number" && raw.version > FILE_VERSION) throw new Error("errorImportVersion");
  if (raw.planner !== planner) throw new Error("errorImportPlanner");
  return sanitizeDocument(raw.document);
}

/** Keep only events that pass validation; everything else is counted as dropped. */
export function sanitizeDocument(document: Record<string, unknown>): ParsedPlan {
  const events = (document.events as unknown[]).filter((item): item is ScheduleEvent => isRecord(item) && typeof item.id === "string" && typeof item.title === "string" && typeof item.color === "string"
    && typeof item.startTime === "string" && typeof item.endTime === "string");
  const valid = events.filter((event) => !validateScheduleEvent(event));
  const columns = cleanColumns(document.columns);
  const todos = Array.isArray(document.todos) ? document.todos.filter((todo) => isRecord(todo) && typeof todo.id === "string" && typeof todo.title === "string" && typeof todo.date === "string") : undefined;
  const next = normalizeDocument({
    ...(document as Partial<PlannerDocument>),
    events: valid, columns,
    todos: todos as PlannerDocument["todos"],
    goals: isRecord(document.goals) ? (document.goals as Record<string, number>) : undefined,
    checkins: isRecord(document.checkins) ? (document.checkins as Record<string, string[]>) : undefined,
    settings: isRecord(document.settings) ? (document.settings as unknown as PlannerDocument["settings"]) : undefined,
  });
  return { document: next, dropped: (document.events as unknown[]).length - valid.length };
}

/** Combine an imported plan into the current one without replacing anything; events get fresh ids when they clash. */
export function mergeDocuments(current: PlannerDocument, incoming: PlannerDocument): PlannerDocument {
  const known = new Set(current.events.map((event) => event.id));
  const columnIds = new Map<string, string>();
  const knownColumns = new Set((current.columns ?? []).map((column) => column.id));
  const columns = [...(current.columns ?? []), ...(incoming.columns ?? []).map((column) => {
    if (!knownColumns.has(column.id)) return column;
    const id = createId(); columnIds.set(column.id, id); return { ...column, id };
  })];
  const idMap = new Map<string, string>();
  const events = incoming.events.map((event) => {
    const id = known.has(event.id) ? createId() : event.id;
    idMap.set(event.id, id);
    return { ...event, id, ...(event.columnKey && columnIds.has(event.columnKey) ? { columnKey: columnIds.get(event.columnKey) } : {}) };
  });
  const checkins = { ...current.checkins };
  for (const [old, days] of Object.entries(incoming.checkins ?? {})) { const id = idMap.get(old); if (id) checkins[id] = days; }
  return {
    ...current, events: [...current.events, ...events],
    columns: columns.length ? columns : undefined,
    goals: { ...incoming.goals, ...current.goals },
    todos: [...(current.todos ?? []), ...(incoming.todos ?? []).filter((todo) => !(current.todos ?? []).some((item) => item.id === todo.id))],
    checkins,
  };
}

const CSV_HEADER = ["title", "subtitle", "days", "date", "start", "end", "location", "category", "color", "reminder"] as const;
const quote = (value: string) => /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export function eventsToCSV(events: ScheduleEvent[]): string {
  const rows = events.map((event) => [event.title, event.subtitle ?? "", event.days?.join("|") ?? "", event.date ?? "", event.startTime, event.endTime, event.location ?? "", event.category ?? "", event.color, event.reminderMinutes?.toString() ?? ""]);
  return [CSV_HEADER as readonly string[], ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  const body = text.replace(/^﻿/, "");
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    if (quoted) {
      if (char === '"' && body[index + 1] === '"') { cell += '"'; index++; } else if (char === '"') quoted = false; else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") { if (char === "\r" && body[index + 1] === "\n") index++; row.push(cell); cell = ""; if (row.some((item) => item.trim())) rows.push(row); row = []; }
    else cell += char;
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

const DAY_LOOKUP = new Map<string, WeekDay>(ALL_WEEK_DAYS.flatMap((day) => [[day.toLowerCase(), day], [day.slice(0, 3).toLowerCase(), day]] as [string, WeekDay][]));
export interface CSVResult { events: ScheduleEvent[]; errors: { line: number; key: string }[] }

/** Header names are matched case-insensitively; unknown columns are ignored. Rows that fail validation are reported, not imported. */
export function csvToEvents(text: string, defaultColor = "#DBEAFE"): CSVResult {
  const rows = parseCSVRows(text);
  if (rows.length < 2) throw new Error("errorImportFormat");
  const header = rows[0].map((item) => item.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  if (col("title") < 0 || col("start") < 0 || col("end") < 0) throw new Error("errorImportFormat");
  const events: ScheduleEvent[] = [];
  const errors: CSVResult["errors"] = [];
  rows.slice(1).forEach((row, index) => {
    const cell = (name: string) => (row[col(name)] ?? "").trim();
    const days = cell("days").split(/[|;/]/).map((item) => DAY_LOOKUP.get(item.trim().toLowerCase())).filter((day): day is WeekDay => Boolean(day));
    const reminder = cell("reminder");
    const color = cell("color");
    const event: ScheduleEvent = {
      id: createId(), title: cell("title"), startTime: cell("start").padStart(5, "0"), endTime: cell("end").padStart(5, "0"),
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : defaultColor,
      ...(cell("date") ? { date: cell("date") } : { days }),
      ...(cell("subtitle") ? { subtitle: cell("subtitle") } : {}), ...(cell("location") ? { location: cell("location") } : {}), ...(cell("category") ? { category: cell("category") } : {}),
      ...(reminder ? { reminderMinutes: Number(reminder) } : {}),
    };
    const problem = validateScheduleEvent(event);
    if (problem) errors.push({ line: index + 2, key: problem }); else events.push(event);
  });
  return { events, errors };
}
