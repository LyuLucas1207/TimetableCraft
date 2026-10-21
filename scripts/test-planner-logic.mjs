/** Pure-logic checks for the planner tools. Runs without a browser: modules load through Vite's SSR loader. */
import assert from "node:assert/strict";
import { createServer } from "vite";

globalThis.localStorage = (() => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }; })();
const server = await createServer({ mode: "dev", server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const load = (path) => server.ssrLoadModule(path);
try {
  const { validateScheduleEvent, expandOvernight, eventMinutes, eventMatchesColumn } = await load("/src/utils/schedule.ts");
  const { conflictsFor, streak, daysUntil, examGaps, weekDates, orderedDays } = await load("/src/utils/planStats.ts");
  const { smartFill } = await load("/src/utils/smartFill.ts");
  const { eventsToCSV, csvToEvents, parsePlannerJSON, exportPlannerJSON, mergeDocuments } = await load("/src/utils/planIO.ts");
  const { buildScheduleCalendar } = await load("/src/utils/exportScheduleCalendar.ts");
  const { encodeShare, decodeShare } = await load("/src/utils/shareLink.ts");
  const { createPlannerStore, emptyPlanner } = await load("/src/stores/planners.ts");
  const { buildTemplate, TEMPLATES, PLANNERS } = await load("/src/config/planners.ts");

  const ev = (over) => ({ id: "e", title: "T", color: "#DBEAFE", startTime: "09:00", endTime: "10:00", days: ["Monday"], ...over });
  const mins = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

  // Validation: overnight is explicit; classic events behave as before.
  assert.equal(validateScheduleEvent(ev({ startTime: "22:00", endTime: "06:00" })), "errorTime");
  assert.equal(validateScheduleEvent(ev({ startTime: "22:00", endTime: "06:00", overnight: true })), null);
  assert.equal(validateScheduleEvent(ev({ startTime: "10:00", endTime: "10:00", overnight: true })), "errorTime");
  assert.equal(validateScheduleEvent(ev({ days: [], columnKey: "c1" })), null);
  assert.equal(validateScheduleEvent(ev({ days: [] })), "errorDay");
  assert.equal(validateScheduleEvent(ev({ reminderMinutes: -5 })), "errorReminder");

  // Overnight splitting.
  const night = ev({ startTime: "22:00", endTime: "06:00", overnight: true, days: ["Sunday"] });
  assert.equal(eventMinutes(night), 8 * 60);
  const parts = expandOvernight([night]);
  assert.deepEqual(parts.map((p) => [p.startTime, p.endTime, p.days[0]]), [["22:00", "24:00", "Sunday"], ["00:00", "06:00", "Monday"]]);
  assert.ok(parts.every((p) => p.baseId === "e"));
  const dated = expandOvernight([ev({ date: "2026-12-31", days: undefined, startTime: "23:00", endTime: "01:00", overnight: true })]);
  assert.equal(dated[1].date, "2027-01-01");

  // Column matching.
  assert.equal(eventMatchesColumn(ev({ columnKey: "c1" }), { key: "c1", label: "Room" }), true);
  assert.equal(eventMatchesColumn(ev({ columnKey: "c1" }), { key: "Monday", day: "Monday", label: "Mon" }), false);

  // Conflicts, including across midnight.
  assert.equal(conflictsFor(ev({ id: "a" }), [ev({ id: "b", startTime: "09:30", endTime: "11:00" })]).length, 1);
  assert.equal(conflictsFor(ev({ id: "a" }), [ev({ id: "b", startTime: "10:00", endTime: "11:00" })]).length, 0);
  assert.equal(conflictsFor(ev({ id: "a", days: ["Monday"], startTime: "05:00", endTime: "07:00" }), [night]).length, 1);
  assert.equal(conflictsFor(ev({ id: "a", columnKey: "x", days: undefined }), [ev({ id: "b", columnKey: "y", days: undefined })]).length, 0);

  // Dates and streaks.
  assert.equal(daysUntil("2026-10-25", "2026-10-21"), 4);
  assert.equal(streak(["2026-10-19", "2026-10-20", "2026-10-21"], "2026-10-21"), 3);
  assert.equal(streak(["2026-10-19", "2026-10-20"], "2026-10-21"), 2);
  assert.equal(streak(["2026-10-18"], "2026-10-21"), 0);
  assert.equal(weekDates("2026-10-21", "mon")[0], "2026-10-19");
  assert.equal(weekDates("2026-10-21", "sun")[0], "2026-10-18");
  assert.deepEqual(orderedDays("sun", false), ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  assert.equal(examGaps([ev({ id: "x", date: "2026-10-05", days: undefined, startTime: "09:00", endTime: "11:00" }), ev({ id: "y", date: "2026-10-05", days: undefined, startTime: "12:00", endTime: "14:00" })])[0].minutes, 60);

  // Smart Fill: respects busy blocks, buffer, session bounds, and reports what did not fit.
  const busy = [ev({ id: "c", startTime: "09:00", endTime: "12:00", days: ["Monday"] })];
  const filled = smartFill({ busy, days: ["Monday", "Tuesday"], window: { start: "08:00", end: "14:00" }, minSession: 45, maxSession: 90, gap: 15,
    goals: [{ subject: "Math", minutes: 180, color: "#DBEAFE" }, { subject: "Art", minutes: 60, color: "#FEF3C7" }] });
  const total = (subject) => filled.sessions.filter((s) => s.subject === subject).reduce((n, s) => n + mins(s.end) - mins(s.start), 0);
  assert.equal(total("Math"), 180); assert.equal(total("Art"), 60); assert.deepEqual(filled.unmet, {});
  for (const s of filled.sessions) {
    assert.ok(s.start >= "08:00" && s.end <= "14:00");
    if (s.day === "Monday") assert.ok(s.end <= "08:45" || s.start >= "12:15", `${s.start}-${s.end} clashes with class`);
    assert.ok(mins(s.end) - mins(s.start) <= 90);
  }
  const tight = smartFill({ busy, days: ["Monday"], window: { start: "08:00", end: "13:00" }, minSession: 45, maxSession: 90, gap: 15, goals: [{ subject: "Math", minutes: 600, color: "#fff" }] });
  assert.ok(tight.unmet.Math > 0);
  assert.deepEqual(smartFill({ busy: [], days: [], window: { start: "08:00", end: "10:00" }, minSession: 30, maxSession: 60, gap: 0, goals: [{ subject: "X", minutes: 60, color: "#fff" }] }).sessions, []);

  // Every template builds valid events; custom templates bring columns the events point at.
  const t = (key) => key; const dayLabel = (d) => d;
  for (const planner of PLANNERS) for (const template of TEMPLATES[planner.id]) {
    const built = buildTemplate(planner.id, template.id, "2026-10-21", t, dayLabel);
    assert.ok(built.events.length > 0);
    for (const event of built.events) assert.equal(validateScheduleEvent(event), null, `${planner.id}/${template.id}: ${event.title}`);
    if (template.columns) { assert.equal(built.columns.length, template.columns.length); for (const e of built.events) assert.ok(built.columns.some((c) => c.id === e.columnKey)); }
  }
  assert.notEqual(buildTemplate("weekly", "workweek", "2026-10-21", t, dayLabel).events[0].id, buildTemplate("weekly", "workweek", "2026-10-21", t, dayLabel).events[0].id);

  // Store: history, persistence key, migration of older documents.
  const store = createPlannerStore("weekly");
  const s = () => store.getState();
  s().saveEvent(ev({ id: "one" })); s().saveEvent(ev({ id: "two", startTime: "11:00", endTime: "12:00" }));
  assert.equal(s().document.events.length, 2);
  s().undo(); assert.equal(s().document.events.length, 1);
  s().redo(); assert.equal(s().document.events.length, 2);
  s().update({ date: "2026-01-01" }); assert.equal(s().past.length, 2, "navigation must not enter history");
  const copyId = s().duplicateEvent("one"); assert.ok(copyId && copyId !== "one"); assert.equal(s().document.events.length, 3);
  s().toggleCheckin("one", "2026-10-21"); s().toggleCheckin("one", "2026-10-22"); s().toggleCheckin("one", "2026-10-21");
  assert.deepEqual(s().document.checkins.one, ["2026-10-22"]);
  s().deleteEvent("one"); assert.equal(s().document.checkins?.one, undefined);
  assert.throws(() => s().saveEvent(ev({ id: "bad", endTime: "08:00" })), /errorTime/);
  s().clear(); assert.equal(s().document.events.length, 0); s().undo(); assert.ok(s().document.events.length > 0);
  assert.ok(localStorage.getItem("timetablecraft:planner:weekly:v1"));
  localStorage.setItem("timetablecraft:planner:work:v1", JSON.stringify({ state: { document: { events: [ev({ id: "legacy" })], date: "2026-01-01", settings: { title: "Old" } } }, version: 0 }));
  const legacy = createPlannerStore("work");
  assert.equal(legacy.getState().document.events[0].id, "legacy");
  assert.equal(legacy.getState().document.prefs.weekStart, "mon");
  assert.equal(legacy.getState().document.rules.overtimeHours, 40);
  assert.equal(legacy.getState().document.settings.title, "Old");
  assert.ok(legacy.getState().document.settings.intervalMinutes);

  // JSON / CSV round trips and rejection of bad input.
  const doc = { ...emptyPlanner(), events: [ev({ id: "a", title: 'Say "hi", ok', location: "Room, 1", category: "Work", reminderMinutes: 15 }), ev({ id: "b", days: undefined, date: "2026-10-05" })] };
  const back = parsePlannerJSON(exportPlannerJSON("weekly", doc), "weekly");
  assert.equal(back.dropped, 0); assert.deepEqual(back.document.events.map((e) => e.id), ["a", "b"]);
  assert.throws(() => parsePlannerJSON(exportPlannerJSON("weekly", doc), "work"), /errorImportPlanner/);
  assert.throws(() => parsePlannerJSON("{not json", "weekly"), /errorImportFormat/);
  const tampered = JSON.parse(exportPlannerJSON("weekly", doc)); tampered.document.events.push({ id: "z", title: "", color: "x", startTime: "1", endTime: "2" });
  assert.equal(parsePlannerJSON(JSON.stringify(tampered), "weekly").dropped, 1);
  const csv = csvToEvents(eventsToCSV(doc.events));
  assert.equal(csv.errors.length, 0); assert.equal(csv.events[0].title, 'Say "hi", ok'); assert.equal(csv.events[0].location, "Room, 1"); assert.equal(csv.events[1].date, "2026-10-05");
  const messy = csvToEvents("Title,Start,End,Days\r\nGym,7:00,8:00,mon|Wed\r\nBad,10:00,09:00,Mon\r\n");
  assert.equal(messy.events.length, 1); assert.deepEqual(messy.events[0].days, ["Monday", "Wednesday"]); assert.equal(messy.errors[0].line, 3);
  assert.equal(new Set(mergeDocuments(doc, { ...doc }).events.map((e) => e.id)).size, 4);

  // Share link round trip.
  const payload = await encodeShare("weekly", doc);
  assert.match(payload, /^[zj]\./);
  assert.equal((await decodeShare(payload, "weekly")).document.events.length, 2);
  await assert.rejects(decodeShare(payload, "exam"), /errorSharePlanner/);
  await assert.rejects(decodeShare("z.@@@", "weekly"), /errorShareFormat/);

  // ICS: reminders, overnight durations, recurrence bounds, skipped column-only events.
  const ics = buildScheduleCalendar([
    ev({ id: "r", title: "Shift", startTime: "22:00", endTime: "06:00", overnight: true, days: ["Monday"], reminderMinutes: 30, subtitle: "Notes" }),
    ev({ id: "x", title: "Exam", days: undefined, date: "2026-10-05", reminderMinutes: 120 }),
    ev({ id: "col", title: "Room only", days: undefined, columnKey: "c" }),
  ], "Plan", { start: "2026-10-05", end: "2026-10-18" }, { describe: () => ["Role: Cook"] });
  assert.match(ics, /DURATION:PT(8H|480M)/); assert.match(ics, /BYDAY=MO/); assert.match(ics, /UNTIL=20261018T235959/);
  assert.match(ics, /BEGIN:VALARM/); assert.match(ics, /TRIGGER:-PT30M/); assert.match(ics, /TRIGGER:-PT(2H|120M)/); assert.match(ics, /Role: Cook/);
  assert.doesNotMatch(ics, /Room only/);
  assert.throws(() => buildScheduleCalendar([ev({ days: undefined, columnKey: "c" })], "P", { start: "2026-10-05", end: "2026-10-18" }), /errorNoEvents/);
  console.log("Planner logic checks passed: validation, overnight, conflicts, streaks, Smart Fill, templates, store history/migration, JSON/CSV, share links, ICS.");
} finally { await server.close(); }
