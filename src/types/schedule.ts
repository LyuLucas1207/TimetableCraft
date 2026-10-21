import { WeekDay, type BlockBorderStyle } from "./course";

export const ALL_WEEK_DAYS = Object.values(WeekDay);

export type Priority = "low" | "medium" | "high";

/** Date takes precedence over days. Empty days denotes an unscheduled item (unless a custom column places it). */
export interface ScheduleEvent {
  id: string;
  title: string;
  subtitle?: string;
  days?: WeekDay[];
  date?: string;
  startTime: string;
  endTime: string;
  location?: string;
  color: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sourceCourseId?: string;
  borderStyle?: BlockBorderStyle;
  muted?: boolean;
  /** Planner-only extras below. All optional so older saved data stays valid. */
  priority?: Priority;
  done?: boolean;
  /** Minutes before the start for the calendar alarm. */
  reminderMinutes?: number;
  /** Tool-specific fields: exam code/seat, shift role/break/rate, study subject… */
  meta?: Record<string, string | number>;
  /** The block runs past midnight into the next day. End time is then earlier than start time. */
  overnight?: boolean;
  /** Custom Timetable column id. */
  columnKey?: string;
  /** Set on render-only segments of an overnight event; points to the stored event. */
  baseId?: string;
}

export interface ScheduleColumn {
  key: string;
  label: string;
  day?: WeekDay;
  date?: string;
  /** Optional accent drawn on top of the column header. */
  color?: string;
}

/** A column of the Custom Timetable. `text` columns hold things like rooms or people. */
export interface PlannerColumn {
  id: string;
  label: string;
  kind: "day" | "date" | "text";
  day?: WeekDay;
  date?: string;
  color?: string;
}

export interface TodoItem {
  id: string;
  date: string;
  title: string;
  done: boolean;
  top?: boolean;
}

export interface PlannerPrefs {
  weekStart: "mon" | "sun";
  hour24: boolean;
  showWeekend: boolean;
}

export const DEFAULT_PREFS: PlannerPrefs = { weekStart: "mon", hour24: false, showWeekend: true };
