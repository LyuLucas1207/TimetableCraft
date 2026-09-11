import { APP_NAME, APP_URL } from "@/constants";

export const SITE = {
  name: APP_NAME,
  tagline: "Turn your UBC Excel into a beautiful timetable.",
  description:
    "Timetable Craft is a free browser toolkit for UBC students. Schedule Maker turns a Workday View My Courses Excel file into a weekly timetable without uploading it.",
  keywords:
    "UBC, Workday, timetable, schedule, Excel, View My Courses, Timetable Craft, timetablecraft.com, Winter Term, course calendar",
  url: APP_URL,
} as const;

export enum AppLanguage {
  En = "en",
  Zh = "zh",
  Fr = "fr",
}

export const LANGUAGES = [AppLanguage.En, AppLanguage.Zh, AppLanguage.Fr] as const;
export const DEFAULT_LANGUAGE = AppLanguage.En;
