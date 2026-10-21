import { WeekDay } from "@/types/course";
import type { PlannerColumn, ScheduleEvent } from "@/types/schedule";
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

const { Monday: MON, Tuesday: TUE, Wednesday: WED, Thursday: THU, Friday: FRI, Saturday: SAT, Sunday: SUN } = WeekDay;
const MWF = [MON, WED, FRI];
const TT = [TUE, THU];
const WEEKDAYS = [MON, TUE, WED, THU, FRI];
const ALL = [...WEEKDAYS, SAT, SUN];

const BLUE = "#DBEAFE", AMBER = "#FEF3C7", GREEN = "#D1FAE5", PINK = "#FCE7F3", PURPLE = "#EDE9FE", ORANGE = "#FFEDD5", TEAL = "#CCFBF1", GRAY = "#E5E7EB";

/** `title`, `subject`, `role` are keys under `samples.`; `cat` is a key under `categories.`. */
interface TemplateBlock {
  title: string; start: string; end: string; color: string; cat: string;
  days?: WeekDay[]; offset?: number; col?: number;
  subject?: string; role?: string; meta?: Record<string, number>; overnight?: boolean; reminder?: number; location?: string;
}
export interface PlannerTemplate {
  id: string;
  blocks: TemplateBlock[];
  /** Custom Timetable only: columns to create, either weekdays or named text columns (`samples.` keys). */
  columns?: ({ day: WeekDay } | { label: string })[];
}

const b = (title: string, start: string, end: string, color: string, cat: string, rest: Partial<TemplateBlock> = {}): TemplateBlock => ({ title, start, end, color, cat, ...rest });
const WEEKDAY_COLUMNS = WEEKDAYS.map((day) => ({ day }));

export const TEMPLATES: Record<PlannerId, PlannerTemplate[]> = {
  weekly: [
    { id: "workweek", blocks: [
      b("deepWork", "09:00", "11:00", BLUE, "focus", { days: MWF }), b("meetings", "10:00", "11:30", PURPLE, "work", { days: TT }),
      b("lunch", "12:00", "13:00", AMBER, "meal", { days: WEEKDAYS }), b("gym", "17:30", "18:30", GREEN, "health", { days: TT }),
      b("weekend", "10:00", "12:00", PINK, "personal", { days: [SAT] }),
    ] },
    { id: "student", blocks: [
      b("morningStudy", "08:00", "10:00", BLUE, "study", { days: WEEKDAYS }), b("lunch", "12:00", "13:00", AMBER, "meal", { days: WEEKDAYS }),
      b("library", "15:00", "17:00", PURPLE, "study", { days: MWF }), b("gym", "17:00", "18:00", GREEN, "health", { days: TT }),
      b("weekend", "10:00", "12:00", PINK, "personal", { days: [SAT] }), b("weeklyReview", "19:00", "20:00", ORANGE, "focus", { days: [SUN] }),
    ] },
    { id: "freelancer", blocks: [
      b("clientWork", "09:30", "12:30", BLUE, "work", { days: WEEKDAYS }), b("lunch", "12:30", "13:30", AMBER, "meal", { days: WEEKDAYS }),
      b("clientWork", "14:00", "17:00", BLUE, "work", { days: [MON, TUE, WED, THU] }), b("admin", "14:00", "16:00", TEAL, "work", { days: [FRI] }),
      b("gym", "17:30", "18:30", GREEN, "health", { days: MWF }),
    ] },
  ],
  study: [
    { id: "balanced", blocks: [
      b("review", "16:00", "17:30", BLUE, "study", { days: MWF, subject: "examCalculus" }), b("assignment", "14:00", "16:00", PURPLE, "study", { days: TT, subject: "examPhysics" }),
      b("examPrep", "10:00", "12:00", AMBER, "study", { days: [SAT], subject: "examProgramming" }), b("weeklyReview", "18:00", "19:00", ORANGE, "focus", { days: [SUN] }),
    ] },
    { id: "examSeason", blocks: [
      b("review", "08:00", "10:00", BLUE, "study", { days: WEEKDAYS, subject: "examCalculus" }), b("practice", "15:00", "17:00", PURPLE, "study", { days: MWF, subject: "examPhysics" }),
      b("practice", "15:00", "17:00", GREEN, "study", { days: TT, subject: "examProgramming" }), b("pastPapers", "10:00", "13:00", AMBER, "study", { days: [SAT], subject: "examEconomics" }),
    ] },
    { id: "light", blocks: [
      b("review", "20:00", "21:00", BLUE, "study", { days: [MON, TUE, WED, THU], subject: "examCalculus" }), b("assignment", "10:00", "12:00", PURPLE, "study", { days: [SUN], subject: "examPhysics" }),
    ] },
  ],
  exam: [
    { id: "midterms", blocks: [
      b("examCalculus", "09:00", "11:00", BLUE, "exam", { offset: 1, reminder: 120, meta: { duration: 120 } }),
      b("examPhysics", "13:00", "15:00", PURPLE, "exam", { offset: 3, reminder: 120, meta: { duration: 120 } }),
      b("examProgramming", "10:00", "12:00", GREEN, "exam", { offset: 6, reminder: 120, meta: { duration: 120 } }),
    ] },
    { id: "finals", blocks: [
      b("examCalculus", "09:00", "12:00", BLUE, "exam", { offset: 7, reminder: 120, meta: { duration: 180 } }),
      b("examPhysics", "14:00", "17:00", PURPLE, "exam", { offset: 9, reminder: 120, meta: { duration: 180 } }),
      b("examProgramming", "09:00", "12:00", GREEN, "exam", { offset: 12, reminder: 120, meta: { duration: 180 } }),
      b("examEconomics", "14:00", "17:00", ORANGE, "exam", { offset: 14, reminder: 120, meta: { duration: 180 } }),
    ] },
    { id: "single", blocks: [b("examOne", "09:00", "11:00", BLUE, "exam", { offset: 1, reminder: 120, meta: { duration: 120 } })] },
  ],
  work: [
    { id: "standard", blocks: [
      b("morningShift", "09:00", "17:00", BLUE, "shift", { days: MWF, meta: { breakMin: 60 } }), b("lateShift", "12:00", "20:00", AMBER, "shift", { days: TT, meta: { breakMin: 60 } }),
    ] },
    { id: "retail", blocks: [
      b("openShift", "08:00", "16:00", GREEN, "shift", { days: [MON, TUE, WED], role: "roleCashier", meta: { breakMin: 30 } }),
      b("midShift", "11:00", "19:00", AMBER, "shift", { days: [THU, FRI], role: "roleFloor", meta: { breakMin: 30 } }),
      b("closeShift", "14:00", "22:00", PURPLE, "shift", { days: [SAT], role: "roleCashier", meta: { breakMin: 30 } }),
    ] },
    { id: "nights", blocks: [
      b("nightShift", "22:00", "06:00", PURPLE, "shift", { days: [MON, TUE, WED, THU], overnight: true, meta: { breakMin: 45 } }),
    ] },
  ],
  daily: [
    { id: "workday", blocks: [
      b("morning", "07:00", "08:00", AMBER, "routine", { offset: 0 }), b("deepWork", "09:00", "11:00", BLUE, "focus", { offset: 0 }), b("lunch", "12:00", "13:00", GREEN, "meal", { offset: 0 }),
      b("meetings", "14:00", "15:00", PURPLE, "work", { offset: 0 }), b("review", "16:00", "17:00", ORANGE, "focus", { offset: 0 }), b("gym", "18:00", "19:00", TEAL, "health", { offset: 0 }),
    ] },
    { id: "studyDay", blocks: [
      b("morning", "07:00", "08:00", AMBER, "routine", { offset: 0 }), b("studyBlock", "09:00", "11:00", BLUE, "study", { offset: 0 }), b("lunch", "12:00", "13:00", GREEN, "meal", { offset: 0 }),
      b("studyBlock", "14:00", "16:00", PURPLE, "study", { offset: 0 }), b("break", "16:00", "16:30", GRAY, "rest", { offset: 0 }), b("review", "20:00", "21:00", ORANGE, "study", { offset: 0 }),
    ] },
    { id: "restDay", blocks: [
      b("slowMorning", "09:00", "10:00", AMBER, "rest", { offset: 0 }), b("errands", "11:00", "12:00", GRAY, "personal", { offset: 0 }), b("lunch", "12:30", "13:30", GREEN, "meal", { offset: 0 }),
      b("hobby", "15:00", "17:00", PINK, "personal", { offset: 0 }), b("social", "19:00", "21:00", ORANGE, "personal", { offset: 0 }),
    ] },
  ],
  routine: [
    { id: "morning", blocks: [
      b("wakeUp", "06:30", "07:00", AMBER, "routine", { days: ALL }), b("exercise", "07:00", "07:30", GREEN, "health", { days: ALL }),
      b("breakfast", "07:30", "08:00", ORANGE, "meal", { days: ALL }), b("journal", "08:00", "08:15", PURPLE, "personal", { days: ALL }),
    ] },
    { id: "fitness", blocks: [
      b("gym", "18:00", "19:00", GREEN, "health", { days: MWF }), b("run", "06:30", "07:15", TEAL, "health", { days: TT }),
      b("longRun", "08:00", "09:00", TEAL, "health", { days: [SAT] }), b("stretch", "22:00", "22:15", PURPLE, "health", { days: ALL }),
    ] },
    { id: "evening", blocks: [
      b("dinner", "18:30", "19:30", ORANGE, "meal", { days: ALL }), b("reading", "20:00", "21:00", PURPLE, "personal", { days: ALL }),
      b("meditation", "21:30", "21:45", TEAL, "health", { days: ALL }), b("windDown", "22:00", "22:30", GRAY, "rest", { days: ALL }),
    ] },
  ],
  custom: [
    { id: "weekdays", columns: WEEKDAY_COLUMNS, blocks: [
      b("yourEvent", "09:00", "10:30", BLUE, "personal", { col: 0 }), b("yourEvent", "14:00", "16:00", GREEN, "personal", { col: 4 }),
    ] },
    { id: "periods", columns: WEEKDAY_COLUMNS, blocks: [
      b("period1", "08:30", "09:20", BLUE, "class", { col: 0 }), b("period2", "09:30", "10:20", GREEN, "class", { col: 0 }), b("period1", "08:30", "09:20", PURPLE, "class", { col: 1 }),
      b("period3", "10:40", "11:30", AMBER, "class", { col: 2 }), b("period4", "13:00", "13:50", PINK, "class", { col: 3 }), b("period2", "09:30", "10:20", ORANGE, "class", { col: 4 }),
    ] },
    { id: "rooms", columns: [{ label: "roomA" }, { label: "roomB" }, { label: "roomC" }], blocks: [
      b("booking", "09:00", "10:30", BLUE, "booking", { col: 0 }), b("booking", "11:00", "12:00", GREEN, "booking", { col: 1 }), b("booking", "13:00", "15:00", PURPLE, "booking", { col: 2 }),
    ] },
    { id: "team", columns: [{ label: "personA" }, { label: "personB" }, { label: "personC" }], blocks: [
      b("task", "09:00", "11:00", BLUE, "work", { col: 0 }), b("task", "10:00", "12:00", AMBER, "work", { col: 1 }), b("task", "13:00", "15:00", GREEN, "work", { col: 2 }),
    ] },
  ],
};

export interface BuiltTemplate { events: ScheduleEvent[]; columns?: PlannerColumn[] }

/** Build fresh events (new ids every time) from a template. Custom templates also yield their columns. */
export function buildTemplate(id: PlannerId, templateId: string, date: string, translate: (key: string) => string, dayLabel: (day: WeekDay) => string): BuiltTemplate {
  const template = TEMPLATES[id].find((item) => item.id === templateId) ?? TEMPLATES[id][0];
  const columns = template.columns?.map<PlannerColumn>((column) => "day" in column
    ? { id: createId(), kind: "day", day: column.day, label: dayLabel(column.day) }
    : { id: createId(), kind: "text", label: translate(`samples.${column.label}`) });
  const events = template.blocks.map<ScheduleEvent>((block) => {
    const column = columns && block.col !== undefined ? columns[block.col] : undefined;
    const meta: Record<string, string | number> = { ...block.meta };
    if (block.subject) meta.subject = translate(`samples.${block.subject}`);
    if (block.role) meta.role = translate(`samples.${block.role}`);
    return {
      id: createId(), title: translate(`samples.${block.title}`), startTime: block.start, endTime: block.end, color: block.color,
      category: translate(`categories.${block.cat}`),
      ...(block.offset !== undefined ? { date: addDays(date, block.offset) } : column?.kind === "day" ? { days: [column.day!] } : column ? {} : { days: block.days }),
      ...(column ? { columnKey: column.id } : {}),
      ...(Object.keys(meta).length ? { meta } : {}),
      ...(block.overnight ? { overnight: true } : {}),
      ...(block.reminder !== undefined ? { reminderMinutes: block.reminder } : {}),
      ...(block.location ? { location: block.location } : {}),
    };
  });
  return { events, columns };
}
