import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { parseWorkdayExcel } from "@/parser/excelParser";
import { parseManualCourseCode, courseKeyOf, normalizeFormat } from "@/parser/courseListingParser";
import {
  ColorPreset,
  CourseSource,
  CourseType,
  courseTypeFromExcel,
  ImportMode,
  Term,
  termFromTitlePreset,
  TimetableTheme,
  TitlePreset,
  titlePresetFromTerm,
  type Course,
  type CourseMeeting,
  type ImportSummary,
  type InstructionalFormat,
  type TimetableSettings,
  type WeekDay,
} from "@/types/course";
import { appearanceFromTheme, DEFAULT_SETTINGS, isDefaultPresetTitle, titleFromPreset } from "@/utils/appearance";
import { pickRandomPaletteColor } from "@/utils/colors";
import { createId } from "@/utils/ids";

export interface ManualCourseInput {
  courseCode: string;
  section: string;
  title: string;
  term: Term;
  instructionalFormat: InstructionalFormat;
  courseType: CourseType;
  days: WeekDay[];
  startTime: string;
  endTime: string;
  building?: string;
  room?: string;
  instructor?: string;
  color: string;
  credits?: number;
}

interface ScheduleState {
  courses: Course[];
  selectedTerm: Term;
  settings: TimetableSettings;
  importSummary: ImportSummary | null;
  setTerm: (term: Term) => void;
  setSettings: (patch: Partial<TimetableSettings>) => void;
  setTitlePreset: (preset: TitlePreset, customTitle?: string) => void;
  commitTitle: (name: string) => void;
  importExcel: (file: File, mode: ImportMode) => Promise<ImportSummary>;
  addManualCourse: (input: ManualCourseInput) => Course;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  updateMeeting: (courseId: string, meeting: CourseMeeting) => void;
  deleteCourse: (id: string) => void;
  setCourseColor: (id: string, color: string) => void;
  toggleHidden: (id: string) => void;
  setOnTimetable: (id: string, onTimetable: boolean) => void;
  applyColorPreset: (preset: ColorPreset) => void;
  applyTheme: (theme: TimetableTheme) => void;
  reset: () => void;
}

function courseIdentity(course: Course): string {
  return `${course.courseKey}:${course.section}:${course.term}:${course.instructionalFormat}`;
}

function migrateCourse(course: Course & { registrationStatus?: string }): Course {
  return {
    ...course,
    courseType: course.courseType ?? (course.registrationStatus ? courseTypeFromExcel(course.registrationStatus) : CourseType.Active),
    source: course.source ?? CourseSource.Excel,
    onTimetable: course.onTimetable ?? false,
  };
}

function migrateFooterText(text: string | undefined): string {
  if (
    !text ||
    text === "Generated with UBCExcelToSchedule" ||
    text === "由 UBCExcelToSchedule 生成" ||
    text === "Généré avec UBCExcelToSchedule"
  ) {
    return DEFAULT_SETTINGS.footerText;
  }
  return text;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      courses: [],
      selectedTerm: Term.W1,
      settings: DEFAULT_SETTINGS,
      importSummary: null,
      setTerm: (term) => set({ selectedTerm: term }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setTitlePreset: (preset, customTitle) => {
        const settings = get().settings;
        const title =
          customTitle?.trim() ||
          (isDefaultPresetTitle(settings.titlePreset, settings.title) ? titleFromPreset(preset, settings.title) : settings.title);
        const term = termFromTitlePreset(preset);
        const courses =
          term == null
            ? get().courses
            : get().courses.map((course) => ({
                ...course,
                onTimetable: course.term === term && course.courseType !== CourseType.Drop,
              }));
        set({
          settings: { ...settings, titlePreset: preset, title, customTitles: [] },
          selectedTerm: term ?? get().selectedTerm,
          courses,
        });
      },
      commitTitle: (name) => {
        const title = name.trim();
        if (!title) return;
        const settings = get().settings;
        const titlePreset =
          settings.titlePreset === TitlePreset.Custom ? titlePresetFromTerm(get().selectedTerm) : settings.titlePreset;
        set({
          settings: {
            ...settings,
            title,
            titlePreset,
            customTitles: [],
          },
        });
      },
      importExcel: async (file, mode) => {
        const result = await parseWorkdayExcel(file, file.name);
        if (result.errors.length > 0) {
          throw new Error(result.errors[0]);
        }

        const incoming = result.courses;
        const nextCourses =
          mode === ImportMode.Replace
            ? incoming
            : [
                ...get().courses,
                ...incoming.filter((course) => !get().courses.some((existing) => courseIdentity(existing) === courseIdentity(course))),
              ];

        const summary: ImportSummary = {
          filename: result.filename,
          uniqueCourseCount: result.uniqueCourseCount,
          registeredSectionCount: result.registeredSectionCount,
          scheduledSectionCount: result.scheduledSectionCount,
          waitlistedCount: result.waitlistedCount,
          unregisteredCount: result.unregisteredCount,
        };

        set({ courses: nextCourses, importSummary: summary });
        return summary;
      },
      addManualCourse: (input) => {
        const parsed = parseManualCourseCode(input.courseCode);
        if (!parsed) {
          throw new Error("invalid-course-code");
        }
        const courseKey = courseKeyOf(parsed.subject, parsed.courseNumber);
        const existingColor = get().courses.find((course) => course.courseKey === courseKey)?.color;
        const meeting: CourseMeeting | null =
          input.days.length > 0
            ? {
                id: createId(),
                days: input.days,
                startTime: input.startTime,
                endTime: input.endTime,
                building: input.building,
                room: input.room,
              }
            : null;

        const course: Course = {
          id: createId(),
          subject: parsed.subject,
          courseNumber: parsed.courseNumber,
          section: input.section.trim(),
          title: input.title.trim(),
          term: input.term,
          instructionalFormat: normalizeFormat(input.instructionalFormat),
          courseType: input.courseType,
          instructor: input.instructor?.trim() || undefined,
          credits: input.credits,
          meetings: meeting ? [meeting] : [],
          color: input.color || existingColor || pickRandomPaletteColor(get().settings.colorPreset),
          source: CourseSource.Manual,
          hidden: false,
          onTimetable: true,
          courseKey,
        };
        set({ courses: [...get().courses, course] });
        return course;
      },
      updateCourse: (id, patch) => {
        set({
          courses: get().courses.map((course) => (course.id === id ? { ...course, ...patch } : course)),
        });
      },
      updateMeeting: (courseId, meeting) => {
        set({
          courses: get().courses.map((course) => {
            if (course.id !== courseId) return course;
            const exists = course.meetings.some((item) => item.id === meeting.id);
            return {
              ...course,
              meetings: exists ? course.meetings.map((item) => (item.id === meeting.id ? meeting : item)) : [...course.meetings, meeting],
            };
          }),
        });
      },
      deleteCourse: (id) => set({ courses: get().courses.filter((course) => course.id !== id) }),
      setCourseColor: (id, color) => {
        const target = get().courses.find((course) => course.id === id);
        if (!target) return;
        set({
          courses: get().courses.map((course) => (course.courseKey === target.courseKey ? { ...course, color } : course)),
        });
      },
      toggleHidden: (id) => {
        set({
          courses: get().courses.map((course) => (course.id === id ? { ...course, hidden: !course.hidden } : course)),
        });
      },
      setOnTimetable: (id, onTimetable) => {
        set({
          courses: get().courses.map((course) => (course.id === id ? { ...course, onTimetable } : course)),
        });
      },
      applyColorPreset: (preset) => {
        const assigned = new Map<string, string>();
        const used: string[] = [];
        set({
          settings: { ...get().settings, colorPreset: preset },
          courses: get().courses.map((course) => {
            let color = assigned.get(course.courseKey);
            if (!color) {
              color = pickRandomPaletteColor(preset, used);
              used.push(color);
              assigned.set(course.courseKey, color);
            }
            return { ...course, color };
          }),
        });
      },
      applyTheme: (theme) => {
        set({ settings: { ...get().settings, ...appearanceFromTheme(theme) } });
      },
      reset: () => set({ courses: [], importSummary: null, settings: DEFAULT_SETTINGS, selectedTerm: Term.W1 }),
    }),
    {
      name: "timetablecraft:v1",
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name) ?? localStorage.getItem("ubcexceltoschedule:v3"),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => {
          localStorage.removeItem(name);
          localStorage.removeItem("ubcexceltoschedule:v3");
        },
      })),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<ScheduleState>;
        const mergedSettings = { ...DEFAULT_SETTINGS, ...persisted.settings };
        const titlePreset =
          mergedSettings.titlePreset === TitlePreset.Custom
            ? titlePresetFromTerm(persisted.selectedTerm ?? currentState.selectedTerm)
            : mergedSettings.titlePreset;
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...mergedSettings,
            titlePreset,
            customTitles: [],
            footerText: migrateFooterText(mergedSettings.footerText),
          },
          courses: (persisted.courses ?? []).map((course) => migrateCourse(course as Course & { registrationStatus?: string })),
        };
      },
      partialize: (state) => ({
        courses: state.courses,
        selectedTerm: state.selectedTerm,
        settings: state.settings,
        importSummary: state.importSummary,
      }),
    },
  ),
);

export function selectTimetableCourses(courses: Course[]): Course[] {
  return courses.filter((course) => course.onTimetable && !course.hidden);
}

export function selectVisibleCourses(courses: Course[], term: Term): Course[] {
  return selectTimetableCourses(courses).filter((course) => course.term === term);
}
