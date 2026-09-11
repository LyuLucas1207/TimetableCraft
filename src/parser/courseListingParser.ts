import { InstructionalFormat, CourseType, courseTypeFromExcel } from "@/types/course";

export interface ParsedListing {
  subject: string;
  courseNumber: string;
  title: string;
  campus?: string;
}

export interface ParsedSection extends ParsedListing {
  section: string;
}

const LISTING_RE =
  /^([A-Za-z]{2,8})(?:_([A-Za-z]))?\s+(\d{2,4}[A-Za-z]?)\s*(?:[-–]\s*(.+))?$/;
const SECTION_RE =
  /^([A-Za-z]{2,8})(?:_([A-Za-z]))?\s+(\d{2,4}[A-Za-z]?)-([A-Za-z0-9_]+)\s*(?:[-–]\s*(.+))?$/;

export function parseCourseListing(value: string): ParsedListing | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const match = cleaned.match(LISTING_RE);
  if (!match) return null;
  return {
    subject: match[1].toUpperCase(),
    campus: match[2]?.toUpperCase(),
    courseNumber: match[3],
    title: (match[4] ?? "").trim(),
  };
}

export function parseSectionListing(value: string): ParsedSection | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const match = cleaned.match(SECTION_RE);
  if (match) {
    return {
      subject: match[1].toUpperCase(),
      campus: match[2]?.toUpperCase(),
      courseNumber: match[3],
      section: match[4],
      title: (match[5] ?? "").trim(),
    };
  }
  const listing = parseCourseListing(cleaned);
  if (!listing) return null;
  return { ...listing, section: "" };
}

const MANUAL_CODE_RE =
  /^([A-Za-z]{2,8})(?:[_ ]([A-Za-z]))?[ _-]*(\d{2,4}[A-Za-z]?)(?:\s*[-–]\s*(.+))?$/;

export function parseManualCourseCode(
  value: string,
): { subject: string; courseNumber: string; title?: string } | null {
  const cleaned = value.trim();
  if (!cleaned) return null;

  const listing = parseCourseListing(cleaned);
  if (listing) {
    return {
      subject: listing.subject,
      courseNumber: listing.courseNumber,
      title: listing.title || undefined,
    };
  }

  const match = cleaned.match(MANUAL_CODE_RE);
  if (match) {
    return {
      subject: match[1].toUpperCase(),
      courseNumber: match[3].toUpperCase(),
      title: match[4]?.trim() || undefined,
    };
  }

  return { subject: cleaned, courseNumber: "" };
}

export function courseKeyOf(subject: string, courseNumber: string): string {
  return courseNumber ? `${subject}-${courseNumber}` : subject;
}

export function formatCourseCode(subject: string, courseNumber: string): string {
  return [subject, courseNumber].filter(Boolean).join(" ");
}

export function formatCourseSection(
  subject: string,
  courseNumber: string,
  section: string,
): string {
  const code = formatCourseCode(subject, courseNumber);
  return section ? `${code}-${section}` : code;
}

export function normalizeFormat(value: string): InstructionalFormat {
  const raw = value.trim().toLowerCase();
  if (raw.startsWith("lect")) return InstructionalFormat.Lecture;
  if (raw.startsWith("lab")) return InstructionalFormat.Laboratory;
  if (raw.startsWith("disc")) return InstructionalFormat.Discussion;
  if (raw.startsWith("tut")) return InstructionalFormat.Tutorial;
  if (raw.startsWith("thes")) return InstructionalFormat.Thesis;
  return InstructionalFormat.Other;
}

export function normalizeCourseType(value: string): CourseType {
  return courseTypeFromExcel(value);
}
