import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DotsHorizontalIcon, TrashIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnimatedIconHover } from "@/components/ui/hover-icon-button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatLocation } from "@/parser/meetingPatternParser";
import { formatCourseCode, formatCourseSection } from "@/parser/courseListingParser";
import { CatalogFilter, COURSE_TYPES, CourseSource, CourseType, WeekDay, type Course } from "@/types/course";
import { TERM_I18N_KEY } from "@/utils/appearance";
import { formatTimeRange } from "@/utils/time";
import { resolvePaletteColor } from "@/utils/colors";

interface CourseListProps {
  courses: Course[];
  focusId?: string | null;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onToggleTimetable: (id: string, on: boolean) => void;
  onColorChange: (id: string, color: string) => void;
}

export default function CourseList({ courses, focusId = null, onEdit, onDelete, onToggleTimetable, onColorChange }: CourseListProps) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const [filter, setFilter] = useState(CatalogFilter.All);
  const rowRefs = useRef(new Map<string, HTMLElement>());

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      if (filter === CatalogFilter.On) return course.onTimetable;
      if (filter === CatalogFilter.Off) return !course.onTimetable;
      return true;
    });
  }, [courses, filter]);

  useEffect(() => {
    if (!focusId) return;
    const course = courses.find((item) => item.id === focusId);
    if (!course) return;
    if (filter === CatalogFilter.On && !course.onTimetable) setFilter(CatalogFilter.All);
    if (filter === CatalogFilter.Off && course.onTimetable) setFilter(CatalogFilter.All);
    const frame = window.requestAnimationFrame(() => {
      rowRefs.current.get(focusId)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusId, courses, filter]);

  const unscheduled = useMemo(() => filtered.filter((course) => course.meetings.length === 0), [filtered]);
  const groups = useMemo(() => {
    const buckets: Record<CourseType, Course[]> = {
      [CourseType.Active]: [],
      [CourseType.Waitlist]: [],
      [CourseType.Drop]: [],
    };
    for (const course of filtered) {
      if (course.meetings.length === 0) continue;
      buckets[course.courseType].push(course);
    }
    return buckets;
  }, [filtered]);

  if (courses.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center">
        <div>
          <p className="text-sm font-medium">{t("catalogEmptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("catalogEmptyBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap gap-1 pb-3">
        {Object.values(CatalogFilter).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              filter === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setFilter(item)}
          >
            {t(`catalogFilter.${item}`)}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        {filtered.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">{t("catalogFilterEmpty")}</p> : null}
        {unscheduled.length > 0 ? (
          <CourseGroup title={`${t("unscheduledTitle")} · ${unscheduled.length}`}>
            {unscheduled.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                focused={focusId === course.id}
                onBind={(node) => {
                  if (node) rowRefs.current.set(course.id, node);
                  else rowRefs.current.delete(course.id);
                }}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleTimetable={onToggleTimetable}
                onColorChange={onColorChange}
              />
            ))}
          </CourseGroup>
        ) : null}
        {COURSE_TYPES.map((group) => {
          const items = groups[group];
          if (items.length === 0) return null;
          return (
            <CourseGroup key={group} title={`${t(`courseTypes.${group}`, { ns: LANG_NS })} · ${items.length}`}>
              {items.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  focused={focusId === course.id}
                  onBind={(node) => {
                    if (node) rowRefs.current.set(course.id, node);
                    else rowRefs.current.delete(course.id);
                  }}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleTimetable={onToggleTimetable}
                  onColorChange={onColorChange}
                />
              ))}
            </CourseGroup>
          );
        })}
      </div>
    </div>
  );
}

function CourseGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function CourseRow({
  course,
  focused,
  onBind,
  onEdit,
  onDelete,
  onToggleTimetable,
  onColorChange,
}: {
  course: Course;
  focused: boolean;
  onBind: (node: HTMLElement | null) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onToggleTimetable: (id: string, on: boolean) => void;
  onColorChange: (id: string, color: string) => void;
}) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const palette = resolvePaletteColor(course.color);
  const hasMeetings = course.meetings.length > 0;
  const menuIcon = useAnimatedIconHover();
  const trashIcon = useAnimatedIconHover();

  return (
    <div
      ref={onBind}
      className={`rounded-xl border p-3 transition-colors ${
        focused
          ? "border-foreground bg-muted"
          : course.onTimetable
            ? "border-foreground/15 bg-muted/40"
            : "bg-background"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Checkbox
          className="mt-0.5"
          checked={course.onTimetable}
          onCheckedChange={(checked) => onToggleTimetable(course.id, checked === true)}
          aria-label={t("addToTimetable")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <label
              className="relative size-3.5 shrink-0 cursor-pointer overflow-hidden rounded-full border"
              style={{ background: palette.bg, borderColor: palette.border }}
            >
              <input
                type="color"
                value={toColorInput(course.color)}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => onColorChange(course.id, event.target.value)}
                aria-label={t("formColor")}
              />
            </label>
            <p className="text-sm font-semibold">{formatCourseCode(course.subject, course.courseNumber)}</p>
            <TypeBadge type={course.courseType} />
            {course.source === CourseSource.Manual ? (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {t("statusManual")}
              </Badge>
            ) : null}
          </div>
          {course.title ? <p className="mt-0.5 text-xs text-muted-foreground">{course.title}</p> : null}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatCourseSection(course.subject, course.courseNumber, course.section)}
            {` · ${t(`formats.${course.instructionalFormat}`, { ns: LANG_NS })}`}
            {` · ${t(TERM_I18N_KEY[course.term], { ns: LANG_NS })}`}
          </p>
          {hasMeetings ? (
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              {course.meetings.map((meeting) => (
                <li key={meeting.id}>
                  {meeting.days.map((day) => t(`days.${shortDay(day)}`, { ns: LANG_NS })).join(" ")} · {formatTimeRange(meeting.startTime, meeting.endTime)}
                  {formatLocation(meeting) ? ` · ${formatLocation(meeting)}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-amber-700 dark:text-amber-400">{t("unscheduledHint")}</p>
              <Button type="button" size="xs" variant="outline" onClick={() => onEdit(course)}>
                {t("addTime")}
              </Button>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" {...menuIcon.hoverProps} />}>
            <DotsHorizontalIcon ref={menuIcon.ref} size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(course)}>{t("common.edit", { ns: LANG_NS })}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleTimetable(course.id, !course.onTimetable)}>
              {course.onTimetable ? t("removeFromTimetable") : t("addToTimetable")}
            </DropdownMenuItem>
            {hasMeetings ? null : <DropdownMenuItem onClick={() => onEdit(course)}>{t("addTime")}</DropdownMenuItem>}
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(course.id)} {...trashIcon.hoverProps}>
              <TrashIcon ref={trashIcon.ref} size={16} />
              {t("common.delete", { ns: LANG_NS })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: CourseType }) {
  const { t } = useTranslation(LANG_NS);
  if (type === CourseType.Waitlist) {
    return (
      <Badge variant="outline" className="h-4 border-dashed px-1.5 text-[10px]">
        {t(`courseTypes.${type}`)}
      </Badge>
    );
  }
  if (type === CourseType.Drop) {
    return (
      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
        {t(`courseTypes.${type}`)}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
      {t(`courseTypes.${type}`)}
    </Badge>
  );
}

function shortDay(day: WeekDay): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" {
  const names = {
    [WeekDay.Monday]: "Mon",
    [WeekDay.Tuesday]: "Tue",
    [WeekDay.Wednesday]: "Wed",
    [WeekDay.Thursday]: "Thu",
    [WeekDay.Friday]: "Fri",
  } as const;
  return names[day];
}

function toColorInput(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#DBEAFE";
}
