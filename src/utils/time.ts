import type { GridInterval } from "@/types/course";

const TIME_RE =
  /^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i;

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function parseToMinutes(input: string): number | null {
  const raw = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return null;

  const hhmmss = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (hhmmss) {
    return Number(hhmmss[1]) * 60 + Number(hhmmss[2]);
  }

  const match = raw.match(TIME_RE);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3]?.replace(/\./g, "") ?? "";

  if (meridiem.startsWith("p") && hours !== 12) hours += 12;
  if (meridiem.startsWith("a") && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isStartBeforeEnd(start: string, end: string): boolean {
  const startMin = parseToMinutes(start);
  const endMin = parseToMinutes(end);
  if (startMin == null || endMin == null) return false;
  return startMin < endMin;
}

/** `HH:MM` snapped to :00 / :15 / :30 / :45, or empty. */
export function toTimeInputValue(value: string | undefined): string {
  const minutes = parseToMinutes(value ?? "");
  if (minutes == null) return "";
  return minutesToTime(snapToQuarterHour(minutes));
}

export const QUARTER_MINUTES = [0, 15, 30, 45] as const;

export function snapToQuarterHour(totalMinutes: number): number {
  return Math.max(0, Math.min(24 * 60, Math.round(totalMinutes / 15) * 15));
}

export function parseOptionalTimeRange(
  start?: string,
  end?: string,
): { startTime: string; endTime: string } | "empty" | "invalid" {
  const startTime = toTimeInputValue(start);
  const endTime = toTimeInputValue(end);
  if (!startTime && !endTime) return "empty";
  if (!startTime || !endTime || !isStartBeforeEnd(startTime, endTime)) return "invalid";
  return { startTime, endTime };
}

export function addDuration(start: string, durationMinutes: number): string | null {
  const startMin = parseToMinutes(toTimeInputValue(start));
  if (startMin == null) return null;
  const latest = 23 * 60 + 45;
  const next = Math.min(latest, snapToQuarterHour(startMin + durationMinutes));
  if (next <= startMin) return null;
  return minutesToTime(next);
}

export function normalizeTime(input: string): string | null {
  const minutes = parseToMinutes(input);
  if (minutes == null) return null;
  return minutesToTime(minutes);
}

export function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, total));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function formatDisplayTime(value: string): string {
  const minutes = timeToMinutes(value);
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${pad2(mins)} ${meridiem}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatDisplayTime(start)} – ${formatDisplayTime(end)}`;
}

export function snapDown(minutes: number, interval: GridInterval): number {
  return Math.floor(minutes / interval) * interval;
}

export function snapUp(minutes: number, interval: GridInterval): number {
  return Math.ceil(minutes / interval) * interval;
}

/** Trim idle morning/evening slots, keeping one empty row before the first class and after the last. */
export function collapseIdleBounds(
  firstEventMin: number,
  lastEventMin: number,
  interval: GridInterval,
): { startMin: number; endMin: number } {
  const first = snapDown(firstEventMin, interval);
  const last = snapUp(lastEventMin, interval);
  const startMin = Math.max(0, first - interval);
  let endMin = Math.min(24 * 60, last + interval);
  if (endMin <= startMin) endMin = startMin + interval;
  return { startMin, endMin };
}

export function buildTimeSlots(
  start: string,
  end: string,
  interval: GridInterval,
): string[] {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const slots: string[] = [];
  for (let t = startMin; t < endMin; t += interval) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

export function formatSlotLabel(
  start: string,
  interval: GridInterval,
  compact: boolean,
): string {
  const end = minutesToTime(timeToMinutes(start) + interval);
  if (compact) return formatDisplayTime(start);
  return `${formatDisplayTime(start).replace(" AM", "").replace(" PM", "")} – ${formatDisplayTime(end).replace(" AM", "").replace(" PM", "")}`;
}
