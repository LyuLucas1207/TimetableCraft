import { Term } from "@/types/course";

const WINTER_RE = /winter\s*term\s*([12])/i;
const SUMMER_RE = /summer\s*term\s*([12])/i;

export function detectTerm(...values: Array<string | undefined>): Term | null {
  for (const value of values) {
    if (!value) continue;
    const summer = value.match(SUMMER_RE);
    if (summer) return summer[1] === "1" ? Term.S1 : Term.S2;
    const winter = value.match(WINTER_RE);
    if (winter) return winter[1] === "1" ? Term.W1 : Term.W2;
  }
  return null;
}

export function termFromDates(startDate?: string, endDate?: string): Term | null {
  const sample = startDate || endDate;
  if (!sample) return null;
  const month = Number(sample.slice(5, 7));
  if (!month) return null;
  if (month >= 9 && month <= 12) return Term.W1;
  if (month >= 1 && month <= 4) return Term.W2;
  if (month === 5 || month === 6) return Term.S1;
  if (month === 7 || month === 8) return Term.S2;
  return null;
}
