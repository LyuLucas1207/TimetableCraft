import { APP_NAME, APP_URL } from "@/constants";

export const SITE = {
  name: APP_NAME,
  tagline: "Turn your UBC Excel into a beautiful timetable.",
  description:
    "Free timetable maker, schedule maker, and course table maker. Add classes or import UBC Workday Excel, then export a weekly PNG or calendar .ics. Nothing is uploaded.",
  keywords:
    "UBC, Workday, timetable, schedule, Excel, View My Courses, Timetable Craft, timetablecraft.com, Winter Term, Summer Term, course calendar, PNG, ICS, iCalendar, Google Calendar, Apple Calendar, Outlook, student tools, SFU, Waterloo, goSFU, Quest",
  url: APP_URL,
  locale: "en_CA",
} as const;

export enum AppLanguage {
  En = "en",
  Zh = "zh",
  Fr = "fr",
}

export const LANGUAGES = [AppLanguage.En, AppLanguage.Zh, AppLanguage.Fr] as const;
export const DEFAULT_LANGUAGE = AppLanguage.En;
