import type { WeekDay } from "@/types/course";
import { ALL_WEEK_DAYS, type ScheduleEvent, type TodoItem } from "@/types/schedule";
import { addDays, eventMinutes, expandOvernight, weekdayOf } from "./schedule";
import { timeToMinutes } from "./time";

/** How many times an event happens in a week view: its weekdays, or once for a dated event. */
export function weeklyOccurrences(event: ScheduleEvent): number {
  return event.date ? 1 : event.days?.length ?? 0;
}

export function weeklyMinutes(event: ScheduleEvent): number {
  return eventMinutes(event) * weeklyOccurrences(event);
}

export function totalHours(events: ScheduleEvent[]): number {
  return events.reduce((sum, event) => sum + weeklyMinutes(event), 0) / 60;
}

export interface CategoryShare { category: string; minutes: number; color: string }

/** Minutes per category across the week, largest first. */
export function minutesByCategory(events: ScheduleEvent[], fallback: string): CategoryShare[] {
  const map = new Map<string, CategoryShare>();
  for (const event of events) {
    const key = event.category?.trim() || fallback;
    const entry = map.get(key) ?? { category: key, minutes: 0, color: event.color };
    entry.minutes += weeklyMinutes(event);
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

export function legendEntries(events: ScheduleEvent[]): { category: string; color: string }[] {
  const seen = new Map<string, string>();
  for (const event of events) {
    const key = event.category?.trim();
    if (key && !seen.has(key)) seen.set(key, event.color);
  }
  return [...seen].map(([category, color]) => ({ category, color }));
}

function sharesDay(a: ScheduleEvent, b: ScheduleEvent): boolean {
  if ((a.columnKey || b.columnKey) && a.columnKey !== b.columnKey) return false;
  if (a.date && b.date) return a.date === b.date;
  if (a.date) return Boolean(b.days?.includes(weekdayOf(a.date)));
  if (b.date) return Boolean(a.days?.includes(weekdayOf(b.date)));
  if (a.columnKey && a.columnKey === b.columnKey && !a.days?.length && !b.days?.length) return true;
  return Boolean(a.days?.some((day) => b.days?.includes(day)));
}

/** Events that overlap `event` on a shared day or column. Overnight events are compared per segment. */
export function conflictsFor(event: ScheduleEvent, others: ScheduleEvent[]): ScheduleEvent[] {
  const mine = expandOvernight([event]);
  const hits = new Map<string, ScheduleEvent>();
  for (const other of others) {
    if (other.id === event.id) continue;
    for (const segment of expandOvernight([other])) {
      if (mine.some((part) => sharesDay(part, segment)
        && timeToMinutes(part.startTime) < timeToMinutes(segment.endTime)
        && timeToMinutes(segment.startTime) < timeToMinutes(part.endTime))) {
        hits.set(other.id, other);
      }
    }
  }
  return [...hits.values()];
}

/** Whole days from `today` to `date` (negative once it has passed). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}

/** Hours between the end of one dated event and the start of the next on the same date. */
export function examGaps(events: ScheduleEvent[]): { a: ScheduleEvent; b: ScheduleEvent; minutes: number }[] {
  const dated = events.filter((event) => event.date).sort((x, y) => (x.date! + x.startTime).localeCompare(y.date! + y.startTime));
  const gaps: { a: ScheduleEvent; b: ScheduleEvent; minutes: number }[] = [];
  for (let index = 1; index < dated.length; index++) {
    const a = dated[index - 1];
    const b = dated[index];
    if (a.date !== b.date) continue;
    gaps.push({ a, b, minutes: timeToMinutes(b.startTime) - timeToMinutes(a.endTime) });
  }
  return gaps;
}

/** Consecutive days ending today (or yesterday) on which the routine was checked in. */
export function streak(checked: string[] | undefined, today: string): number {
  if (!checked?.length) return 0;
  const set = new Set(checked);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) { count++; cursor = addDays(cursor, -1); }
  return count;
}

/** Monday- or Sunday-started dates of the week containing `date`. */
export function weekDates(date: string, weekStart: "mon" | "sun"): string[] {
  const index = ALL_WEEK_DAYS.indexOf(weekdayOf(date));
  const back = weekStart === "mon" ? index : (index + 1) % 7;
  const first = addDays(date, -back);
  return Array.from({ length: 7 }, (_, offset) => addDays(first, offset));
}

export function orderedDays(weekStart: "mon" | "sun", showWeekend: boolean): WeekDay[] {
  const days = weekStart === "mon" ? ALL_WEEK_DAYS : [ALL_WEEK_DAYS[6], ...ALL_WEEK_DAYS.slice(0, 6)];
  return showWeekend ? days : days.filter((day) => day !== ALL_WEEK_DAYS[5] && day !== ALL_WEEK_DAYS[6]);
}

export function openTodos(todos: TodoItem[], date: string) {
  return todos.filter((todo) => todo.date === date);
}

export function numberMeta(event: ScheduleEvent, key: string): number {
  const value = Number(event.meta?.[key]);
  return Number.isFinite(value) ? value : 0;
}

export function stringMeta(event: ScheduleEvent, key: string): string {
  const value = event.meta?.[key];
  return value === undefined ? "" : String(value);
}
