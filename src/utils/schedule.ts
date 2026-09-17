import { COURSE_TYPE_BORDER, CourseType, type Course } from "@/types/course";
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

export function eventMatchesColumn(event: ScheduleEvent, column: ScheduleColumn): boolean {
  if (event.date) return event.date === column.date;
  if (column.date) {
    if (event.startDate && column.date < event.startDate || event.endDate && column.date > event.endDate) return false;
    const weekday = ALL_WEEK_DAYS[(new Date(`${column.date}T12:00:00Z`).getUTCDay() + 6) % 7];
    return Boolean(event.days?.includes(weekday));
  }
  return Boolean(column.day && event.days?.includes(column.day));
}

/** Return a localization key, so storage and forms share validation. */
export function validateScheduleEvent(event: ScheduleEvent): string | null {
  if (!event.title.trim()) return "errorTitle";
  if (!/^#[0-9a-f]{6}$/i.test(event.color)) return "errorColor";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.endTime) || timeToMinutes(event.endTime) <= timeToMinutes(event.startTime)) return "errorTime";
  if (event.date ? !isValidDate(event.date) : !event.days?.length || event.days.some((day) => !ALL_WEEK_DAYS.includes(day))) return "errorDay";
  if (event.startDate && !isValidDate(event.startDate) || event.endDate && !isValidDate(event.endDate) || event.startDate && event.endDate && event.startDate > event.endDate) return "errorDates";
  return null;
}
