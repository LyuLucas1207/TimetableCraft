import { APP_NAME, APP_URL } from "@/constants";

export const SITE = {
  name: APP_NAME,
  tagline: "Craft your time.",
  description:
    "Create beautiful timetables, schedules and planners for classes, study, work and everyday life. Customize events and templates, then export locally.",
  keywords:
    "UBC, Workday, timetable, schedule, Excel, View My Courses, Timetable Craft, timetablecraft.com, Winter Term, Summer Term, course calendar, PNG, ICS, iCalendar, Google Calendar, Apple Calendar, Outlook, student tools, SFU, Waterloo, goSFU, Quest",
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
