/** Quick smoke run: open every planner, add its first template, and report console errors. */
import { chromium } from "playwright";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:10025";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
for (const slug of ["weekly-schedule", "study-planner", "exam-timetable", "work-schedule", "daily-planner", "routine-planner", "custom-timetable"]) {
  await page.goto(`${base}/tools/${slug}`);
  await page.getByRole("button", { name: "Add starter template", exact: true }).waitFor();
  await page.getByRole("button", { name: "Add starter template", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/tc-qa/${slug}.png` });
  const grid = page.getByRole("button", { name: /Time grid|Overview|Planner view/ }).first();
  if (await grid.count()) { await grid.click(); await page.waitForTimeout(300); await page.screenshot({ path: `/tmp/tc-qa/${slug}-grid.png` }); }
}
console.log(errors.length ? errors : "no console errors");
await browser.close();
