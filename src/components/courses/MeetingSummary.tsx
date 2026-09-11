import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { PAGE } from "@/assets/language";
import type { WeekDay } from "@/types/course";
import { parseOptionalTimeRange } from "@/utils/time";

export function MeetingSummary({
  days,
  startTime,
  endTime,
}: {
  days: WeekDay[];
  startTime: string;
  endTime: string;
}): ReactNode {
  const { t } = useTranslation([PAGE.App, "language"]);
  const range = parseOptionalTimeRange(startTime, endTime);
  const dayLabel = days.map((day) => t(`days.${day}`, { ns: "language" })).join(" ");
  if (days.length === 0 && range === "empty") {
    return t("formMeetingEmpty", { ns: PAGE.App });
  }
  const timeLabel = range === "empty" || range === "invalid" ? "" : `${range.startTime} – ${range.endTime}`;
  return [dayLabel, timeLabel].filter(Boolean).join(" · ") || t("formMeetingEmpty", { ns: PAGE.App });
}
