import { APP_DOMAIN } from "@/constants";
import { ColorPreset, ExportAspect, Term, TimetableTheme, TitlePreset, GridInterval, type TimetableSettings } from "@/types/course";

export const TERM_I18N_KEY: Record<Term, string> = {
  [Term.W1]: "common.winterTerm1",
  [Term.W2]: "common.winterTerm2",
  [Term.S1]: "common.summerTerm1",
  [Term.S2]: "common.summerTerm2",
};

export const TITLE_PRESET_I18N_KEY: Record<TitlePreset, string> = {
  [TitlePreset.W1]: "common.winterTerm1",
  [TitlePreset.W2]: "common.winterTerm2",
  [TitlePreset.S1]: "common.summerTerm1",
  [TitlePreset.S2]: "common.summerTerm2",
  [TitlePreset.Custom]: "common.customTitle",
};

export const TITLE_PRESET_DEFAULTS: Record<TitlePreset, string> = {
  [TitlePreset.W1]: "Winter Term 1",
  [TitlePreset.W2]: "Winter Term 2",
  [TitlePreset.S1]: "Summer Term 1",
  [TitlePreset.S2]: "Summer Term 2",
  [TitlePreset.Custom]: "",
};

export function titleFromPreset(preset: TitlePreset, customTitle: string): string {
  if (preset === TitlePreset.Custom) return customTitle;
  return TITLE_PRESET_DEFAULTS[preset];
}

export function isDefaultPresetTitle(preset: TitlePreset, title: string): boolean {
  if (preset === TitlePreset.Custom) return false;
  return title === TITLE_PRESET_DEFAULTS[preset];
}

export function appearanceFromTheme(theme: TimetableTheme): Pick<
  TimetableSettings,
  "theme" | "headerBg" | "headerText" | "kickerColor" | "pageBg" | "gridLine" | "dayHeaderBg" | "dayHeaderText" | "timeBg" | "timeText" | "footerColor"
> {
  if (theme === TimetableTheme.Classic) {
    return {
      theme,
      headerBg: "#002145",
      headerText: "#ffffff",
      kickerColor: "#c5d4e8",
      pageBg: "#ffffff",
      gridLine: "#e2e8f0",
      dayHeaderBg: "#0b3a66",
      dayHeaderText: "#ffffff",
      timeBg: "#f1f5f9",
      timeText: "#64748b",
      footerColor: "#64748b",
    };
  }
  if (theme === TimetableTheme.Soft) {
    return {
      theme,
      headerBg: "#f8fafc",
      headerText: "#0f172a",
      kickerColor: "#64748b",
      pageBg: "#ffffff",
      gridLine: "#f1f5f9",
      dayHeaderBg: "#f1f5f9",
      dayHeaderText: "#334155",
      timeBg: "#f8fafc",
      timeText: "#64748b",
      footerColor: "#94a3b8",
    };
  }
  if (theme === TimetableTheme.Minimal) {
    return {
      theme,
      headerBg: "#ffffff",
      headerText: "#0f172a",
      kickerColor: "#64748b",
      pageBg: "#ffffff",
      gridLine: "#e4e4e7",
      dayHeaderBg: "#ffffff",
      dayHeaderText: "#52525b",
      timeBg: "#fafafa",
      timeText: "#71717a",
      footerColor: "#a1a1aa",
    };
  }
  return {
    theme: TimetableTheme.Clean,
    headerBg: "#eef3fb",
    headerText: "#002145",
    kickerColor: "#3d5a80",
    pageBg: "#ffffff",
    gridLine: "#e2e8f0",
    dayHeaderBg: "#e4edf8",
    dayHeaderText: "#1b365d",
    timeBg: "#f1f5f9",
    timeText: "#64748b",
    footerColor: "#64748b",
  };
}

export const DEFAULT_SETTINGS: TimetableSettings = {
  intervalMinutes: GridInterval.Thirty,
  showTitles: true,
  showRooms: true,
  showSections: true,
  autoBounds: true,
  collapseEmptyTime: true,
  exportAspect: ExportAspect.Original,
  exportScreenWidth: 0,
  exportScreenHeight: 0,
  startTime: "08:00",
  endTime: "18:30",
  colorPreset: ColorPreset.Pastel,
  titlePreset: TitlePreset.W1,
  title: TITLE_PRESET_DEFAULTS[TitlePreset.W1],
  customTitles: [],
  subtitle: "",
  showBrand: true,
  showFooter: true,
  showCredits: true,
  footerText: APP_DOMAIN,
  titleFontSize: 22,
  subtitleFontSize: 13,
  kickerFontSize: 11,
  blockTitleFontSize: 12,
  blockMetaFontSize: 10,
  cornerRadius: 8,
  ...appearanceFromTheme(TimetableTheme.Clean),
  theme: TimetableTheme.Clean,
};

export function termLabel(term: Term): string {
  return TITLE_PRESET_DEFAULTS[term];
}
