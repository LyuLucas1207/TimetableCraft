import { readFileSync } from "node:fs";

import { parseWorkdayExcel } from "../src/parser/excelParser";

const path = process.argv[2];
if (!path) {
  throw new Error("Usage: parse-sample.ts <xlsx>");
}

const buffer = readFileSync(path);
const result = await parseWorkdayExcel(new Uint8Array(buffer), path.split("/").pop());

console.log({
  filename: result.filename,
  unique: result.uniqueCourseCount,
  registered: result.registeredSectionCount,
  scheduled: result.scheduledSectionCount,
  unscheduled: result.unscheduledSectionCount,
  waitlisted: result.waitlistedCount,
  unregistered: result.unregisteredCount,
  errors: result.errors,
  warnings: result.warnings,
});

for (const course of result.courses.filter((item) => item.registrationStatus === "Registered")) {
  const meeting = course.meetings[0];
  console.log(
    `${course.term} ${course.subject} ${course.courseNumber}-${course.section} ${course.instructionalFormat} ${meeting ? `${meeting.days.join("/")} ${meeting.startTime}-${meeting.endTime} ${meeting.building ?? ""} ${meeting.room ?? ""}` : "(no meeting)"}`,
  );
}
