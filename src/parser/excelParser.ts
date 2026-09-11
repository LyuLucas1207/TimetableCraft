import * as XLSX from "xlsx";

import { parseCourseListing, parseSectionListing, courseKeyOf, normalizeFormat, normalizeCourseType } from "@/parser/courseListingParser";
import { parseMeetingPatterns } from "@/parser/meetingPatternParser";
import { detectTerm, termFromDates } from "@/parser/termParser";
import {
  ColorPreset,
  CourseSource,
  CourseType,
  ExcelCategory,
  ExcelField,
  ParseWarningType,
  Term,
  type Course,
  type ParseResult,
  type ParseWarning,
} from "@/types/course";
import { pickRandomPaletteColor } from "@/utils/colors";
import { createId } from "@/utils/ids";

const HEADER_ALIASES: Record<ExcelField, string[]> = {
  [ExcelField.CourseListing]: ["course listing"],
  [ExcelField.Credits]: ["credits"],
  [ExcelField.Section]: ["section"],
  [ExcelField.RegistrationStatus]: ["registration status"],
  [ExcelField.InstructionalFormat]: ["instructional format"],
  [ExcelField.DeliveryMode]: ["delivery mode"],
  [ExcelField.MeetingPatterns]: ["meeting patterns", "meeting pattern"],
  [ExcelField.Instructor]: ["instructor"],
  [ExcelField.StartDate]: ["start date"],
  [ExcelField.EndDate]: ["end date"],
};

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function excelSerialToISO(serial: number): string | undefined {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return undefined;
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  return new Date(utc).toISOString().slice(0, 10);
}

function parseDateCell(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return excelSerialToISO(value);
  const text = cellToString(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const asNumber = Number(text);
  if (text && Number.isFinite(asNumber)) return excelSerialToISO(asNumber);
  return undefined;
}

function detectCategory(rowText: string): ExcelCategory | null {
  const value = rowText.toLowerCase();
  if (value.includes("waitlisted")) return ExcelCategory.Waitlisted;
  if (value.includes("dropped") || value.includes("withdrawn")) return ExcelCategory.Dropped;
  if (value.includes("enrolled")) return ExcelCategory.Enrolled;
  return null;
}

function courseTypeFromCategory(category: ExcelCategory): CourseType {
  switch (category) {
    case ExcelCategory.Waitlisted:
      return CourseType.Waitlist;
    case ExcelCategory.Dropped:
      return CourseType.Drop;
    case ExcelCategory.Enrolled:
    case ExcelCategory.Unknown:
      return CourseType.Active;
  }
}

function mapHeaders(row: unknown[]): Partial<Record<ExcelField, number>> | null {
  const map: Partial<Record<ExcelField, number>> = {};
  row.forEach((cell, index) => {
    const header = normalizeHeader(cellToString(cell));
    if (!header) return;
    (Object.values(ExcelField) as ExcelField[]).forEach((key) => {
      if (map[key] != null) return;
      if (HEADER_ALIASES[key].some((alias) => header === alias)) {
        map[key] = index;
      }
    });
  });
  if (map[ExcelField.Section] != null && (map[ExcelField.CourseListing] != null || map[ExcelField.RegistrationStatus] != null)) {
    return map;
  }
  return null;
}

function getField(row: unknown[], map: Partial<Record<ExcelField, number>>, key: ExcelField): string {
  const index = map[key];
  if (index == null) return "";
  return cellToString(row[index]);
}

function countUniqueCourses(courses: Course[]): number {
  return new Set(courses.map((course) => `${course.courseKey}:${course.term}`)).size;
}

export async function parseWorkdayExcel(file: File | ArrayBuffer | Uint8Array, filename = "workbook.xlsx"): Promise<ParseResult> {
  const warnings: ParseWarning[] = [];
  const errors: string[] = [];
  const courses: Course[] = [];
  const colorByCourse = new Map<string, string>();

  try {
    const workbook = await readWorkbook(file);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return emptyResult(filename, ["The Excel file does not contain any sheets."]);
    }

    const sheet = workbook.Sheets[sheetName];
    expandSheetRef(sheet);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    });

    let category = ExcelCategory.Unknown;
    let headers: Partial<Record<ExcelField, number>> | null = null;
    let foundHeader = false;

    for (const row of rows) {
      if (!Array.isArray(row) || row.every((cell) => cellToString(cell) === "")) continue;
      const rowText = row.map((cell) => cellToString(cell)).join(" | ");
      const filled = row.filter((cell) => cellToString(cell) !== "").length;
      const nextCategory = detectCategory(rowText);
      if (nextCategory && filled <= 3 && !mapHeaders(row)) {
        category = nextCategory;
        headers = null;
        continue;
      }

      const detectedHeaders = mapHeaders(row);
      if (detectedHeaders) {
        headers = detectedHeaders;
        foundHeader = true;
        continue;
      }

      if (!headers) continue;
      const currentHeaders = headers;

      const listingText = getField(row, currentHeaders, ExcelField.CourseListing);
      const sectionText = getField(row, currentHeaders, ExcelField.Section);
      const listing = parseCourseListing(listingText) ?? parseSectionListing(listingText);
      const sectionParsed = parseSectionListing(sectionText) ?? parseSectionListing(listingText);
      if (!listing && !sectionParsed) continue;

      const subject = (sectionParsed?.subject || listing?.subject || "").toUpperCase();
      const courseNumber = sectionParsed?.courseNumber || listing?.courseNumber || "";
      if (!subject || !courseNumber) continue;

      const title = listing?.title || sectionParsed?.title || "";
      const section = sectionParsed?.section || "";
      const statusText = getField(row, currentHeaders, ExcelField.RegistrationStatus);
      const courseType = statusText ? normalizeCourseType(statusText) : courseTypeFromCategory(category);
      const meetings = parseMeetingPatterns(getField(row, currentHeaders, ExcelField.MeetingPatterns));
      const startDate = parseDateCell(currentHeaders[ExcelField.StartDate] != null ? row[currentHeaders[ExcelField.StartDate]] : undefined) ?? meetings[0]?.startDate;
      const endDate = parseDateCell(currentHeaders[ExcelField.EndDate] != null ? row[currentHeaders[ExcelField.EndDate]] : undefined) ?? meetings[0]?.endDate;
      const term = detectTerm(rowText, listingText, sectionText) ?? termFromDates(startDate, endDate) ?? Term.W1;
      const creditsRaw = getField(row, currentHeaders, ExcelField.Credits);
      const credits = creditsRaw ? Number(creditsRaw) : undefined;
      const courseKey = courseKeyOf(subject, courseNumber);
      const instructionalFormat = normalizeFormat(getField(row, currentHeaders, ExcelField.InstructionalFormat));

      if (!colorByCourse.has(courseKey)) {
        colorByCourse.set(courseKey, pickRandomPaletteColor(ColorPreset.Pastel, [...colorByCourse.values()]));
      }

      const duplicate = courses.some(
        (course) => course.courseKey === courseKey && course.section === section && course.term === term && course.instructionalFormat === instructionalFormat,
      );
      if (duplicate) {
        warnings.push({ type: ParseWarningType.Duplicate, message: "Duplicate section skipped.", section: `${subject} ${courseNumber}-${section}` });
        continue;
      }

      if (courseType === CourseType.Active && meetings.length === 0) {
        warnings.push({
          type: ParseWarningType.Unscheduled,
          message: "Active section has no meeting pattern.",
          section: `${subject} ${courseNumber}-${section}`,
        });
      }

      courses.push({
        id: createId(),
        subject,
        courseNumber,
        section,
        title,
        term,
        instructionalFormat,
        courseType,
        instructor: getField(row, currentHeaders, ExcelField.Instructor) || undefined,
        credits: Number.isFinite(credits) ? credits : undefined,
        meetings,
        color: colorByCourse.get(courseKey) ?? "#DBEAFE",
        source: CourseSource.Excel,
        hidden: false,
        onTimetable: false,
        courseKey,
      });
    }

    if (!foundHeader) {
      errors.push("Could not find expected Workday columns such as Course Listing, Section, or Registration Status.");
    }

    const active = courses.filter((course) => course.courseType === CourseType.Active);
    if (foundHeader && active.length === 0) {
      warnings.push({ type: ParseWarningType.Status, message: "No active courses were found in this Excel file." });
    }

    return {
      courses,
      filename,
      uniqueCourseCount: countUniqueCourses(courses),
      registeredSectionCount: active.length,
      scheduledSectionCount: active.filter((course) => course.meetings.length > 0).length,
      unscheduledSectionCount: active.filter((course) => course.meetings.length === 0).length,
      waitlistedCount: courses.filter((course) => course.courseType === CourseType.Waitlist).length,
      unregisteredCount: courses.filter((course) => course.courseType === CourseType.Drop).length,
      warnings,
      errors,
    };
  } catch {
    return emptyResult(filename, ["This file could not be parsed as a UBC Workday Excel export."]);
  }
}

function emptyResult(filename: string, errors: string[]): ParseResult {
  return {
    courses: [],
    filename,
    uniqueCourseCount: 0,
    registeredSectionCount: 0,
    scheduledSectionCount: 0,
    unscheduledSectionCount: 0,
    waitlistedCount: 0,
    unregisteredCount: 0,
    warnings: [],
    errors,
  };
}

async function readWorkbook(file: File | ArrayBuffer | Uint8Array) {
  const bytes =
    file instanceof File
      ? new Uint8Array(await file.arrayBuffer())
      : file instanceof Uint8Array
        ? file
        : new Uint8Array(file);
  return XLSX.read(bytes, { type: "array", cellDates: true });
}

function expandSheetRef(sheet: XLSX.WorkSheet) {
  const keys = Object.keys(sheet).filter((key) => /^[A-Z]+[0-9]+$/i.test(key));
  if (keys.length === 0) return;
  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxRow = 0;
  let maxCol = 0;
  for (const key of keys) {
    const { r, c } = XLSX.utils.decode_cell(key);
    minRow = Math.min(minRow, r);
    minCol = Math.min(minCol, c);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
  }
  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: minRow, c: minCol },
    e: { r: maxRow, c: maxCol },
  });
}
