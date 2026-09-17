# TimetableCraft: schedules for anything

## Plan (2026-09-15)

Positioning: **Craft your time. Create beautiful timetables, schedules and planners in minutes.**
Organize tools around what people create; university import is an input adapter.

### This release
1. Introduce ScheduleEvent and extract the existing renderer into TimetableEngine.
   Preserve course metadata, unscheduled classes, overlaps, themes, exports and the existing course store.
2. Add seven working tools: Weekly Schedule, Study Planner, Exam Timetable,
   Work Schedule, Daily Planner, Routine Planner and Custom Timetable.
   All use the same engine and event editor. Weekly tools include weekends;
   exams use date columns; daily planning uses a selected date.
3. Give every tool its own Zustand store and localStorage key via a shared store
   factory; keep course state in its existing store; add editable starter templates,
   event CRUD, time-range validation, themes and class-to-study copying.
4. Reuse PNG export and support explicit calendar date ranges for generic ICS
   export. Use the browser print dialog for printing / Save as PDF.
5. Update home/tools navigation, localized copy, SEO routes and sitemap.
6. Verify TypeScript, lint, build, model/calendar regression checks and browser flows.

### Follow-up releases
- Semester Planner: week-based milestones, separate view using the same events.
- Dedicated template gallery: previews, categories and more curated templates.
- CSV/general calendar import adapters, JPEG and clipboard-image export.
- Dedicated PDF generation beyond browser Save as PDF.
- Smart Fill: deterministic free-slot search, per-subject hour goals, session bounds,
  availability and a review step before adding generated study blocks.
- Assignment planning, team availability and multi-person shift scheduling.

### Architecture
Course parser → Course[] → adapter → ScheduleEvent[] → TimetableEngine
Planner forms / templates → ScheduleEvent[] → TimetableEngine

Events carry optional date or recurring weekdays; course-specific metadata stays
in the course store. Imported study blocks are independent snapshots. Templates
append fresh event IDs instead of overwriting users' work. Dated events match
exact dates, never merely the weekday. Calendar exports use floating local times
and explicit recurrence bounds; no implicit semester is invented.

### Acceptance
Existing course data remains readable. Switching tools cannot overwrite another
planner. Weekend blocks, dated exams, overlaps, reload persistence, editing,
deleting, class copying, PNG and ICS downloads work. Invalid ranges/dates are
rejected before storage/export. No server or account is required.

## Delivered and verified

- Shared event model and renderer; original course editor/store retained.
- Seven planner tools, each with its own Zustand instance and localStorage key.
- Editable templates, recurring weekends, exact-date exams, daily date navigation,
  event editing/deletion, themes and independent class-to-study copies.
- PNG and ICS downloads; browser Print / Save as PDF.
- English, Chinese and French UI; homepage/tool catalog and all public routes.
- Verification: TypeScript + production build, SEO checks, 15/15 prerendered
  routes, browser CRUD/persistence isolation/date/overlap/export/mobile/locale
  regression checks, the supplied Workday Excel import and print-image preparation.
- Existing lint warnings remain (refs, component exports and effects); no lint errors.
  The build also reports a large shared chunk warning.

### Current boundaries
Custom Timetable currently provides free-form events on a seven-day canvas;
custom column names and semester/week-based layouts remain future work.
Work Schedule is a single-person weekly planner; split overnight shifts at the
 day boundary. PDF is provided through browser printing. Calendar times are
floating local times. Printing was verified through image preparation and an
intercepted print call; the operating-system print dialog was not automated.
