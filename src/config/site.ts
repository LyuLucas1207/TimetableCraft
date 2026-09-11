import { APP_NAME, APP_URL } from "@/constants";

export const SITE = {
  name: APP_NAME,
  tagline: "Turn your UBC Excel into a beautiful timetable.",
  description:
    "Timetable Craft is a free course timetable and schedule maker. Add classes manually or import UBC Workday Excel, customize your weekly grid, and export PNG locally.",
  keywords:
    "UBC, Workday, timetable, schedule, Excel, View My Courses, Timetable Craft, timetablecraft.com, Winter Term, Summer Term, course calendar, PNG, student tools",
  url: APP_URL,
  locale: "en_CA",
} as const;

export const ROUTES = {
  home: "/",
  tools: "/tools",
  scheduleMaker: "/tools/schedule-maker",
  app: "/app",
  guide: "/guide",
  features: "/features",
  about: "/about",
  faq: "/faq",
  privacy: "/privacy",
  contact: "/contact",
} as const;

export const STORAGE_KEY = "timetablecraft:v1";
