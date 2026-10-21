import { APP_NAME, APP_URL } from "@/constants";

export const SITE = {
  name: APP_NAME,
  tagline: "Craft your time.",
  description:
    "Create beautiful timetables, schedules and planners for classes, study, work and everyday life. Customize events and templates, then export locally.",
  keywords:
    "timetable maker, free timetable maker, online timetable maker, class timetable maker, school timetable maker, weekly schedule maker, study timetable, exam timetable maker, work schedule maker, daily planner, routine planner, custom timetable, course table maker, UBC timetable maker, Workday, View My Courses, PNG, ICS, Google Calendar, Apple Calendar, Outlook, TimetableCraft",
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
