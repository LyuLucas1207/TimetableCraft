/** Integration/regression checks against the local Vite server. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined), headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:10020";
const go = async (slug) => { await page.goto(`${base}/tools/${slug}`); await page.getByRole("button", { name: "Add event", exact: true }).first().waitFor(); };
try {
  await go("weekly-schedule");
  await page.getByRole("button", { name: "Add starter template", exact: true }).click();
  await page.getByRole("button", { name: "Add event", exact: true }).first().click();
  await page.getByLabel("Event title", { exact: true }).fill("Sunday test");
  await page.getByRole("checkbox", { name: "Monday", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Sunday", exact: true }).check();
  await page.getByLabel("Start time", { exact: true }).fill("19:00");
  await page.getByLabel("End time", { exact: true }).fill("18:00");
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /End time/);
  await page.getByLabel("End time", { exact: true }).fill("20:00");
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const weeklyBefore = await page.evaluate(() => localStorage.getItem("timetablecraft:planner:weekly:v1"));
  assert.equal(JSON.parse(weeklyBefore).state.document.events.length, 5);
  await page.reload();
  await page.getByRole("button", { name: /^Sunday test/ }).first().waitFor();
  await page.getByRole("button", { name: /^Sunday test/ }).first().click();
  await page.getByLabel("Event title", { exact: true }).fill("Sunday updated");
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Appearance & layout", exact: true }).click();
  await page.getByRole("combobox", { name: "Theme", exact: true }).click();
  await page.getByRole("option", { name: "Classic", exact: true }).click();
  await mkdir("/tmp/timetablecraft-qa", { recursive: true });
  assert.doesNotMatch(await page.locator("aside").innerText(), /themes\./);
  await page.screenshot({ path: "/tmp/timetablecraft-qa/weekly-desktop.png" });
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  const png = await pngDownload;
  const pngBytes = await readFile(await png.path());
  assert.equal(pngBytes.subarray(1, 4).toString(), "PNG");
  // Prepare the actual print image and intercept only the operating-system dialog.
  const printed = await page.evaluate(async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow");
    let dimensions = null;
    Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", { ...descriptor, get() {
      const win = descriptor.get.call(this);
      win.print = () => { const img = this.contentDocument.querySelector("img"); dimensions = [img.naturalWidth, img.naturalHeight]; win.dispatchEvent(new Event("afterprint")); };
      return win;
    } });
    try {
      const node = document.querySelector('section[aria-label="Timetable"] > div:last-child > div');
      await (await import("/src/utils/printSchedule.ts")).printSchedule(node, "Print test");
      return dimensions;
    } finally { Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", descriptor); }
  });
  assert.ok(printed[0] > 1000 && printed[1] > 1000);
  await page.getByRole("button", { name: ".ics", exact: true }).click();
  await page.getByLabel("Repeat from").fill("2026-09-14");
  await page.getByLabel("Repeat until").fill("2026-09-27");
  const icsDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .ics", exact: true }).click();
  const ics = await readFile(await (await icsDownload).path(), "utf8");
  assert.match(ics, /BYDAY=SU/); assert.match(ics, /UNTIL=20260927T235959/); assert.match(ics, /SUMMARY:Sunday updated/);
  await go("work-schedule");
  assert.equal(await page.getByRole("button", { name: /^Sunday updated/ }).count(), 0);
  await page.getByRole("button", { name: "Add starter template", exact: true }).click();
  const state = await page.evaluate(() => ({ weekly: JSON.parse(localStorage.getItem("timetablecraft:planner:weekly:v1")), work: JSON.parse(localStorage.getItem("timetablecraft:planner:work:v1")) }));
  assert.equal(state.weekly.state.document.events.length, 5); assert.equal(state.work.state.document.events.length, 2);
  await go("exam-timetable");
  for (const [title, date] of [["Exam Alpha", "2026-10-05"], ["Exam Beta", "2026-10-12"]]) {
    await page.getByRole("button", { name: "Add event", exact: true }).first().click();
    await page.getByLabel("Event title", { exact: true }).fill(title);
    await page.getByLabel("Date", { exact: true }).fill(date);
    await page.getByRole("button", { name: "Save event", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  const preview = page.getByRole("region", { name: "Timetable", exact: true });
  assert.equal(await preview.getByRole("button", { name: /^Exam Alpha/ }).count(), 1);
  assert.equal(await preview.getByRole("button", { name: /^Exam Beta/ }).count(), 1);
  await page.getByRole("button", { name: ".ics", exact: true }).click();
  const examsDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .ics", exact: true }).click();
  const exams = await readFile(await (await examsDownload).path(), "utf8");
  assert.match(exams, /DTSTART:20261005T090000/); assert.match(exams, /DTSTART:20261012T090000/); assert.doesNotMatch(exams, /RRULE/);
  await go("daily-planner");
  await page.getByRole("button", { name: "Add starter template", exact: true }).click();
  await page.getByLabel("Date", { exact: true }).fill("2026-12-25");
  assert.equal(await page.getByRole("region", { name: "Timetable", exact: true }).getByRole("button", { name: /^Deep work/ }).count(), 0);
  await go("study-planner");
  // Import fixture through the existing public store to check the course adapter and independent copying.
  await page.evaluate(async () => {
    const { useScheduleStore } = await import("/src/stores/schedule.ts");
    const { Term, InstructionalFormat, CourseType, WeekDay } = await import("/src/types/course.ts");
    useScheduleStore.getState().addManualCourse({ courseCode: "CPEN 442", section: "101", title: "Security", term: Term.W1, instructionalFormat: InstructionalFormat.Lecture, courseType: CourseType.Active, days: [WeekDay.Monday], startTime: "10:00", endTime: "11:00", color: "#DBEAFE" });
  });
  await page.getByRole("button", { name: "Copy current classes", exact: true }).click();
  await page.getByRole("button", { name: /^CPEN 442/ }).first().waitFor();
  await page.getByRole("button", { name: "Copy current classes", exact: true }).click();
  const studyCount = await page.evaluate(() => JSON.parse(localStorage.getItem("timetablecraft:planner:study:v1")).state.document.events.length);
  assert.equal(studyCount, 1);
  await page.getByRole("button", { name: /^CPEN 442/ }).first().click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(async () => (await import("/src/stores/schedule.ts")).useScheduleStore.getState().courses.length), 1);
  await page.goto(`${base}/tools/schedule-maker`);
  await page.getByRole("button", { name: /^CPEN 442/ }).first().waitFor();
  await page.screenshot({ path: "/tmp/timetablecraft-qa/classes-desktop.png" });
  const samplePath = new URL("../../Example/View_My_Courses%20(2).xlsx", import.meta.url);
  if (existsSync(samplePath)) {
    const bytes = [...await readFile(samplePath)];
    const parsed = await page.evaluate(async (bytes) => {
      const { useScheduleStore } = await import("/src/stores/schedule.ts");
      const { ImportMode } = await import("/src/types/course.ts");
      const file = new File([new Uint8Array(bytes)], "sample.xlsx");
      const result = await useScheduleStore.getState().importExcel(file, ImportMode.Replace);
      return result.uniqueCourseCount;
    }, bytes);
    assert.ok(parsed > 0);
    await page.screenshot({ path: "/tmp/timetablecraft-qa/classes-imported.png" });
  }
  for (const slug of ["routine-planner", "custom-timetable"]) { await go(slug); await page.getByRole("button", { name: "Add starter template", exact: true }).click(); }
  await page.setViewportSize({ width: 390, height: 844 });
  await go("weekly-schedule");
  await page.getByRole("button", { name: "Events", exact: true }).click();
  await page.getByRole("button", { name: "Add starter template", exact: true }).waitFor();
  await page.screenshot({ path: "/tmp/timetablecraft-qa/weekly-mobile-editor.png" });
  await page.getByRole("button", { name: "Timetable", exact: true }).click();
  await page.screenshot({ path: "/tmp/timetablecraft-qa/weekly-mobile.png" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.goto(base);
  await page.getByRole("heading", { name: "Craft your time.", exact: true }).waitFor();
  assert.equal(await page.locator('#tool-catalog-title + p + div a').count(), 8);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "/tmp/timetablecraft-qa/home.png", fullPage: true });
  for (const locale of ["zh", "fr"]) {
    await page.evaluate((locale) => localStorage.setItem("timetablecraft:lng", locale), locale);
    await page.goto(`${base}/tools/weekly-schedule`);
    await page.locator("h1").waitFor();
    await page.getByRole("button", { name: locale === "zh" ? "外观与布局" : "Apparence et disposition", exact: true }).click();
    assert.doesNotMatch(await page.locator("body").innerText(), /tools\.weekly|days\.Saturday|themes\.|themeClassic/);
  }
  // Core edge cases: exact dates, weekend recurrence, invalid dates, independent stores, overlaps.
  const checks = await page.evaluate(async () => {
    const { validateScheduleEvent, eventMatchesColumn } = await import("/src/utils/schedule.ts");
    const { layoutOverlaps } = await import("/src/utils/overlaps.ts");
    const { WeekDay } = await import("/src/types/course.ts");
    const { PLANNER_STORES } = await import("/src/stores/planners.ts");
    const sample = { id: "test", title: "Test", date: "2026-02-30", startTime: "09:00", endTime: "10:00", color: "#DBEAFE" };
    return {
      invalid: validateScheduleEvent(sample),
      dateLeak: eventMatchesColumn({ ...sample, date: "2026-10-05" }, { key: "2026-10-12", date: "2026-10-12", label: "Later Monday" }),
      sunday: eventMatchesColumn({ ...sample, date: undefined, days: [WeekDay.Sunday] }, { key: "Sunday", day: WeekDay.Sunday, label: "Sunday" }),
      distinct: new Set(Object.values(PLANNER_STORES)).size,
      overlaps: layoutOverlaps([{ id: "a", startMin: 540, endMin: 660 }, { id: "b", startMin: 600, endMin: 720 }]).map(item => item.columns),
    };
  });
  assert.deepEqual(checks, { invalid: "errorDay", dateLeak: false, sunday: true, distinct: 7, overlaps: [2, 2] });
  assert.deepEqual(errors, []);
  console.log("Planner integration checks passed: CRUD, validation, weekends, independent stores, reloads, dates, class copy, templates, PNG/ICS, mobile, locales, overlaps.");
} finally { await browser.close(); }
