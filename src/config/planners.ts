import { WeekDay } from "@/types/course";
import type { ScheduleEvent } from "@/types/schedule";
import { createId } from "@/utils/ids";
import { addDays } from "@/utils/schedule";

export const PLANNERS = [
  { id: "weekly", slug: "weekly-schedule", mode: "week" },
  { id: "study", slug: "study-planner", mode: "week" },
  { id: "exam", slug: "exam-timetable", mode: "dates" },
  { id: "work", slug: "work-schedule", mode: "week" },
  { id: "daily", slug: "daily-planner", mode: "day" },
  { id: "routine", slug: "routine-planner", mode: "week" },
  { id: "custom", slug: "custom-timetable", mode: "week" },
] as const;
export type PlannerId = typeof PLANNERS[number]["id"];
export type PlannerDefinition = typeof PLANNERS[number];
export const plannerPath = (planner: PlannerDefinition) => `/tools/${planner.slug}`;

const MWF = [WeekDay.Monday, WeekDay.Wednesday, WeekDay.Friday];
const TT = [WeekDay.Tuesday, WeekDay.Thursday];
const WEEK = [...MWF, ...TT];
interface TemplateBlock { title: string; start: string; end: string; days?: WeekDay[]; offset?: number; color: string; }
export const TEMPLATES: Record<PlannerId, TemplateBlock[]> = {
  weekly: [
    { title: "deepWork", start: "09:00", end: "11:00", days: MWF, color: "#DBEAFE" },
    { title: "lunch", start: "12:00", end: "13:00", days: WEEK, color: "#FEF3C7" },
    { title: "gym", start: "17:00", end: "18:00", days: TT, color: "#D1FAE5" },
    { title: "weekend", start: "10:00", end: "12:00", days: [WeekDay.Saturday], color: "#FCE7F3" },
  ],
  study: [
    { title: "review", start: "16:00", end: "17:30", days: MWF, color: "#DBEAFE" },
    { title: "assignment", start: "14:00", end: "16:00", days: TT, color: "#EDE9FE" },
    { title: "examPrep", start: "10:00", end: "12:00", days: [WeekDay.Saturday], color: "#FEF3C7" },
  ],
  exam: [
    { title: "examOne", start: "09:00", end: "11:00", offset: 1, color: "#DBEAFE" },
    { title: "examTwo", start: "13:00", end: "15:00", offset: 3, color: "#EDE9FE" },
  ],
  work: [
    { title: "morningShift", start: "09:00", end: "17:00", days: MWF, color: "#DBEAFE" },
    { title: "lateShift", start: "12:00", end: "20:00", days: TT, color: "#FEF3C7" },
  ],
  daily: [
    { title: "morning", start: "07:00", end: "08:00", offset: 0, color: "#FEF3C7" },
    { title: "deepWork", start: "09:00", end: "11:00", offset: 0, color: "#DBEAFE" },
    { title: "lunch", start: "12:00", end: "13:00", offset: 0, color: "#D1FAE5" },
    { title: "review", start: "16:00", end: "17:00", offset: 0, color: "#EDE9FE" },
  ],
  routine: [
    { title: "morning", start: "07:00", end: "08:00", days: WEEK, color: "#FEF3C7" },
    { title: "gym", start: "18:00", end: "19:00", days: MWF, color: "#D1FAE5" },
    { title: "reading", start: "20:00", end: "21:00", days: TT, color: "#EDE9FE" },
  ],
  custom: [
    { title: "yourEvent", start: "09:00", end: "10:30", days: [WeekDay.Monday], color: "#DBEAFE" },
    { title: "yourEvent", start: "14:00", end: "16:00", days: [WeekDay.Friday], color: "#D1FAE5" },
  ],
};
export function templateEvents(id: PlannerId, date: string, translate: (key: string) => string): ScheduleEvent[] {
  return TEMPLATES[id].map((block) => ({ id: createId(), title: translate(`samples.${block.title}`), startTime: block.start, endTime: block.end,
    color: block.color, category: translate(`tools.${id}.name`), ...(block.offset !== undefined ? { date: addDays(date, block.offset) } : { days: block.days }),
  }));
}
