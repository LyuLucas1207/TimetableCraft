import type { WeekDay } from "@/types/course";
import type { ScheduleEvent } from "@/types/schedule";
import { expandOvernight } from "./schedule";
import { minutesToTime, timeToMinutes } from "./time";

export interface SmartFillGoal { subject: string; minutes: number; color: string }
export interface SmartFillInput {
  /** Everything already on the grid: classes, existing study blocks, other commitments. */
  busy: ScheduleEvent[];
  goals: SmartFillGoal[];
  days: WeekDay[];
  window: { start: string; end: string };
  minSession: number;
  maxSession: number;
  /** Breathing room kept around every busy block and between sessions. */
  gap: number;
}
export interface FillSession { subject: string; day: WeekDay; start: string; end: string; color: string }
export interface SmartFillResult { sessions: FillSession[]; unmet: Record<string, number> }

type Span = [number, number];
const STEP = 15;
const ceil = (value: number) => Math.ceil(value / STEP) * STEP;
const floor = (value: number) => Math.floor(value / STEP) * STEP;

function freeSpans(day: WeekDay, input: SmartFillInput): Span[] {
  const lo = ceil(timeToMinutes(input.window.start));
  const hi = floor(timeToMinutes(input.window.end));
  const busy = expandOvernight(input.busy)
    .filter((event) => event.days?.includes(day))
    .map<Span>((event) => [timeToMinutes(event.startTime) - input.gap, timeToMinutes(event.endTime) + input.gap])
    .sort((a, b) => a[0] - b[0]);
  const spans: Span[] = [];
  let cursor = lo;
  for (const [start, end] of busy) {
    if (start > cursor) spans.push([cursor, Math.min(start, hi)]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < hi) spans.push([cursor, hi]);
  return spans.map<Span>(([start, end]) => [ceil(start), floor(end)]).filter(([start, end]) => end - start >= STEP && start < hi && end > lo);
}

/**
 * Deterministic free-slot search. The subject with the most hours left is placed next, on the
 * least-loaded day that does not already have it, in the earliest span that fits. Nothing is saved:
 * the caller previews the sessions and decides what to add.
 */
export function smartFill(input: SmartFillInput): SmartFillResult {
  const free = new Map<WeekDay, Span[]>(input.days.map((day) => [day, freeSpans(day, input)]));
  const remaining = new Map(input.goals.map((goal) => [goal.subject, floor(goal.minutes)]));
  const load = new Map<WeekDay, number>(input.days.map((day) => [day, 0]));
  const usedDays = new Map<string, Set<WeekDay>>(input.goals.map((goal) => [goal.subject, new Set()]));
  const stuck = new Set<string>();
  const sessions: FillSession[] = [];
  const min = Math.max(STEP, ceil(input.minSession));
  const max = Math.max(min, floor(input.maxSession));

  for (let guard = 0; guard < 2000; guard++) {
    const goal = input.goals
      .filter((item) => !stuck.has(item.subject) && (remaining.get(item.subject) ?? 0) >= STEP)
      .sort((a, b) => (remaining.get(b.subject) ?? 0) - (remaining.get(a.subject) ?? 0))[0];
    if (!goal) break;
    const left = remaining.get(goal.subject)!;
    const need = Math.min(min, left);
    let best: { day: WeekDay; index: number; score: number } | null = null;
    input.days.forEach((day, order) => {
      free.get(day)!.forEach(([start, end], index) => {
        if (end - start < need) return;
        const score = (usedDays.get(goal.subject)!.has(day) ? 100_000 : 0) + load.get(day)! * 10 + order;
        if (!best || score < best.score) best = { day, index, score };
      });
    });
    if (!best) { stuck.add(goal.subject); continue; }
    const { day, index } = best as { day: WeekDay; index: number };
    const spans = free.get(day)!;
    const [start, end] = spans[index];
    const length = Math.max(STEP, floor(Math.min(max, left, end - start)));
    sessions.push({ subject: goal.subject, day, start: minutesToTime(start), end: minutesToTime(start + length), color: goal.color });
    remaining.set(goal.subject, left - length);
    load.set(day, load.get(day)! + length);
    usedDays.get(goal.subject)!.add(day);
    const rest: Span = [ceil(start + length + input.gap), end];
    spans.splice(index, 1, ...(rest[1] - rest[0] >= STEP ? [rest] : []));
  }
  const order = new Map(input.days.map((day, index) => [day, index]));
  sessions.sort((a, b) => order.get(a.day)! - order.get(b.day)! || a.start.localeCompare(b.start));
  return { sessions, unmet: Object.fromEntries([...remaining].filter(([, minutes]) => minutes >= STEP)) };
}
