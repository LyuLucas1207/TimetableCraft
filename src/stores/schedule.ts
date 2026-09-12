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
  TERMS,
  termFromTitlePreset,
  TimetableTheme,
  TitlePreset,
  titlePresetFromTerm,
  ExportAspect,
  EXPORT_ASPECTS,
  type Course,
  type CourseMeeting,
  type CustomTimetable,
  type ImportSummary,
  type InstructionalFormat,
  type TimetableSettings,
  type WeekDay,
} from "@/types/course";
import { appearanceFromTheme, DEFAULT_SETTINGS, isDefaultPresetTitle, titleFromPreset } from "@/utils/appearance";
import { pickRandomPaletteColor } from "@/utils/colors";
import { createId } from "@/utils/ids";
import { parseOptionalTimeRange } from "@/utils/time";

export interface ManualCourseInput {
  courseCode: string;
  section: string;
  title: string;
  term: Term;
  instructionalFormat: InstructionalFormat;
  courseType: CourseType;
  days: WeekDay[];
  startTime?: string;
  endTime?: string;
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
  addCustomTimetable: (baseTitle: string) => void;
  selectCustomTimetable: (id: string) => void;
  removeCustomTimetable: (id: string) => void;
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

function placeTermOnTimetable(courses: Course[], term: Term): Course[] {
  return courses.map((course) => ({
    ...course,
    onTimetable: course.term === term && course.courseType !== CourseType.Drop,
  }));
}

function snapshotCustomCourseIds(courses: Course[]): string[] {
  return courses.filter((course) => course.onTimetable).map((course) => course.id);
}

function applyCustomCourseIds(courses: Course[], ids: string[]): Course[] {
  const selected = new Set(ids);
  return courses.map((course) => ({
    ...course,
    onTimetable: selected.has(course.id),
  }));
}

function nextCustomTitle(existing: CustomTimetable[], base: string): string {
  const names = new Set(existing.map((item) => item.title));
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

function writeActiveCustom(settings: TimetableSettings, courses: Course[]): CustomTimetable[] {
  if (settings.titlePreset !== TitlePreset.Custom || !settings.activeCustomId) return settings.customTimetables ?? [];
  const courseIds = snapshotCustomCourseIds(courses);
  const title = settings.title.trim() || settings.customTimetables.find((item) => item.id === settings.activeCustomId)?.title || "";
  return (settings.customTimetables ?? []).map((item) =>
    item.id === settings.activeCustomId ? { ...item, courseIds, title: title || item.title } : item,
  );
}

function withActiveCustom(settings: TimetableSettings, customTimetables: CustomTimetable[], active: CustomTimetable): TimetableSettings {
  return {
    ...settings,
    titlePreset: TitlePreset.Custom,
    title: active.title,
    customTimetables,
    activeCustomId: active.id,
  };
}

function migrateCustomTimetables(settings: TimetableSettings & { customTitles?: string[]; customCourseIds?: string[] }): {
  customTimetables: CustomTimetable[];
  activeCustomId: string | null;
} {
  const existing = Array.isArray(settings.customTimetables)
    ? settings.customTimetables.filter(
        (item): item is CustomTimetable =>
          Boolean(item) && typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.courseIds),
      )
    : [];
  if (existing.length > 0) {
    const active =
      existing.some((item) => item.id === settings.activeCustomId) ? settings.activeCustomId : settings.titlePreset === TitlePreset.Custom ? existing[0].id : null;
    return { customTimetables: existing, activeCustomId: active };
  }
  const titles = (settings.customTitles ?? []).filter((name): name is string => typeof name === "string" && name.trim().length > 0);
  if (titles.length === 0) return { customTimetables: [], activeCustomId: null };
  const courseIds = Array.isArray(settings.customCourseIds) ? settings.customCourseIds.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  const customTimetables = titles.map((title, index) => ({
    id: `migrated-custom-${index}`,
    title,
    courseIds: index === 0 ? courseIds : [],
  }));
  return {
    customTimetables,
    activeCustomId: settings.titlePreset === TitlePreset.Custom ? customTimetables[0].id : null,
  };
}

function termToPlaceAfterImport(courses: Course[], preferred: Term): Term {
  const counts = Object.fromEntries(TERMS.map((term) => [term, 0])) as Record<Term, number>;
  for (const course of courses) {
    if (course.courseType === CourseType.Drop) continue;
    counts[course.term] += 1;
  }
  if (counts[preferred] > 0) return preferred;
  return TERMS.reduce((best, term) => (counts[term] > counts[best] ? term : best), preferred);
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
        const currentCourses = get().courses;
        const customTimetables = writeActiveCustom(settings, currentCourses);
        const leavingCustom = settings.titlePreset === TitlePreset.Custom;
        const usePresetTitle = leavingCustom || isDefaultPresetTitle(settings.titlePreset, settings.title);
        const title = customTitle?.trim() || (usePresetTitle ? titleFromPreset(preset, settings.title) : settings.title);
        const term = termFromTitlePreset(preset);
        if (preset === TitlePreset.Custom) {
          const active = customTimetables.find((item) => item.id === settings.activeCustomId) ?? customTimetables[0];
          if (!active) return;
          set({
            settings: withActiveCustom(settings, customTimetables, active),
            courses: applyCustomCourseIds(currentCourses, active.courseIds),
          });
          return;
        }
        set({
          settings: {
            ...settings,
            titlePreset: preset,
            title,
            customTimetables,
            activeCustomId: null,
          },
          selectedTerm: term ?? get().selectedTerm,
          courses: term == null ? currentCourses : placeTermOnTimetable(currentCourses, term),
        });
      },
      commitTitle: (name) => {
        const title = name.trim();
        if (!title) return;
        const settings = get().settings;
        if (settings.titlePreset === TitlePreset.Custom && settings.activeCustomId) {
          set({
            settings: {
              ...settings,
              title,
              customTimetables: (settings.customTimetables ?? []).map((item) =>
                item.id === settings.activeCustomId ? { ...item, title } : item,
              ),
            },
          });
          return;
        }
        set({
          settings: {
            ...settings,
            title,
          },
        });
      },
      addCustomTimetable: (baseTitle) => {
        const settings = get().settings;
        const currentCourses = get().courses;
        const customTimetables = writeActiveCustom(settings, currentCourses);
        const title = nextCustomTitle(customTimetables, baseTitle.trim() || "Custom");
        const created: CustomTimetable = {
          id: createId(),
          title,
          courseIds: snapshotCustomCourseIds(currentCourses),
        };
        set({
          settings: withActiveCustom(settings, [...customTimetables, created], created),
          courses: currentCourses,
        });
      },
      selectCustomTimetable: (id) => {
        const settings = get().settings;
        const currentCourses = get().courses;
        const customTimetables = writeActiveCustom(settings, currentCourses);
        const active = customTimetables.find((item) => item.id === id);
        if (!active) return;
        set({
          settings: withActiveCustom(settings, customTimetables, active),
          courses: applyCustomCourseIds(currentCourses, active.courseIds),
        });
      },
      removeCustomTimetable: (id) => {
        const settings = get().settings;
        const currentCourses = get().courses;
        const customTimetables = writeActiveCustom(settings, currentCourses).filter((item) => item.id !== id);
        const removingActive = settings.activeCustomId === id;
        if (!removingActive) {
          set({ settings: { ...settings, customTimetables } });
          return;
        }
        const next = customTimetables[0];
        if (next) {
          set({
            settings: withActiveCustom(settings, customTimetables, next),
            courses: applyCustomCourseIds(currentCourses, next.courseIds),
          });
          return;
        }
        const term = get().selectedTerm;
        const preset = titlePresetFromTerm(term);
        set({
          settings: {
            ...settings,
            titlePreset: preset,
            title: titleFromPreset(preset, settings.title),
            customTimetables: [],
            activeCustomId: null,
          },
          courses: placeTermOnTimetable(currentCourses, term),
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

        const settings = get().settings;
        const preferred = termFromTitlePreset(settings.titlePreset) ?? get().selectedTerm;
        const term = termToPlaceAfterImport(nextCourses, preferred);
        const titlePreset = titlePresetFromTerm(term);
        const title = isDefaultPresetTitle(settings.titlePreset, settings.title)
          ? titleFromPreset(titlePreset, settings.title)
          : settings.title;

        set({
          courses: placeTermOnTimetable(nextCourses, term),
          selectedTerm: term,
          settings: {
            ...settings,
            titlePreset,
            title,
            customTimetables: (settings.customTimetables ?? []).map((item) => ({
              ...item,
              courseIds: mode === ImportMode.Replace ? [] : item.courseIds.filter((id) => nextCourses.some((course) => course.id === id)),
            })),
            activeCustomId: null,
          },
          importSummary: summary,
        });
        return summary;
      },
      addManualCourse: (input) => {
        const parsed = parseManualCourseCode(input.courseCode);
        if (!parsed) {
          throw new Error("invalid-course-code");
        }
        const courseKey = courseKeyOf(parsed.subject, parsed.courseNumber);
        const existingColor = get().courses.find((course) => course.courseKey === courseKey)?.color;
        const range = parseOptionalTimeRange(input.startTime, input.endTime);
        const meeting: CourseMeeting | null =
          input.days.length > 0 && range !== "empty" && range !== "invalid"
            ? {
                id: createId(),
                days: input.days,
                startTime: range.startTime,
                endTime: range.endTime,
                building: input.building?.trim() || undefined,
                room: input.room?.trim() || undefined,
              }
            : null;

        const course: Course = {
          id: createId(),
          subject: parsed.subject,
          courseNumber: parsed.courseNumber,
          section: input.section.trim(),
          title: input.title.trim() || parsed.title || "",
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
        const nextCourses = [...get().courses, course];
        const settings = get().settings;
        set({
          courses: nextCourses,
          settings:
            settings.titlePreset === TitlePreset.Custom && settings.activeCustomId
              ? {
                  ...settings,
                  customTimetables: (settings.customTimetables ?? []).map((item) =>
                    item.id === settings.activeCustomId ? { ...item, courseIds: [...item.courseIds, course.id] } : item,
                  ),
                }
              : settings,
        });
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
      deleteCourse: (id) => {
        const settings = get().settings;
        set({
          courses: get().courses.filter((course) => course.id !== id),
          settings: {
            ...settings,
            customTimetables: (settings.customTimetables ?? []).map((item) => ({
              ...item,
              courseIds: item.courseIds.filter((courseId) => courseId !== id),
            })),
          },
        });
      },
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
        const courses = get().courses.map((course) => (course.id === id ? { ...course, onTimetable } : course));
        const settings = get().settings;
        set({
          courses,
          settings:
            settings.titlePreset === TitlePreset.Custom && settings.activeCustomId
              ? {
                  ...settings,
                  customTimetables: (settings.customTimetables ?? []).map((item) =>
                    item.id === settings.activeCustomId ? { ...item, courseIds: snapshotCustomCourseIds(courses) } : item,
                  ),
                }
              : settings,
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
        const mergedCustom = migrateCustomTimetables(mergedSettings);
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...mergedSettings,
            titlePreset: mergedSettings.titlePreset,
            customTimetables: mergedCustom.customTimetables,
            activeCustomId: mergedCustom.activeCustomId,
            footerText: migrateFooterText(mergedSettings.footerText),
            collapseEmptyTime: mergedSettings.collapseEmptyTime !== false,
            exportAspect: EXPORT_ASPECTS.includes(mergedSettings.exportAspect as ExportAspect)
              ? mergedSettings.exportAspect
              : ExportAspect.Original,
            exportScreenWidth: Number(mergedSettings.exportScreenWidth) > 0 ? Number(mergedSettings.exportScreenWidth) : 0,
            exportScreenHeight: Number(mergedSettings.exportScreenHeight) > 0 ? Number(mergedSettings.exportScreenHeight) : 0,
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
