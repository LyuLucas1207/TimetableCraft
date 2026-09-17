import { createEvents, type DateArray, type EventAttributes } from "ics";

import { WeekDay, type Course, type CourseMeeting } from "@/types/course";
import { timeToMinutes } from "@/utils/time";

const ICS_BYDAY: Record<WeekDay, string> = {
  [WeekDay.Monday]: "MO",
  [WeekDay.Tuesday]: "TU",
  [WeekDay.Wednesday]: "WE",
  [WeekDay.Thursday]: "TH",
  [WeekDay.Friday]: "FR",
  [WeekDay.Saturday]: "SA",
  [WeekDay.Sunday]: "SU",
};

const JS_WEEKDAY: Record<WeekDay, number> = {
  [WeekDay.Monday]: 1,
  [WeekDay.Tuesday]: 2,
  [WeekDay.Wednesday]: 3,
  [WeekDay.Thursday]: 4,
  [WeekDay.Friday]: 5,
  [WeekDay.Saturday]: 6,
  [WeekDay.Sunday]: 0,
};

export function buildIcsCalendar(courses: Course[], calendarName: string): string | null {
  const range = inferDateRange(courses);
  const events: EventAttributes[] = [];

  for (const course of courses) {
    for (const meeting of course.meetings) {
      const event = meetingToEvent(course, meeting, range);
      if (event) events.push(event);
    }
  }

  if (events.length === 0) return null;

  const { error, value } = createEvents(events, {
    productId: "Timetable Craft",
    calName: calendarName,
  });
  if (error || !value) return null;
  return value;
}

function meetingToEvent(
  course: Course,
  meeting: CourseMeeting,
  fallback: { startDate: string; endDate: string } | null,
): EventAttributes | null {
  if (meeting.days.length === 0) return null;

  const startDate = meeting.startDate ?? fallback?.startDate;
  const endDate = meeting.endDate ?? fallback?.endDate;
  if (!startDate || !endDate) return null;

  const startHm = parseHourMinute(meeting.startTime);
  const endHm = parseHourMinute(meeting.endTime);
  if (!startHm || !endHm) return null;

  const durationMinutes = timeToMinutes(meeting.endTime) - timeToMinutes(meeting.startTime);
  if (durationMinutes <= 0) return null;

  const first = firstOccurrence(startDate, meeting.days);
  if (!first || compareIso(toIso(first), endDate) > 0) return null;

  const byday = meeting.days.map((day) => ICS_BYDAY[day]).join(",");
  const title = `${course.subject} ${course.courseNumber}`.trim();
  const location = [meeting.building ?? meeting.buildingName, meeting.room].filter(Boolean).join(" ");

  return {
    title: course.instructionalFormat ? `${title} ${course.instructionalFormat}` : title,
    description: [course.title, course.section && `Section ${course.section}`, course.instructor]
      .filter(Boolean)
      .join("\n"),
    location: location || undefined,
    start: [first.y, first.m, first.d, startHm.hour, startHm.minute] satisfies DateArray,
    startInputType: "local",
    startOutputType: "local",
    duration: { hours: Math.floor(durationMinutes / 60), minutes: durationMinutes % 60 },
    recurrenceRule: `FREQ=WEEKLY;BYDAY=${byday};UNTIL=${untilStamp(endDate)}`,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    uid: `${course.id}-${meeting.id}@timetablecraft.com`,
  };
}

function inferDateRange(courses: Course[]): { startDate: string; endDate: string } | null {
  let startDate: string | undefined;
  let endDate: string | undefined;
  for (const course of courses) {
    for (const meeting of course.meetings) {
      if (meeting.startDate && (!startDate || meeting.startDate < startDate)) {
        startDate = meeting.startDate;
      }
      if (meeting.endDate && (!endDate || meeting.endDate > endDate)) {
        endDate = meeting.endDate;
      }
    }
  }
  if (!startDate || !endDate) return null;
  return { startDate, endDate };
}

function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function toIso(parts: { y: number; m: number; d: number }): string {
  return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
}

function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function parseHourMinute(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function firstOccurrence(startDate: string, days: WeekDay[]): { y: number; m: number; d: number } | null {
  const start = parseIso(startDate);
  if (!start) return null;
  const wanted = new Set(days.map((day) => JS_WEEKDAY[day]));
  for (let offset = 0; offset < 7; offset += 1) {
    const next = addUtcDays(start, offset);
    const js = new Date(Date.UTC(next.y, next.m - 1, next.d)).getUTCDay();
    if (wanted.has(js)) return next;
  }
  return null;
}

function addUtcDays(parts: { y: number; m: number; d: number }, days: number): { y: number; m: number; d: number } {
  const date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + days));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function untilStamp(endDate: string): string {
  const parsed = parseIso(endDate);
  if (!parsed) return `${endDate.replaceAll("-", "")}T235959`;
  return `${parsed.y}${String(parsed.m).padStart(2, "0")}${String(parsed.d).padStart(2, "0")}T235959`;
}
