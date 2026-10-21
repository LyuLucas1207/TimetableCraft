import { createEvents, type EventAttributes } from "ics";
import { ALL_WEEK_DAYS, type ScheduleEvent } from "@/types/schedule";
import { addDays, eventMinutes, isCalendarEvent, isValidDate, validateScheduleEvent, weekdayOf } from "./schedule";

const BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export interface CalendarOptions {
  /** Extra description lines per event (exam room, shift role…). */
  describe?: (event: ScheduleEvent) => string[];
}

/** Floating local times: calendar apps interpret these in their local timezone. */
export function buildScheduleCalendar(events: ScheduleEvent[], title: string, range: { start: string; end: string }, options: CalendarOptions = {}): string {
  if (!isValidDate(range.start) || !isValidDate(range.end) || range.end < range.start) throw new Error("errorDates");
  const entries: EventAttributes[] = [];
  for (const event of events.filter(isCalendarEvent)) {
    const error = validateScheduleEvent(event);
    if (error) throw new Error(error);
    const start = event.startDate && event.startDate > range.start ? event.startDate : range.start;
    const end = event.endDate && event.endDate < range.end ? event.endDate : range.end;
    let first = event.date;
    if (!first) {
      if (end < start) continue;
      for (let offset = 0; offset < 7; offset++) {
        const candidate = addDays(start, offset);
        if (candidate <= end && event.days?.includes(weekdayOf(candidate))) { first = candidate; break; }
      }
    }
    if (!first) continue;
    const [year, month, day] = first.split("-").map(Number);
    const [hour, minute] = event.startTime.split(":").map(Number);
    const description = [event.subtitle, event.category, ...(options.describe?.(event) ?? [])].filter(Boolean).join("\n");
    entries.push({
      uid: `${event.id}@timetablecraft.com`, title: event.title,
      description, location: event.location,
      start: [year, month, day, hour, minute], startInputType: "local", startOutputType: "local",
      duration: { minutes: eventMinutes(event) },
      ...(event.date ? {} : { recurrenceRule: `FREQ=WEEKLY;BYDAY=${event.days!.map((item) => BYDAY[ALL_WEEK_DAYS.indexOf(item)]).join(",")};UNTIL=${end.replaceAll("-", "")}T235959` }),
      ...(event.reminderMinutes !== undefined ? { alarms: [{ action: "display" as const, description: event.title, trigger: { minutes: event.reminderMinutes, before: true } }] } : {}),
      status: "CONFIRMED", busyStatus: "BUSY",
    });
  }
  if (!entries.length) throw new Error("errorNoEvents");
  const result = createEvents(entries, { productId: "TimetableCraft", calName: title });
  if (result.error || !result.value) throw new Error("errorExport");
  return result.value;
}
