import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PlannerId } from "@/config/planners";
import { TitlePreset, type TimetableSettings } from "@/types/course";
import type { ScheduleEvent } from "@/types/schedule";
import { DEFAULT_SETTINGS } from "@/utils/appearance";
import { localToday, validateScheduleEvent } from "@/utils/schedule";

export interface PlannerDocument {
  events: ScheduleEvent[];
  settings: TimetableSettings;
  date: string;
}
export function emptyPlanner(): PlannerDocument {
  return { events: [], date: localToday(), settings: { ...DEFAULT_SETTINGS, titlePreset: TitlePreset.Custom, title: "", showCredits: false, collapseEmptyTime: false, startTime: "07:00", endTime: "21:00" } };
}
export interface PlannerState {
  document: PlannerDocument;
  update: (patch: Partial<PlannerDocument>) => void;
  saveEvent: (event: ScheduleEvent) => void;
  appendEvents: (events: ScheduleEvent[]) => void;
  deleteEvent: (eventId: string) => void;
}
function assertEvents(events: ScheduleEvent[]) {
  for (const event of events) { const error = validateScheduleEvent(event); if (error) throw new Error(error); }
}
/** Shared behavior, separate state, persistence key and hydration for every tool. */
export function createPlannerStore(id: PlannerId) {
  return create<PlannerState>()(persist((set, get) => ({
    document: emptyPlanner(),
    update: (patch) => set((state) => ({ document: { ...state.document, ...patch } })),
    saveEvent: (event) => {
      assertEvents([event]);
      const events = get().document.events;
      get().update({ events: events.some((item) => item.id === event.id) ? events.map((item) => item.id === event.id ? event : item) : [...events, event] });
    },
    appendEvents: (events) => { assertEvents(events); get().update({ events: [...get().document.events, ...events] }); },
    deleteEvent: (eventId) => get().update({ events: get().document.events.filter((event) => event.id !== eventId) }),
  }), {
    name: `timetablecraft:planner:${id}:v1`, storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ document: state.document }),
    merge: (saved, current) => {
      const stored = (saved as Partial<PlannerState>)?.document;
      if (!stored || !Array.isArray(stored.events)) return current;
      return { ...current, document: { ...current.document, ...stored, settings: { ...current.document.settings, ...stored.settings } } };
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
