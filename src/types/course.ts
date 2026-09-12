export enum WeekDay {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
}

export const WEEK_DAYS = [
  WeekDay.Monday,
  WeekDay.Tuesday,
  WeekDay.Wednesday,
  WeekDay.Thursday,
  WeekDay.Friday,
] as const;

export enum Term {
  W1 = "W1",
  W2 = "W2",
  S1 = "S1",
  S2 = "S2",
}

export const TERMS = [Term.W1, Term.W2, Term.S1, Term.S2] as const;

export enum TitlePreset {
  W1 = "W1",
  W2 = "W2",
  S1 = "S1",
  S2 = "S2",
  Custom = "custom",
}

export const TITLE_PRESETS = [TitlePreset.W1, TitlePreset.W2, TitlePreset.S1, TitlePreset.S2] as const;

export enum InstructionalFormat {
  Lecture = "Lecture",
  Laboratory = "Laboratory",
  Discussion = "Discussion",
  Tutorial = "Tutorial",
  Thesis = "Thesis",
  Other = "Other",
}

export const INSTRUCTIONAL_FORMATS = [
  InstructionalFormat.Lecture,
  InstructionalFormat.Laboratory,
  InstructionalFormat.Discussion,
  InstructionalFormat.Tutorial,
  InstructionalFormat.Thesis,
  InstructionalFormat.Other,
] as const;

export enum CourseType {
  Active = "Active",
  Waitlist = "Waitlist",
  Drop = "Drop",
}

export const COURSE_TYPES = [CourseType.Active, CourseType.Waitlist, CourseType.Drop] as const;

export enum BlockBorderStyle {
  Solid = "solid",
  Dashed = "dashed",
  Dotted = "dotted",
}

export const COURSE_TYPE_BORDER: Record<CourseType, BlockBorderStyle> = {
  [CourseType.Active]: BlockBorderStyle.Solid,
  [CourseType.Waitlist]: BlockBorderStyle.Dashed,
  [CourseType.Drop]: BlockBorderStyle.Dotted,
};

export enum CourseSource {
  Excel = "excel",
  Manual = "manual",
}

export enum ParseWarningType {
  Unscheduled = "unscheduled",
  Malformed = "malformed",
  Duplicate = "duplicate",
  Status = "status",
  Columns = "columns",
}

export enum GridInterval {
  Fifteen = 15,
  Thirty = 30,
  Sixty = 60,
  OneTwenty = 120,
}

export enum TimetableTheme {
  Clean = "clean",
  Soft = "soft",
  Minimal = "minimal",
  Classic = "classic",
}

export enum ColorPreset {
  Pastel = "pastel",
  Ubc = "ubc",
  Ocean = "ocean",
  Sunset = "sunset",
  Forest = "forest",
  Mono = "mono",
}

export enum ImportMode {
  Replace = "replace",
  Merge = "merge",
}

export enum CatalogFilter {
  All = "all",
  On = "on",
  Off = "off",
}

export enum ExcelCategory {
  Enrolled = "enrolled",
  Waitlisted = "waitlisted",
  Dropped = "dropped",
  Unknown = "unknown",
}

export enum ExcelField {
  CourseListing = "courseListing",
  Credits = "credits",
  Section = "section",
  RegistrationStatus = "registrationStatus",
  InstructionalFormat = "instructionalFormat",
  DeliveryMode = "deliveryMode",
  MeetingPatterns = "meetingPatterns",
  Instructor = "instructor",
  StartDate = "startDate",
  EndDate = "endDate",
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
  System = "system",
}

export enum ExportAspect {
  Original = "original",
  Screen = "screen",
  Phone = "phone",
  Desktop = "desktop",
  DesktopWide = "desktopWide",
  Square = "square",
}

export const EXPORT_ASPECTS = [
  ExportAspect.Original,
  ExportAspect.Screen,
  ExportAspect.Phone,
  ExportAspect.Desktop,
  ExportAspect.DesktopWide,
  ExportAspect.Square,
] as const;

/** Width / height. `null` keeps the timetable’s natural size. Screen is measured on click. */
export const EXPORT_ASPECT_RATIO: Record<ExportAspect, number | null> = {
  [ExportAspect.Original]: null,
  [ExportAspect.Screen]: null,
  [ExportAspect.Phone]: 9 / 16,
  [ExportAspect.Desktop]: 16 / 9,
  [ExportAspect.DesktopWide]: 16 / 10,
  [ExportAspect.Square]: 1,
};

export interface CourseMeeting {
  id: string;
  days: WeekDay[];
  startTime: string;
  endTime: string;
  campus?: string;
  building?: string;
  buildingName?: string;
  floor?: string;
  room?: string;
  startDate?: string;
  endDate?: string;
}

export interface Course {
  id: string;
  subject: string;
  courseNumber: string;
  section: string;
  title: string;
  term: Term;
  instructionalFormat: InstructionalFormat;
  courseType: CourseType;
  instructor?: string;
  credits?: number;
  meetings: CourseMeeting[];
  color: string;
  source: CourseSource;
  hidden: boolean;
  onTimetable: boolean;
  courseKey: string;
}

export interface ParseWarning {
  type: ParseWarningType;
  message: string;
  section?: string;
}

export interface ParseResult {
  courses: Course[];
  filename: string;
  uniqueCourseCount: number;
  registeredSectionCount: number;
  scheduledSectionCount: number;
  unscheduledSectionCount: number;
  waitlistedCount: number;
  unregisteredCount: number;
  warnings: ParseWarning[];
  errors: string[];
}

export interface ImportSummary {
  filename: string;
  uniqueCourseCount: number;
  registeredSectionCount: number;
  scheduledSectionCount: number;
  waitlistedCount: number;
  unregisteredCount: number;
}

export interface CustomTimetable {
  id: string;
  title: string;
  courseIds: string[];
}

export interface TimetableSettings {
  intervalMinutes: GridInterval;
  showTitles: boolean;
  showRooms: boolean;
  showSections: boolean;
  autoBounds: boolean;
  collapseEmptyTime: boolean;
  exportAspect: ExportAspect;
  exportScreenWidth: number;
  exportScreenHeight: number;
  startTime: string;
  endTime: string;
  theme: TimetableTheme;
  colorPreset: ColorPreset;
  titlePreset: TitlePreset;
  title: string;
  customTimetables: CustomTimetable[];
  activeCustomId: string | null;
  subtitle: string;
  showBrand: boolean;
  showFooter: boolean;
  showCredits: boolean;
  footerText: string;
  headerBg: string;
  headerText: string;
  kickerColor: string;
  pageBg: string;
  gridLine: string;
  dayHeaderBg: string;
  dayHeaderText: string;
  timeBg: string;
  timeText: string;
  footerColor: string;
  titleFontSize: number;
  subtitleFontSize: number;
  kickerFontSize: number;
  blockTitleFontSize: number;
  blockMetaFontSize: number;
  cornerRadius: number;
}

export function courseTypeFromExcel(value: string): CourseType {
  const raw = value.trim().toLowerCase();
  if (raw.includes("wait")) return CourseType.Waitlist;
  if (raw.includes("drop") || raw.includes("withdr") || raw.includes("unregist")) return CourseType.Drop;
  if (raw.includes("regist") || raw.includes("enrol")) return CourseType.Active;
  return CourseType.Active;
}

export function termFromTitlePreset(preset: TitlePreset): Term | null {
  switch (preset) {
    case TitlePreset.W1:
      return Term.W1;
    case TitlePreset.W2:
      return Term.W2;
    case TitlePreset.S1:
      return Term.S1;
    case TitlePreset.S2:
      return Term.S2;
    case TitlePreset.Custom:
      return null;
  }
}

export function titlePresetFromTerm(term: Term): TitlePreset {
  switch (term) {
    case Term.W1:
      return TitlePreset.W1;
    case Term.W2:
      return TitlePreset.W2;
    case Term.S1:
      return TitlePreset.S1;
    case Term.S2:
      return TitlePreset.S2;
  }
}
