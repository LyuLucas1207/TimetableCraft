import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import { APP_NAME } from "@/constants";
import { formatCourseCode, formatCourseSection } from "@/parser/courseListingParser";
import { formatLocation } from "@/parser/meetingPatternParser";
import { COURSE_TYPE_BORDER, CourseType, WEEK_DAYS, WeekDay, type Course, type TimetableSettings } from "@/types/course";
import { TITLE_PRESET_I18N_KEY, isDefaultPresetTitle } from "@/utils/appearance";
import { uniqueCreditTotal, uniqueCourseCount } from "@/utils/credits";
import { resolvePaletteColor } from "@/utils/colors";
import { layoutOverlaps } from "@/utils/overlaps";
import { buildTimeSlots, formatDisplayTime, formatTimeRange, snapDown, snapUp, timeToMinutes, minutesToTime } from "@/utils/time";

interface TimetableProps {
  courses: Course[];
  settings: TimetableSettings;
  onBlockClick?: (course: Course) => void;
  exportRef?: Ref<HTMLDivElement>;
  interactive?: boolean;
  headerEdit?: ReactNode;
  onTitleCommit?: (title: string) => void;
}

interface BlockEvent {
  id: string;
  course: Course;
  day: WeekDay;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
  building?: string;
  room?: string;
}

const ROW_HEIGHT: Record<TimetableSettings["intervalMinutes"], number> = {
  15: 22,
  30: 36,
  60: 52,
  120: 68,
};

export default function Timetable({
  courses,
  settings,
  onBlockClick,
  exportRef,
  interactive = true,
  headerEdit,
  onTitleCommit,
}: TimetableProps) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const scheduled = courses.filter((course) => course.meetings.length > 0);
  const unscheduled = courses.filter((course) => course.meetings.length === 0);
  const layout = useMemo(() => buildLayout(scheduled, settings), [scheduled, settings]);

  if (scheduled.length === 0 && unscheduled.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <ClockIcon size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">{t("emptyTitle", { ns: PAGE.App })}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody", { ns: PAGE.App })}</p>
      </div>
    );
  }

  const rowHeight = ROW_HEIGHT[settings.intervalMinutes];
  const gridHeight = layout.slots.length * rowHeight;
  const credits = uniqueCreditTotal(courses);
  const titleLabel = isDefaultPresetTitle(settings.titlePreset, settings.title)
    ? t(TITLE_PRESET_I18N_KEY[settings.titlePreset], { ns: "language" })
    : settings.title || t("untitled", { ns: PAGE.App });

  return (
    <div
      ref={exportRef}
      className="min-w-[860px] overflow-visible rounded-2xl border shadow-sm"
      style={{ background: settings.pageBg, borderColor: settings.gridLine }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 overflow-visible rounded-t-2xl px-5 py-4 pr-6" style={{ background: settings.headerBg, color: settings.headerText }}>
        <div className="min-w-0 overflow-visible">
          {settings.showBrand ? (
            <p className="font-semibold tracking-wide uppercase" style={{ color: settings.kickerColor, fontSize: settings.kickerFontSize }}>
              {APP_NAME}
            </p>
          ) : null}
          <div className="flex min-w-0 items-center gap-1.5 overflow-visible">
            <TimetableTitle
              label={titleLabel}
              interactive={interactive}
              color={settings.headerText}
              fontSize={settings.titleFontSize}
              onCommit={onTitleCommit}
            />
            {interactive ? <ExportHide>{headerEdit}</ExportHide> : null}
          </div>
          {settings.subtitle ? (
            <p className="min-w-0 truncate" style={{ color: settings.kickerColor, fontSize: settings.subtitleFontSize }}>{settings.subtitle}</p>
          ) : null}
        </div>
        {settings.showCredits ? (
          <p className="shrink-0 text-sm" style={{ color: settings.kickerColor }}>
            {t("coursesCount", { ns: PAGE.App, count: uniqueCourseCount(courses) })}
            {credits > 0 ? ` · ${t("credits", { ns: PAGE.App, count: credits })}` : ""}
          </p>
        ) : null}
      </div>
      <div className={settings.showFooter ? "overflow-hidden" : "overflow-hidden rounded-b-2xl"}>
        <div
          className="grid grid-cols-[88px_repeat(5,1fr)] border-b text-xs font-semibold"
          style={{ borderColor: settings.gridLine }}
        >
          <div className="border-r px-3 py-2" style={{ background: settings.timeBg, color: settings.timeText, borderColor: settings.gridLine }}>
            {t("common.time", { ns: LANG_NS })}
          </div>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="px-3 py-2" style={{ background: settings.dayHeaderBg, color: settings.dayHeaderText }}>
              {t(`days.${day}`, { ns: LANG_NS })}
            </div>
          ))}
        </div>
        {unscheduled.length > 0 ? (
          <div className="border-b" style={{ borderColor: settings.gridLine, background: settings.pageBg }}>
            {unscheduled.map((course) => {
              const palette = resolvePaletteColor(course.color, settings.colorPreset);
              const label = settings.showSections
                ? formatCourseSection(course.subject, course.courseNumber, course.section)
                : formatCourseCode(course.subject, course.courseNumber);
              return (
                <div key={course.id} className="grid grid-cols-[88px_repeat(5,1fr)]">
                  <div className="flex items-center border-r px-2 text-[11px]" style={{ background: settings.timeBg, color: settings.timeText, borderColor: settings.gridLine }}>
                    {t("unscheduledBar", { ns: PAGE.App })}
                  </div>
                  <div className="col-span-5 p-1">
                    <button
                      type="button"
                      className={`flex min-h-9 w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-left ${
                        interactive ? "transition-transform hover:-translate-y-px" : "pointer-events-none"
                      }`}
                      style={{
                        background: palette.bg,
                        border: `1.5px ${COURSE_TYPE_BORDER[course.courseType]} ${palette.border}`,
                        color: palette.text,
                        borderRadius: settings.cornerRadius,
                        opacity: course.courseType === CourseType.Waitlist ? 0.92 : 1,
                      }}
                      title={`${label}\n${course.title}\n${t("unscheduledHint", { ns: PAGE.App })}`}
                      onClick={() => interactive && onBlockClick?.(course)}
                    >
                      <span className="shrink-0 font-bold" style={{ fontSize: settings.blockTitleFontSize }}>
                        {label}
                      </span>
                      {settings.showTitles && course.title ? (
                        <span className="min-w-0 truncate opacity-90" style={{ fontSize: settings.blockMetaFontSize }}>
                          {course.title}
                        </span>
                      ) : null}
                      <span className="ml-auto shrink-0 opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                        {t("unscheduledHint", { ns: PAGE.App })}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="relative grid grid-cols-[88px_repeat(5,1fr)]" style={{ height: gridHeight, background: settings.pageBg }}>
          <div style={{ background: settings.timeBg }}>
            {layout.slots.map((slot) => (
              <div
                key={slot}
                className="flex items-start border-b px-2 text-[11px]"
                style={{ height: rowHeight, borderColor: settings.gridLine, color: settings.timeText, background: settings.timeBg }}
              >
                {formatDisplayTime(slot)}
              </div>
            ))}
          </div>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="relative border-l" style={{ borderColor: settings.gridLine }}>
              {layout.slots.map((slot) => (
                <div key={slot} className="border-b" style={{ height: rowHeight, borderColor: settings.gridLine }} />
              ))}
              {layout.byDay[day].map((item) => {
                const top = ((item.event.startMin - layout.startMin) / settings.intervalMinutes) * rowHeight;
                const height = ((item.event.endMin - item.event.startMin) / settings.intervalMinutes) * rowHeight;
                const width = 100 / item.columns;
                const left = item.column * width;
                const palette = resolvePaletteColor(item.event.course.color, settings.colorPreset);
                const course = item.event.course;
                const label = settings.showSections
                  ? formatCourseSection(course.subject, course.courseNumber, course.section)
                  : formatCourseCode(course.subject, course.courseNumber);
                return (
                  <button
                    key={item.event.id}
                    type="button"
                    className={`absolute overflow-hidden px-1.5 py-1 text-left shadow-sm ${interactive ? "transition-transform hover:-translate-y-px" : "pointer-events-none"}`}
                    style={{
                      top: top + 2,
                      height: Math.max(height - 4, 24),
                      left: `calc(${left}% + 4px)`,
                      width: `calc(${width}% - 8px)`,
                      background: palette.bg,
                      border: `1.5px ${COURSE_TYPE_BORDER[course.courseType]} ${palette.border}`,
                      color: palette.text,
                      borderRadius: settings.cornerRadius,
                      opacity: course.courseType === CourseType.Waitlist ? 0.92 : 1,
                    }}
                    title={`${label}\n${course.title}\n${formatTimeRange(item.event.startTime, item.event.endTime)}\n${formatLocation(item.event)}`}
                    onClick={() => interactive && onBlockClick?.(course)}
                  >
                    <div className="truncate font-bold leading-tight" style={{ fontSize: settings.blockTitleFontSize }}>
                      {label}
                    </div>
                    {settings.showTitles && height > 40 ? (
                      <div className="truncate leading-tight opacity-90" style={{ fontSize: settings.blockMetaFontSize }}>
                        {course.title}
                      </div>
                    ) : null}
                    {height > 54 ? (
                      <div className="truncate opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                        {formatTimeRange(item.event.startTime, item.event.endTime)}
                      </div>
                    ) : null}
                    {settings.showRooms && height > 68 ? (
                      <div className="truncate opacity-80" style={{ fontSize: settings.blockMetaFontSize }}>
                        {formatLocation(item.event)}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {settings.showFooter ? (
        <p className="rounded-b-2xl px-5 py-3 text-xs" style={{ color: settings.footerColor }}>
          {settings.footerText || t("exportFooter", { ns: PAGE.App })}
        </p>
      ) : null}
    </div>
  );
}

function ExportHide({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <span data-export-hide="" className="inline-flex shrink-0 overflow-visible">
      {children}
    </span>
  );
}

function TimetableTitle({
  label,
  interactive,
  color,
  fontSize,
  onCommit,
}: {
  label: string;
  interactive: boolean;
  color: string;
  fontSize: number;
  onCommit?: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  useEffect(() => {
    setDraft(label);
  }, [label]);

  useEffect(() => {
    if (!editing) return;
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, [editing]);

  const commit = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      setEditing(false);
      setDraft(label);
      return;
    }
    const next = draft.trim();
    setEditing(false);
    if (!next || next === label) {
      setDraft(label);
      return;
    }
    onCommit?.(next);
  };

  if (editing && interactive) {
    return (
      <input
        ref={inputRef}
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            skipCommitRef.current = true;
            event.currentTarget.blur();
          }
        }}
        className="min-w-[8rem] max-w-full rounded-md border border-current/25 bg-transparent px-1.5 py-0.5 font-semibold leading-tight outline-none"
        style={{ color, fontSize }}
      />
    );
  }

  if (!interactive || !onCommit) {
    return (
      <h2 className="min-w-0 truncate font-semibold leading-tight" style={{ color, fontSize }}>
        {label}
      </h2>
    );
  }

  return (
    <button
      type="button"
      className="min-w-0 cursor-text truncate rounded-md border-0 bg-transparent p-0 text-left font-semibold leading-tight hover:opacity-80"
      style={{ color, fontSize }}
      onClick={() => setEditing(true)}
    >
      {label}
    </button>
  );
}

function buildLayout(courses: Course[], settings: TimetableSettings) {
  const events: BlockEvent[] = [];
  for (const course of courses) {
    for (const meeting of course.meetings) {
      for (const day of meeting.days) {
        events.push({
          id: `${course.id}-${meeting.id}-${day}`,
          course,
          day,
          startMin: timeToMinutes(meeting.startTime),
          endMin: timeToMinutes(meeting.endTime),
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          building: meeting.building,
          room: meeting.room,
        });
      }
    }
  }

  let startMin = timeToMinutes(settings.startTime);
  let endMin = timeToMinutes(settings.endTime);
  if (settings.autoBounds && events.length > 0) {
    const minEvent = Math.min(...events.map((event) => event.startMin));
    const maxEvent = Math.max(...events.map((event) => event.endMin));
    startMin = Math.min(startMin, snapDown(minEvent, settings.intervalMinutes));
    endMin = Math.max(endMin, snapUp(maxEvent, settings.intervalMinutes));
  }

  const slots = buildTimeSlots(minutesToTime(startMin), minutesToTime(endMin), settings.intervalMinutes);
  const byDay = Object.fromEntries(
    WEEK_DAYS.map((day) => [day, layoutOverlaps(events.filter((event) => event.day === day))]),
  ) as Record<WeekDay, ReturnType<typeof layoutOverlaps<BlockEvent>>>;

  return { slots, byDay, startMin, endMin };
}
