import { createEvents, type EventAttributes } from "ics";
import { ALL_WEEK_DAYS, type ScheduleEvent } from "@/types/schedule";
import { addDays, isValidDate, validateScheduleEvent } from "./schedule";
import { timeToMinutes } from "./time";

const BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

/** Floating local times: calendar apps interpret these in their local timezone. */
export function buildScheduleCalendar(events: ScheduleEvent[], title: string, range: { start: string; end: string }): string {
  if (!isValidDate(range.start) || !isValidDate(range.end) || range.end < range.start) throw new Error("errorDates");
  const entries: EventAttributes[] = [];
  for (const event of events) {
    const error = validateScheduleEvent(event);
    if (error) throw new Error(error);
    const start = event.startDate && event.startDate > range.start ? event.startDate : range.start;
    const end = event.endDate && event.endDate < range.end ? event.endDate : range.end;
    let first = event.date;
    if (!first) {
      if (end < start) continue;
      for (let offset = 0; offset < 7; offset++) {
        const candidate = addDays(start, offset);
        const weekday = ALL_WEEK_DAYS[(new Date(`${candidate}T12:00:00Z`).getUTCDay() + 6) % 7];
        if (candidate <= end && event.days?.includes(weekday)) { first = candidate; break; }
      }
    }
    if (!first) continue;
    const [year, month, day] = first.split("-").map(Number);
    const [hour, minute] = event.startTime.split(":").map(Number);
    entries.push({
      uid: `${event.id}@timetablecraft.com`, title: event.title,
      description: [event.subtitle, event.category].filter(Boolean).join("\n"), location: event.location,
      start: [year, month, day, hour, minute], startInputType: "local", startOutputType: "local",
      duration: { minutes: timeToMinutes(event.endTime) - timeToMinutes(event.startTime) },
      ...(event.date ? {} : { recurrenceRule: `FREQ=WEEKLY;BYDAY=${event.days!.map((day) => BYDAY[ALL_WEEK_DAYS.indexOf(day)]).join(",")};UNTIL=${end.replaceAll("-", "")}T235959` }),
      status: "CONFIRMED", busyStatus: "BUSY",
    });
  }
  if (!entries.length) throw new Error("errorNoEvents");
  const result = createEvents(entries, { productId: "TimetableCraft", calName: title });
  if (result.error || !result.value) throw new Error("errorExport");
  return result.value;
}
