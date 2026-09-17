import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { LANG_NS, PAGE } from "@/assets/language";
import { WEEK_DAYS, type Course, type TimetableSettings, type WeekDay } from "@/types/course";
import { coursesToEvents } from "@/utils/schedule";
import { uniqueCreditTotal, uniqueCourseCount } from "@/utils/credits";
import TimetableEngine from "./TimetableEngine";

interface TimetableProps {
  courses: Course[];
  settings: TimetableSettings;
  onBlockClick?: (course: Course) => void;
  onSlotClick?: (day: WeekDay, startTime: string) => void;
  exportRef?: Ref<HTMLDivElement>;
  interactive?: boolean;
  headerEdit?: ReactNode;
  onTitleCommit?: (title: string) => void;
}

/** Compatibility adapter: course editing/storage stay separate from rendering. */
export default function Timetable({ courses, onBlockClick, onSlotClick, ...props }: TimetableProps) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const credits = uniqueCreditTotal(courses);
  return <TimetableEngine {...props}
    events={coursesToEvents(courses, props.settings.showSections)}
    columns={WEEK_DAYS.map((day) => ({ key: day, day, label: t(`days.${day}`, { ns: LANG_NS }) }))}
    summary={props.settings.showCredits ? `${t("coursesCount", { count: uniqueCourseCount(courses) })}${credits > 0 ? ` · ${t("credits", { count: credits })}` : ""}` : undefined}
    onBlockClick={(event) => { const course = courses.find((item) => item.id === event.sourceCourseId); if (course) onBlockClick?.(course); }}
    onSlotClick={onSlotClick ? (column, time) => { if (column.day) onSlotClick(column.day, time); } : undefined}
  />;
}
