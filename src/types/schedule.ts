import { WeekDay, type BlockBorderStyle } from "./course";

export const ALL_WEEK_DAYS = Object.values(WeekDay);

/** Date takes precedence over days. Empty days denotes an unscheduled item. */
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
}

export interface ScheduleColumn {
  key: string;
  label: string;
  day?: WeekDay;
  date?: string;
}
