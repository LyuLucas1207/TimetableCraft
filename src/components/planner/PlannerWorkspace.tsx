import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AlarmClockPlusIcon, ArrowBackUpIcon, ArrowNarrowLeftIcon, ArrowNarrowRightIcon, ClockIcon, CopyIcon, DownloadIcon, FileDescriptionIcon, LayoutDashboardIcon, LinkIcon, SlidersHorizontalIcon, SparklesIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { PLANNER_ICONS } from "./icons";
import { toast } from "sonner";
import { PLANNERS, TEMPLATES, buildTemplate, plannerPath, type PlannerDefinition } from "@/config/planners";
import { PLANNER_STORES, usePlannerStore, type PlannerDocument } from "@/stores/planners";
import { ALL_WEEK_DAYS, type PlannerColumn, type ScheduleColumn, type ScheduleEvent } from "@/types/schedule";
import { GridInterval, TimetableTheme, type TimetableSettings, type WeekDay } from "@/types/course";
import { appearanceFromTheme } from "@/utils/appearance";
import { addDays, coursesToEvents, eventMinutes, expandOvernight, isCalendarEvent, isValidDate, localToday, validateScheduleEvent } from "@/utils/schedule";
import { createId } from "@/utils/ids";
import { addDuration, minutesToTime, timeToMinutes } from "@/utils/time";
import { exportNodeToPng } from "@/utils/exportImage";
import { buildScheduleCalendar } from "@/utils/exportScheduleCalendar";
import { downloadTextFile, filenameFromTitle } from "@/utils/download";
import { printSchedule } from "@/utils/printSchedule";
import { legendEntries, numberMeta, orderedDays, stringMeta } from "@/utils/planStats";
import { mergeDocuments } from "@/utils/planIO";
import { decodeShare, sharePayloadFromHash } from "@/utils/shareLink";
import TimetableEngine from "@/components/timetable/TimetableEngine";
import PreferencesPopover from "@/components/PreferencesPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnumSelect } from "@/components/ui/enum-select";
import { ToggleRow } from "@/components/timetable/AppearanceEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EventEditor from "./EventEditor";
import PlannerView from "./PlannerViews";
import ColumnEditor from "./ColumnEditor";
import DataDialog from "./DataDialog";
import SmartFillDialog from "./SmartFillDialog";
import { fmtRange, type CreateOptions } from "./views/parts";

const columnTarget = (event: ScheduleEvent, column: PlannerColumn): ScheduleEvent => ({
  ...event, columnKey: column.id,
  days: column.kind === "day" && column.day ? [column.day] : undefined,
  date: column.kind === "date" ? column.date : undefined,
});

export default function PlannerWorkspace({ planner }: { planner: PlannerDefinition }) {
  const { t, i18n } = useTranslation("pages.Planner");
  const navigate = useNavigate();
  const PlannerIcon = PLANNER_ICONS[planner.id];
  const store = usePlannerStore(planner.id);
  const { document: doc, update, saveEvent, appendEvents, deleteEvent, duplicateEvent, toggleCheckin, clear, replaceDocument, undo, redo } = store;
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [pane, setPane] = useState<"events" | "settings">(planner.id === "custom" ? "settings" : "events");
  const [showGrid, setShowGrid] = useState(planner.id === "weekly");
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("preview");
  const [busy, setBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[planner.id][0].id);
  const [shared, setShared] = useState<{ document: PlannerDocument; dropped: number } | null>(null);
  const today = localToday();
  const [range, setRange] = useState({ start: today, end: addDays(today, 90) });
  const exportRef = useRef<HTMLDivElement>(null);
  const prefs = doc.prefs;
  const hour24 = prefs.hour24;
  const title = doc.settings.title || t(`tools.${planner.id}.name`);
  const addLabel = t(`views.${planner.id}.action`, { defaultValue: t("addEvent") });
  const canvasHint = showGrid ? t("canvasHint") : t(`views.${planner.id}.hint`, { defaultValue: t("canvasHint") });
  const sidebarTitle = t(`views.${planner.id}.sidebarTitle`, { defaultValue: t("events") });
  const sidebarEmpty = t(`views.${planner.id}.sidebarEmpty`, { defaultValue: t("empty") });
  const previewLabel = t(`views.${planner.id}.mobilePreview`, { defaultValue: t("preview") });
  const viewName = t(`views.${planner.id}.viewName`, { defaultValue: t("views.common.specialView") });
  const settings = { ...doc.settings, title };
  const setSettings = (patch: Partial<TimetableSettings>) => update({ settings: { ...doc.settings, ...patch } });
  const setPrefs = (patch: Partial<typeof prefs>) => update({ prefs: { ...prefs, ...patch } });
  const dateLabel = (date: string) => new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", weekday: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  const dayLabel = (day: WeekDay, short = false) => short
    ? new Intl.DateTimeFormat(i18n.language, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + ALL_WEEK_DAYS.indexOf(day))))
    : t(`days.${day}`, { ns: "language" });
  const days = orderedDays(prefs.weekStart, prefs.showWeekend);
  const customColumns = planner.id === "custom" ? doc.columns : undefined;

  // Category filter: hidden categories stay saved, they are only left off the canvas and exports of the canvas.
  const visible = useMemo(() => doc.events.filter((event) => !hidden.includes(event.category?.trim() ?? "")), [doc.events, hidden]);
  const segments = useMemo(() => expandOvernight(visible), [visible]);
  const legend = legendEntries(visible);
  const allCategories = [...new Set(doc.events.map((event) => event.category?.trim() ?? ""))].filter(Boolean);

  const dates = planner.mode === "day" ? [doc.date] : [...new Set(visible.flatMap((event) => event.date ? [event.date] : []))].sort();
  const columns: ScheduleColumn[] = customColumns
    ? customColumns.map((column) => ({ key: column.id, label: column.label, day: column.kind === "day" ? column.day : undefined, date: column.kind === "date" ? column.date : undefined, color: column.color }))
    : planner.mode === "week" ? days.map((day) => ({ key: day, day, label: dayLabel(day) })) : (dates.length ? dates : [doc.date]).map((date) => ({ key: date, date, label: dateLabel(date) }));
  const shownEvents = planner.mode === "day" ? segments.filter((event) => event.date === doc.date) : segments;
  const base = (event: ScheduleEvent) => doc.events.find((item) => item.id === (event.baseId ?? event.id)) ?? event;

  const create = (options: CreateOptions & { column?: ScheduleColumn } = {}) => {
    const time = options.time ?? "09:00";
    const event: ScheduleEvent = { id: createId(), title: options.title ?? "", color: "#DBEAFE", startTime: time, endTime: addDuration(time, 60) ?? "23:59", category: "", ...(planner.id === "exam" ? { reminderMinutes: 120 } : {}) };
    if (customColumns) {
      const column = customColumns.find((item) => item.id === options.column?.key) ?? customColumns[0];
      setEditing(columnTarget(event, column));
    } else if (planner.mode === "week") setEditing({ ...event, days: [options.column?.day ?? options.day ?? days[0] ?? ALL_WEEK_DAYS[0]] });
    else setEditing({ ...event, date: options.column?.date ?? options.date ?? doc.date });
  };
  const guarded = (action: () => void) => { try { action(); } catch (error) { toast.error(t(error instanceof Error ? error.message : "errorSave")); } };
  const runExport = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } catch { toast.error(t("errorExport")); } finally { setBusy(false); }
  };

  const copyClasses = async () => {
    const { selectTimetableCourses, useScheduleStore } = await import("@/stores/schedule");
    const courses = selectTimetableCourses(useScheduleStore.getState().courses);
    const all = coursesToEvents(courses);
    const valid = all.filter((event) => !validateScheduleEvent(event));
    const next = valid.filter((event) => !doc.events.some((existing) => existing.id === `class-copy:${event.id}`)).map((event) => ({ ...event, id: `class-copy:${event.id}` }));
    if (!next.length) { toast.info(t("noClasses")); return; }
    appendEvents(next);
    toast.success(t("classesCopied", { count: next.length }));
    if (all.length > valid.length) toast.info(t("unscheduledSkipped", { count: all.length - valid.length }));
  };

  const copyDay = (from: { day?: WeekDay; date?: string }, to: { day?: WeekDay; date?: string }[]) => {
    const source = doc.events.filter((event) => from.day ? event.days?.includes(from.day) && !event.date : event.date === from.date);
    const copies: ScheduleEvent[] = [];
    for (const target of to) {
      for (const event of source) {
        const next: ScheduleEvent = { ...event, id: createId(), done: undefined, meta: event.meta ? { ...event.meta } : undefined, ...(target.day ? { days: [target.day], date: undefined } : { date: target.date, days: undefined }) };
        const same = (item: ScheduleEvent) => item.title === next.title && item.startTime === next.startTime && item.endTime === next.endTime && (target.day ? item.days?.includes(target.day) : item.date === target.date);
        if (!doc.events.some(same) && !copies.some(same)) copies.push(next);
      }
    }
    if (!copies.length) { toast.info(t("copyDayNothing")); return; }
    guarded(() => { appendEvents(copies); toast.success(t("copyDayDone", { count: copies.length })); });
  };

  const addTemplate = () => {
    const built = buildTemplate(planner.id, templateId, planner.id === "daily" ? doc.date : today, (key) => t(key), (day) => dayLabel(day));
    let extra: Partial<typeof doc> | undefined;
    if (built.columns) {
      const existing = doc.columns ?? (doc.events.length ? ALL_WEEK_DAYS.map<PlannerColumn>((day) => ({ id: createId(), kind: "day", day, label: dayLabel(day) })) : []);
      extra = { columns: [...existing, ...built.columns] };
      // Events from before columns existed keep matching the weekday columns we just made explicit.
    }
    guarded(() => { appendEvents(built.events, extra); toast.success(t("templateAdded")); });
  };

  const changeColumns = (next: PlannerColumn[] | undefined) => {
    const known = new Map((next ?? []).map((column) => [column.id, column]));
    const events = doc.events.flatMap<ScheduleEvent>((event) => {
      if (!event.columnKey) return [event];
      const column = known.get(event.columnKey);
      if (column) return [columnTarget(event, column)];
      // Resetting to the weekday layout keeps events that know when they happen; deleting a column deletes what was in it.
      return next === undefined && (event.days?.length || event.date) ? [{ ...event, columnKey: undefined }] : [];
    });
    update({ columns: next, events });
  };

  const moveBlock = (segment: ScheduleEvent, column: ScheduleColumn, startTime: string, from: ScheduleColumn) => guarded(() => {
    const event = base(segment);
    const start = timeToMinutes(startTime);
    const end = Math.min(24 * 60 - 1, start + eventMinutes(event));
    let next: ScheduleEvent = { ...event, startTime, endTime: minutesToTime(end) };
    const target = customColumns?.find((item) => item.id === column.key);
    if (target) next = columnTarget(next, target);
    else if (planner.mode === "week" && column.day && from.day && column.day !== from.day) next = { ...next, days: [...new Set(event.days?.map((day) => (day === from.day ? column.day! : day)))] };
    else if (planner.mode === "dates" && column.date) next = { ...next, date: column.date };
    saveEvent(next);
  });
  const resizeBlock = (segment: ScheduleEvent, endTime: string) => guarded(() => saveEvent({ ...base(segment), endTime: endTime === "24:00" ? "23:59" : endTime }));

  const describe = (event: ScheduleEvent): string[] => [
    stringMeta(event, "code") && `${t("fields.code")}: ${stringMeta(event, "code")}`, stringMeta(event, "seat") && `${t("fields.seat")}: ${stringMeta(event, "seat")}`,
    stringMeta(event, "allowed") && `${t("fields.allowed")}: ${stringMeta(event, "allowed")}`, stringMeta(event, "role") && `${t("fields.role")}: ${stringMeta(event, "role")}`,
    stringMeta(event, "subject") && `${t("fields.subject")}: ${stringMeta(event, "subject")}`, numberMeta(event, "breakMin") ? `${t("fields.breakMin")}: ${numberMeta(event, "breakMin")}` : "",
  ].filter(Boolean);

  // Undo / redo from the keyboard, but never while the user is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); } else if (key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // A shared link opens as a proposal: nothing changes until the user picks merge or replace.
  useEffect(() => {
    const payload = sharePayloadFromHash(window.location.hash);
    if (!payload) return;
    void decodeShare(payload, planner.id).then(setShared).catch((error) => toast.error(t(error instanceof Error ? error.message : "errorShareFormat")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planner.id]);
  const closeShared = () => { setShared(null); window.history.replaceState(null, "", window.location.pathname + window.location.search); };

  const sorted = [...doc.events].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.startTime.localeCompare(b.startTime));
  const canUndo = store.past.length > 0;
  const canRedo = store.future.length > 0;
  const gridProps = {
    events: shownEvents, columns, settings, exportRef, hour24,
    onBlockClick: (event: ScheduleEvent) => setEditing(base(event)),
    onSlotClick: (column: ScheduleColumn, time: string) => create({ column, time }),
    onTitleCommit: (value: string) => setSettings({ title: value }),
    onBlockMove: moveBlock, onBlockResize: resizeBlock,
    emptyHint: t("empty"), slotLabel: (column: ScheduleColumn, time: string) => `${t("addEvent")}: ${column.label} ${time}`,
    legend: legend.length ? <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">{legend.map((item) => <span key={item.category} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border" style={{ background: item.color }} />{item.category}</span>)}</div> : undefined,
  };

  return <div className="flex h-full min-h-0 flex-col">
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-background px-4 py-3 md:px-6">
      <HoverIconButton icon={ArrowNarrowLeftIcon} variant="outline" size="sm" nativeButton={false} render={<Link to="/tools" />}>{t("allTools")}</HoverIconButton>
      <div className="hidden h-6 border-l sm:block" />
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-64">
        <span aria-hidden="true" className="pointer-events-none inline-flex shrink-0"><PlannerIcon size={20} /></span>
        <EnumSelect
          aria-label={t("switchTool")}
          value={plannerPath(planner)}
          onChange={(path) => navigate(path)}
          options={[
            { value: "/tools/schedule-maker", label: t("className") },
            ...PLANNERS.map((item) => ({ value: plannerPath(item), label: t(`tools.${item.id}.name`) })),
          ]}
        />
      </div>
      <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">{t("localSave")}</span><PreferencesPopover />
    </header>
    <div className="flex min-h-0 flex-1 flex-col p-3 md:p-5">
      <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 lg:hidden"><Button className="min-w-0" variant={mobilePane === "editor" ? "default" : "outline"} onClick={() => setMobilePane("editor")}>{t("views.common.mobileEdit")}</Button><Button className="min-w-0" variant={mobilePane === "preview" ? "default" : "outline"} onClick={() => setMobilePane("preview")}>{previewLabel}</Button></div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className={`${mobilePane === "editor" ? "flex" : "hidden"} min-h-0 flex-col overflow-hidden rounded-2xl border bg-background lg:flex`}>
          <div className="shrink-0 border-b p-4"><h1 className="text-xl font-semibold tracking-tight">{t(`tools.${planner.id}.name`)}</h1><p className="mt-2 text-xs leading-5 text-muted-foreground">{t(`tools.${planner.id}.description`)}</p><div className="mt-4 flex gap-2"><HoverIconButton icon={AlarmClockPlusIcon} className="flex-1" onClick={() => create()}>{addLabel}</HoverIconButton><HoverIconButton icon={SlidersHorizontalIcon} size="icon" variant={pane === "settings" ? "secondary" : "outline"} aria-label={t("settings")} onClick={() => setPane(pane === "events" ? "settings" : "events")} /></div></div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {pane === "settings" ? <>
              <h2 className="text-sm font-semibold">{t("settings")}</h2>
              <Label className="block space-y-1 text-sm">{t("scheduleTitle")}<Input value={title} onChange={(e) => setSettings({ title: e.target.value })} /></Label>
              <Label className="block space-y-1 text-sm">{t("subtitle")}<Input value={settings.subtitle} onChange={(e) => setSettings({ subtitle: e.target.value })} /></Label>
              <div className="space-y-1">
                <Label>{t("theme")}</Label>
                <EnumSelect aria-label={t("theme")} value={settings.theme} onChange={(theme) => setSettings(appearanceFromTheme(theme))}
                  options={Object.values(TimetableTheme).map((theme) => ({ value: theme, label: t(`theme${theme[0].toUpperCase()}${theme.slice(1)}`, { ns: "pages.App" }) }))} />
              </div>
              <div className="space-y-1">
                <Label>{t("interval")}</Label>
                <EnumSelect aria-label={t("interval")} value={settings.intervalMinutes} onChange={(intervalMinutes) => setSettings({ intervalMinutes })}
                  options={[GridInterval.Fifteen, GridInterval.Thirty, GridInterval.Sixty, GridInterval.OneTwenty].map((value) => ({ value, label: t("minutes", { count: value }) }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">{(["startTime", "endTime"] as const).map((key) => <Label className="block space-y-1 text-sm" key={key}>{t(key)}<Input type="time" value={settings[key]} onChange={(e) => { const next = { ...settings, [key]: e.target.value }; if (next.startTime && next.endTime && next.startTime < next.endTime) setSettings({ [key]: e.target.value }); else toast.error(t("errorTime")); }} /></Label>)}</div>
              <p className="text-xs text-muted-foreground">{t("boundsHint")}</p>
              {(["collapseEmptyTime", "showRooms", "showTitles", "showBrand", "showFooter"] as const).map((key) => (
                <ToggleRow key={key} label={t(key)} checked={settings[key]} onChange={(checked) => setSettings({ [key]: checked })} />
              ))}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">{t("prefs.title")}</h3>
                <div className="space-y-1"><Label>{t("prefs.weekStart")}</Label>
                  <EnumSelect aria-label={t("prefs.weekStart")} value={prefs.weekStart} onChange={(weekStart) => setPrefs({ weekStart })} options={[{ value: "mon", label: dayLabel(ALL_WEEK_DAYS[0]) }, { value: "sun", label: dayLabel(ALL_WEEK_DAYS[6]) }]} /></div>
                <ToggleRow label={t("prefs.hour24")} checked={prefs.hour24} onChange={(checked) => setPrefs({ hour24: checked })} />
                <ToggleRow label={t("prefs.showWeekend")} checked={prefs.showWeekend} onChange={(checked) => setPrefs({ showWeekend: checked })} />
                <p className="text-xs text-muted-foreground">{t("prefs.hint")}</p>
              </div>
            </> : <>
              <div className="rounded-xl border bg-muted/30 p-3"><p className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true"><LayoutDashboardIcon size={15} /></span>{t("templateTitle")}</p><p className="my-2 text-xs leading-5 text-muted-foreground">{t("templateHint")}</p>
                {TEMPLATES[planner.id].length > 1 && <div className="mb-2 space-y-1"><EnumSelect aria-label={t("templateChoose")} value={templateId} onChange={setTemplateId} options={TEMPLATES[planner.id].map((item) => ({ value: item.id, label: t(`templates.${planner.id}.${item.id}.name`) }))} /><p className="text-xs leading-5 text-muted-foreground">{t(`templates.${planner.id}.${templateId}.hint`)}</p></div>}
                <HoverIconButton icon={LayoutDashboardIcon} className="w-full" variant="outline" onClick={addTemplate}>{t("addTemplate")}</HoverIconButton></div>
              {planner.id === "study" && <div className="space-y-2"><HoverIconButton icon={CopyIcon} variant="outline" className="w-full" onClick={() => { void copyClasses().catch(() => toast.error(t("errorSave"))); }}>{t("copyClasses")}</HoverIconButton><HoverIconButton icon={SparklesIcon} variant="outline" className="w-full" onClick={() => setFillOpen(true)}>{t("smartFill.open")}</HoverIconButton><p className="text-xs leading-5 text-muted-foreground">{t("copyHint")} <Link className="underline" to="/tools/schedule-maker">{t("className")}</Link></p></div>}
              {planner.id === "custom" && <ColumnEditor columns={doc.columns} dayLabel={(day) => dayLabel(day)} onChange={changeColumns} />}
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{sidebarTitle}</h2><span className="text-xs text-muted-foreground">{doc.events.length}</span></div>
              {!doc.events.length && <p className="py-4 text-sm leading-6 text-muted-foreground">{sidebarEmpty}</p>}
              <ul className="space-y-2">{sorted.map((event) => <li key={event.id}><Button variant="outline" className="block h-auto w-full whitespace-normal rounded-xl p-3 text-left" onClick={() => setEditing(event)}><div className="flex items-center gap-2"><span className="size-3 shrink-0 rounded-full border" style={{ background: event.color }} /><span className={`truncate text-sm font-medium ${event.done ? "line-through opacity-60" : ""}`}>{event.title}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.date ? dateLabel(event.date) : event.columnKey && !event.days?.length ? customColumns?.find((column) => column.id === event.columnKey)?.label : event.days?.map((day) => dayLabel(day, true)).join(" · ")}</p><p className="mt-1 text-xs text-muted-foreground">{fmtRange(event.startTime, event.endTime, hour24)}</p></Button></li>)}</ul>
            </>}
          </div>
        </aside>
        <section aria-label={previewLabel} className={`${mobilePane === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col gap-3 lg:flex`}>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <HoverIconButton icon={AlarmClockPlusIcon} size="sm" onClick={() => create()}>{addLabel}</HoverIconButton>
            <HoverIconButton icon={ArrowBackUpIcon} size="icon-sm" variant="outline" aria-label={t("undo")} title={t("undo")} disabled={!canUndo} onClick={undo} />
            <HoverIconButton icon={ArrowBackUpIcon} size="icon-sm" variant="outline" aria-label={t("redo")} title={t("redo")} disabled={!canRedo} onClick={redo} className="[&_svg]:-scale-x-100" />
            {planner.mode === "day" && <div className="flex items-center gap-1">
              <HoverIconButton icon={ArrowNarrowLeftIcon} size="icon-sm" variant="outline" aria-label={t("prevDay")} onClick={() => update({ date: addDays(doc.date, -1) })} />
              <Label className="flex items-center gap-2 text-sm">{t("date")}<Input className="w-auto" type="date" value={doc.date} onChange={(e) => { if (isValidDate(e.target.value)) update({ date: e.target.value }); }} /></Label>
              <HoverIconButton icon={ArrowNarrowRightIcon} size="icon-sm" variant="outline" aria-label={t("nextDay")} onClick={() => update({ date: addDays(doc.date, 1) })} />
              <Button size="sm" variant="ghost" disabled={doc.date === today} onClick={() => update({ date: today })}>{t("today")}</Button></div>}
            <Button size="sm" variant="outline" onClick={() => setShowGrid((current) => !current)}>{showGrid ? viewName : t("views.common.weekGrid")}</Button>
            <div className="ml-auto flex flex-wrap gap-2"><HoverIconButton icon={LinkIcon} variant="outline" size="sm" onClick={() => setDataOpen(true)}>{t("data.open")}</HoverIconButton><HoverIconButton icon={DownloadIcon} variant="outline" size="sm" disabled={busy || !shownEvents.length} onClick={() => { if (exportRef.current) void runExport(() => exportNodeToPng(exportRef.current!, filenameFromTitle(title, "png"))); }}>PNG</HoverIconButton><HoverIconButton icon={ClockIcon} variant="outline" size="sm" disabled={busy || !doc.events.some(isCalendarEvent)} onClick={() => setCalendarOpen(true)}>.ics</HoverIconButton><HoverIconButton icon={FileDescriptionIcon} variant="outline" size="sm" disabled={busy || !shownEvents.length} onClick={() => { if (exportRef.current) void runExport(() => printSchedule(exportRef.current!, title)); }}>{t("print")}</HoverIconButton></div>
          </div>
          {allCategories.length > 1 && <div className="flex shrink-0 flex-wrap items-center gap-1.5" role="group" aria-label={t("filter.label")}>
            <span className="text-xs text-muted-foreground">{t("filter.label")}</span>
            {allCategories.map((category) => { const off = hidden.includes(category); const color = doc.events.find((event) => event.category?.trim() === category)?.color;
              return <button key={category} type="button" aria-pressed={!off} onClick={() => setHidden(off ? hidden.filter((item) => item !== category) : [...hidden, category])} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-opacity ${off ? "opacity-50" : ""}`}><span className="size-2.5 rounded-full border" style={{ background: color }} />{category}</button>; })}
            {hidden.length > 0 && <Button size="xs" variant="ghost" onClick={() => setHidden([])}>{t("filter.showAll")}</Button>}
          </div>}
          <p className="shrink-0 text-xs text-muted-foreground">{busy ? t("exporting") : canvasHint}</p>
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl pb-4">
            {showGrid ? (
              <TimetableEngine {...gridProps} />
            ) : planner.id === "custom" ? (
              <div className="space-y-5 rounded-2xl border bg-muted/20 p-4 md:p-6">
                <div className="grid gap-4 rounded-xl border bg-background p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div><p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t("views.custom.kicker")}</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{t("views.custom.description")}</p></div>
                  <div className="flex flex-wrap gap-2">{[TimetableTheme.Clean, TimetableTheme.Soft, TimetableTheme.Minimal, TimetableTheme.Classic].map((theme) => <Button key={theme} variant={settings.theme === theme ? "default" : "outline"} size="sm" onClick={() => setSettings(appearanceFromTheme(theme))}>{t(`theme${theme[0].toUpperCase()}${theme.slice(1)}`, { ns: "pages.App" })}</Button>)}</div>
                </div>
                <TimetableEngine {...gridProps} />
              </div>
            ) : (
              <div ref={exportRef}><PlannerView planner={planner} doc={doc} events={visible} segments={segments} title={title} today={today} days={days} dateLabel={dateLabel} dayLabel={dayLabel}
                onEdit={(event) => setEditing(base(event))} onCreate={create} onPatch={(id, patch) => guarded(() => { const event = doc.events.find((item) => item.id === id); if (event) saveEvent({ ...event, ...patch }); })}
                update={update} toggleCheckin={toggleCheckin} copyDay={copyDay} openSmartFill={() => setFillOpen(true)} /></div>
            )}
          </div>
        </section>
      </div>
    </div>
    {editing && <EventEditor key={editing.id} initial={editing} dated={planner.mode !== "week"} plannerId={planner.id} columns={customColumns} existing={doc.events} hour24={hour24} onClose={() => setEditing(null)}
      onSave={(event) => { saveEvent(event); if (planner.mode === "day" && event.date) update({ date: event.date }); setEditing(null); }}
      onDelete={doc.events.some((event) => event.id === editing.id) ? () => { deleteEvent(editing.id); setEditing(null); } : undefined}
      onDuplicate={doc.events.some((event) => event.id === editing.id) ? () => { guarded(() => { const id = duplicateEvent(editing.id); const copy = id ? PLANNER_STORES[planner.id].getState().document.events.find((item) => item.id === id) : null; if (copy) setEditing(copy); toast.success(t("duplicated")); }); } : undefined} />}
    {fillOpen && <SmartFillDialog doc={doc} days={days} dayLabel={(day) => dayLabel(day)} onClose={() => setFillOpen(false)} onApply={(events) => guarded(() => { appendEvents(events); toast.success(t("smartFill.added", { count: events.length })); setFillOpen(false); })} />}
    {dataOpen && <DataDialog planner={planner.id} doc={doc} title={title} onClose={() => setDataOpen(false)} onReplace={(document) => { replaceDocument(document); toast.success(t("data.replaced")); }}
      onAppend={(events, merged) => guarded(() => { if (merged) update({ events: merged.events, columns: merged.columns, goals: merged.goals, todos: merged.todos, checkins: merged.checkins }); else appendEvents(events); toast.success(t("data.merged")); })}
      onClear={() => { clear(); toast.success(t("data.cleared")); }} />}
    <Dialog open={Boolean(shared)} onOpenChange={(open) => { if (!open) closeShared(); }}><DialogContent><DialogHeader><DialogTitle>{t("data.sharedTitle")}</DialogTitle><DialogDescription>{t("data.sharedHint", { count: shared?.document.events.length ?? 0 })}</DialogDescription></DialogHeader>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={closeShared}>{t("data.dismiss")}</Button>
        <Button variant="outline" onClick={() => { if (shared) { { const merged = mergeDocuments(doc, shared.document); update({ events: merged.events, columns: merged.columns, goals: merged.goals, todos: merged.todos, checkins: merged.checkins }); } toast.success(t("data.merged")); } closeShared(); }}>{t("data.merge")}</Button>
        <Button onClick={() => { if (shared) { replaceDocument(shared.document); toast.success(t("data.replaced")); } closeShared(); }}>{t("data.replace")}</Button></div></DialogContent></Dialog>
    <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}><DialogContent><DialogHeader><DialogTitle>{t("calendarTitle")}</DialogTitle><DialogDescription>{t("calendarHint")}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); try { const calendar = buildScheduleCalendar(doc.events, title, range, { describe }); downloadTextFile(filenameFromTitle(title, "ics"), calendar, "text/calendar;charset=utf-8"); setCalendarOpen(false); } catch (error) { toast.error(t(error instanceof Error ? error.message : "errorExport")); } }}>
      <p className="text-sm">{t("calendarScope")}</p>
      {doc.events.some((event) => !event.date && event.days?.length) && <div className="grid grid-cols-2 gap-3">{(["start", "end"] as const).map((key) => <Label className="block space-y-1 text-sm" key={key}>{t(`range.${key}`)}<Input type="date" required value={range[key]} onChange={(e) => setRange({ ...range, [key]: e.target.value })} /></Label>)}</div>}{doc.events.some((event) => !isCalendarEvent(event)) && <p className="text-xs text-muted-foreground">{t("calendarSkipped")}</p>}<HoverIconButton icon={DownloadIcon} type="submit">{t("downloadCalendar")}</HoverIconButton>
    </form></DialogContent></Dialog>
  </div>;

}
