import { WeekDay, type CourseMeeting } from "@/types/course";
import { createId } from "@/utils/ids";
import { normalizeTime } from "@/utils/time";

const DAY_MAP: Record<string, WeekDay> = {
  mon: WeekDay.Monday,
  monday: WeekDay.Monday,
  tue: WeekDay.Tuesday,
  tues: WeekDay.Tuesday,
  tuesday: WeekDay.Tuesday,
  wed: WeekDay.Wednesday,
  weds: WeekDay.Wednesday,
  wednesday: WeekDay.Wednesday,
  thu: WeekDay.Thursday,
  thur: WeekDay.Thursday,
  thurs: WeekDay.Thursday,
  thursday: WeekDay.Thursday,
  fri: WeekDay.Friday,
  friday: WeekDay.Friday,
};

const DATE_RE = /(\d{4}-\d{2}-\d{2})/g;
const TIME_RANGE_RE =
  /(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)/i;

function parseDays(value: string): WeekDay[] {
  const days: WeekDay[] = [];
  const seen = new Set<WeekDay>();
  for (const token of value.replace(/[,/]/g, " ").split(/\s+/)) {
    const day = DAY_MAP[token.trim().toLowerCase()];
    if (day && !seen.has(day)) {
      seen.add(day);
      days.push(day);
    }
  }
  return days;
}

function parseBuilding(value: string): { building?: string; buildingName?: string } {
  const match = value.match(/^(.*?)(?:\(([^)]+)\))?$/);
  if (!match) return {};
  const name = match[1].trim();
  const abbr = match[2]?.trim();
  return {
    buildingName: name || undefined,
    building: abbr || name || undefined,
  };
}

function parseBlock(block: string): CourseMeeting | null {
  const parts = block
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;

  const dates = parts[0].match(DATE_RE) ?? [];
  const days = parseDays(parts[1]);
  if (days.length === 0) return null;

  const timeMatch = parts[2].match(TIME_RANGE_RE);
  if (!timeMatch) return null;
  const startTime = normalizeTime(timeMatch[1]);
  const endTime = normalizeTime(timeMatch[2]);
  if (!startTime || !endTime) return null;

  let campus: string | undefined;
  let building: string | undefined;
  let buildingName: string | undefined;
  let floor: string | undefined;
  let room: string | undefined;

  for (let i = 3; i < parts.length; i += 1) {
    const part = parts[i];
    const floorMatch = part.match(/^floor:\s*(.+)$/i);
    const roomMatch = part.match(/^room:\s*(.+)$/i);
    if (floorMatch) {
      floor = floorMatch[1].trim();
      continue;
    }
    if (roomMatch) {
      room = roomMatch[1].trim();
      continue;
    }
    if (!campus && /^(UBCV|UBCO|UBC-?V|UBC-?O)$/i.test(part)) {
      campus = part.toUpperCase().replace("-", "");
      continue;
    }
    if (!buildingName) {
      const parsed = parseBuilding(part);
      building = parsed.building;
      buildingName = parsed.buildingName;
    }
  }

  return {
    id: createId(),
    days,
    startTime,
    endTime,
    campus,
    building,
    buildingName,
    floor,
    room,
    startDate: dates[0],
    endDate: dates[1] ?? dates[0],
  };
}

function splitBlocks(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blankSplit = normalized
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter(Boolean);
  if (blankSplit.length > 1) return blankSplit;

  const blocks: string[] = [];
  let current = "";
  for (const line of normalized.split("\n").map((item) => item.trim()).filter(Boolean)) {
    if (/^\d{4}-\d{2}-\d{2}/.test(line) && current) {
      blocks.push(current);
      current = line;
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function meetingSignature(meeting: CourseMeeting): string {
  return [meeting.days.join(","), meeting.startTime, meeting.endTime, meeting.building ?? "", meeting.room ?? ""].join("|");
}

export function parseMeetingPatterns(value: string | undefined): CourseMeeting[] {
  if (!value?.trim()) return [];
  const meetings: CourseMeeting[] = [];
  const seen = new Map<string, CourseMeeting>();

  for (const block of splitBlocks(value)) {
    const meeting = parseBlock(block);
    if (!meeting) continue;
    const key = meetingSignature(meeting);
    const existing = seen.get(key);
    if (existing) {
      if (meeting.startDate && (!existing.startDate || meeting.startDate < existing.startDate)) {
        existing.startDate = meeting.startDate;
      }
      if (meeting.endDate && (!existing.endDate || meeting.endDate > existing.endDate)) {
        existing.endDate = meeting.endDate;
      }
      continue;
    }
    seen.set(key, meeting);
    meetings.push(meeting);
  }

  return meetings;
}

export function formatLocation(meeting: Pick<CourseMeeting, "building" | "room">): string {
  return [meeting.building, meeting.room].filter(Boolean).join(" ");
}

export function formatDaysShort(days: WeekDay[]): string {
  const short: Record<WeekDay, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
  };
  return days.map((day) => short[day]).join(" ");
}
