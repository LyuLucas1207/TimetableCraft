import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PlannerId } from "@/config/planners";
import { TitlePreset, type TimetableSettings } from "@/types/course";
import { DEFAULT_PREFS, type PlannerColumn, type PlannerPrefs, type ScheduleEvent, type TodoItem } from "@/types/schedule";
import { DEFAULT_SETTINGS } from "@/utils/appearance";
import { createId } from "@/utils/ids";
import { localToday, validateScheduleEvent } from "@/utils/schedule";

export interface WorkRules { overtimeHours: number; currency: string }

export interface PlannerDocument {
  events: ScheduleEvent[];
  settings: TimetableSettings;
  date: string;
  /** Custom Timetable columns. Absent means the classic seven weekday columns. */
  columns?: PlannerColumn[];
  /** Study Planner weekly hour goal per subject. */
  goals?: Record<string, number>;
  /** Daily Planner to-dos. */
  todos?: TodoItem[];
  /** Routine Planner: event id → ISO dates checked off. */
  checkins?: Record<string, string[]>;
  prefs: PlannerPrefs;
  rules: WorkRules;
}

/** The slice of a document that undo/redo tracks. Appearance and navigation are deliberately excluded. */
type DataSnapshot = Pick<PlannerDocument, "events" | "columns" | "goals" | "todos" | "checkins">;
const DATA_KEYS = ["events", "columns", "goals", "todos", "checkins"] as const;
const HISTORY_LIMIT = 50;

export function emptyPlanner(): PlannerDocument {
  return {
    events: [], date: localToday(), prefs: { ...DEFAULT_PREFS }, rules: { overtimeHours: 40, currency: "$" },
    settings: { ...DEFAULT_SETTINGS, titlePreset: TitlePreset.Custom, title: "", showCredits: false, collapseEmptyTime: false, startTime: "07:00", endTime: "21:00" },
  };
}

export interface PlannerState {
  document: PlannerDocument;
  past: DataSnapshot[];
  future: DataSnapshot[];
  update: (patch: Partial<PlannerDocument>) => void;
  saveEvent: (event: ScheduleEvent) => void;
  /** `extra` lands in the same undo step, e.g. template columns. */
  appendEvents: (events: ScheduleEvent[], extra?: Partial<PlannerDocument>) => void;
  deleteEvent: (eventId: string) => void;
  /** Copy an event; returns the copy's id. */
  duplicateEvent: (eventId: string) => string | null;
  toggleCheckin: (eventId: string, date: string) => void;
  clear: () => void;
  replaceDocument: (document: PlannerDocument) => void;
  undo: () => void;
  redo: () => void;
}

function assertEvents(events: ScheduleEvent[]) {
  for (const event of events) { const error = validateScheduleEvent(event); if (error) throw new Error(error); }
}
const snapshot = (doc: PlannerDocument): DataSnapshot => ({ events: doc.events, columns: doc.columns, goals: doc.goals, todos: doc.todos, checkins: doc.checkins });

/** Fill gaps in saved data so documents written by older versions keep working. */
export function normalizeDocument(stored: Partial<PlannerDocument>, base = emptyPlanner()): PlannerDocument {
  return {
    ...base, ...stored,
    events: Array.isArray(stored.events) ? stored.events : base.events,
    settings: { ...base.settings, ...stored.settings },
    prefs: { ...base.prefs, ...stored.prefs },
    rules: { ...base.rules, ...stored.rules },
    date: typeof stored.date === "string" ? stored.date : base.date,
  };
}

/** Shared behavior, separate state, persistence key and hydration for every tool. */
export function createPlannerStore(id: PlannerId) {
  return create<PlannerState>()(persist((set, get) => ({
    document: emptyPlanner(), past: [], future: [],
    update: (patch) => set((state) => {
      const tracked = DATA_KEYS.some((key) => key in patch);
      return {
        document: { ...state.document, ...patch },
        ...(tracked ? { past: [...state.past, snapshot(state.document)].slice(-HISTORY_LIMIT), future: [] } : {}),
      };
    }),
    saveEvent: (event) => {
      assertEvents([event]);
      const events = get().document.events;
      get().update({ events: events.some((item) => item.id === event.id) ? events.map((item) => item.id === event.id ? event : item) : [...events, event] });
    },
    appendEvents: (events, extra) => { assertEvents(events); get().update({ ...extra, events: [...get().document.events, ...events] }); },
    deleteEvent: (eventId) => {
      const { events, checkins } = get().document;
      const rest = checkins && eventId in checkins ? Object.fromEntries(Object.entries(checkins).filter(([key]) => key !== eventId)) : checkins;
      get().update({ events: events.filter((event) => event.id !== eventId), ...(rest !== checkins ? { checkins: rest } : {}) });
    },
    duplicateEvent: (eventId) => {
      const source = get().document.events.find((event) => event.id === eventId);
      if (!source) return null;
      const copy = { ...source, id: createId(), done: false, meta: source.meta ? { ...source.meta } : undefined };
      get().appendEvents([copy]);
      return copy.id;
    },
    toggleCheckin: (eventId, date) => {
      const checkins = get().document.checkins ?? {};
      const days = checkins[eventId] ?? [];
      get().update({ checkins: { ...checkins, [eventId]: days.includes(date) ? days.filter((item) => item !== date) : [...days, date].sort() } });
    },
    clear: () => get().update({ events: [], columns: undefined, goals: undefined, todos: undefined, checkins: undefined }),
    replaceDocument: (document) => {
      const state = get();
      set({ document: normalizeDocument(document), past: [...state.past, snapshot(state.document)].slice(-HISTORY_LIMIT), future: [] });
    },
    undo: () => set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { document: { ...state.document, ...previous }, past: state.past.slice(0, -1), future: [snapshot(state.document), ...state.future].slice(0, HISTORY_LIMIT) };
    }),
    redo: () => set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return { document: { ...state.document, ...next }, past: [...state.past, snapshot(state.document)].slice(-HISTORY_LIMIT), future: state.future.slice(1) };
    }),
  }), {
    name: `timetablecraft:planner:${id}:v1`, storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ document: state.document }),
    merge: (saved, current) => {
      const stored = (saved as Partial<PlannerState>)?.document;
      if (!stored || !Array.isArray(stored.events)) return current;
      return { ...current, document: normalizeDocument(stored, current.document) };
    },
  }));
}

export const useWeeklyScheduleStore = createPlannerStore("weekly");
export const useStudyPlannerStore = createPlannerStore("study");
export const useExamTimetableStore = createPlannerStore("exam");
export const useWorkScheduleStore = createPlannerStore("work");
export const useDailyPlannerStore = createPlannerStore("daily");
export const useRoutinePlannerStore = createPlannerStore("routine");
export const useCustomTimetableStore = createPlannerStore("custom");

export const PLANNER_STORES = {
  weekly: useWeeklyScheduleStore, study: useStudyPlannerStore, exam: useExamTimetableStore,
  work: useWorkScheduleStore, daily: useDailyPlannerStore, routine: useRoutinePlannerStore, custom: useCustomTimetableStore,
} satisfies Record<PlannerId, ReturnType<typeof createPlannerStore>>;

export function usePlannerStore(id: PlannerId): PlannerState {
  return PLANNER_STORES[id]();
}
