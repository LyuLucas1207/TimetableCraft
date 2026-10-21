import { COURSE_TYPE_BORDER, CourseType, type Course } from "@/types/course";
import type { WeekDay } from "@/types/course";
import { ALL_WEEK_DAYS, type ScheduleColumn, type ScheduleEvent } from "@/types/schedule";
import { formatCourseCode, formatCourseSection } from "@/parser/courseListingParser";
import { formatLocation } from "@/parser/meetingPatternParser";
import { timeToMinutes } from "./time";

export function coursesToEvents(courses: Course[], showSections = true): ScheduleEvent[] {
  return courses.flatMap<ScheduleEvent>((course) => {
    const base = {
      title: showSections ? formatCourseSection(course.subject, course.courseNumber, course.section) : formatCourseCode(course.subject, course.courseNumber),
      subtitle: course.title, color: course.color, category: course.instructionalFormat,
      sourceCourseId: course.id, borderStyle: COURSE_TYPE_BORDER[course.courseType], muted: course.courseType === CourseType.Waitlist,
    };
    if (!course.meetings.length) return [{ ...base, id: course.id, days: [], startTime: "", endTime: "" }];
    return course.meetings.map((meeting) => ({ ...base, id: `${course.id}:${meeting.id}`, days: [...meeting.days], startTime: meeting.startTime, endTime: meeting.endTime,
      location: formatLocation(meeting), startDate: meeting.startDate, endDate: meeting.endDate,
    }));
  });
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function localToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): WeekDay {
  return ALL_WEEK_DAYS[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7];
}

export function nextWeekday(day: WeekDay): WeekDay {
  return ALL_WEEK_DAYS[(ALL_WEEK_DAYS.indexOf(day) + 1) % 7];
}

/** Length of one occurrence in minutes; overnight events wrap past midnight. */
export function eventMinutes(event: Pick<ScheduleEvent, "startTime" | "endTime" | "overnight">): number {
  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  if (end > start) return end - start;
  return event.overnight && end < start ? 1440 - start + end : 0;
}

/** Split overnight events at midnight for rendering; the stored event is left untouched. */
export function expandOvernight(events: ScheduleEvent[]): ScheduleEvent[] {
  return events.flatMap<ScheduleEvent>((event) => {
    if (!event.overnight || timeToMinutes(event.endTime) >= timeToMinutes(event.startTime)) return [event];
    const first: ScheduleEvent = { ...event, id: `${event.id}#a`, baseId: event.id, endTime: "24:00", overnight: false };
    if (event.endTime === "00:00") return [first];
    const second: ScheduleEvent = { ...event, id: `${event.id}#b`, baseId: event.id, startTime: "00:00", overnight: false };
    if (event.date) second.date = addDays(event.date, 1);
    else second.days = event.days?.map(nextWeekday);
    if (event.startDate) second.startDate = addDays(event.startDate, 1);
    if (event.endDate) second.endDate = addDays(event.endDate, 1);
    return [first, second];
  });
}

export function eventMatchesColumn(event: ScheduleEvent, column: ScheduleColumn): boolean {
  if (event.columnKey) return event.columnKey === column.key;
  if (event.date) return event.date === column.date;
  if (column.date) {
    if (event.startDate && column.date < event.startDate || event.endDate && column.date > event.endDate) return false;
    return Boolean(event.days?.includes(weekdayOf(column.date)));
  }
  return Boolean(column.day && event.days?.includes(column.day));
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Return a localization key, so storage and forms share validation. */
export function validateScheduleEvent(event: ScheduleEvent): string | null {
  if (!event.title.trim()) return "errorTitle";
  if (!/^#[0-9a-f]{6}$/i.test(event.color)) return "errorColor";
  if (!TIME_PATTERN.test(event.startTime) || !TIME_PATTERN.test(event.endTime)) return "errorTime";
  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  if (end <= start && !(event.overnight && end < start)) return "errorTime";
  if (event.date ? !isValidDate(event.date) : !event.columnKey && (!event.days?.length || event.days.some((day) => !ALL_WEEK_DAYS.includes(day)))) return "errorDay";
  if (event.startDate && !isValidDate(event.startDate) || event.endDate && !isValidDate(event.endDate) || event.startDate && event.endDate && event.startDate > event.endDate) return "errorDates";
  if (event.reminderMinutes !== undefined && (!Number.isInteger(event.reminderMinutes) || event.reminderMinutes < 0 || event.reminderMinutes > 40320)) return "errorReminder";
  return null;
}

/** An event can reach a calendar file only if it has a date or weekdays. */
export function isCalendarEvent(event: ScheduleEvent): boolean {
  return Boolean(event.date || event.days?.length);
}
