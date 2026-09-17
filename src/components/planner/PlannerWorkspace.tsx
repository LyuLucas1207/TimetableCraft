import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AlarmClockPlusIcon, ArrowNarrowLeftIcon, ClockIcon, CopyIcon, DownloadIcon, FileDescriptionIcon, LayoutDashboardIcon, SlidersHorizontalIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { PLANNER_ICONS } from "./icons";
import { toast } from "sonner";
import { PLANNERS, plannerPath, templateEvents, type PlannerDefinition } from "@/config/planners";
import { usePlannerStore } from "@/stores/planners";
import { ALL_WEEK_DAYS, type ScheduleColumn, type ScheduleEvent } from "@/types/schedule";
import { GridInterval, TimetableTheme, type TimetableSettings } from "@/types/course";
import { appearanceFromTheme } from "@/utils/appearance";
import { addDays, coursesToEvents, isValidDate, validateScheduleEvent } from "@/utils/schedule";
import { createId } from "@/utils/ids";
import { addDuration, formatTimeRange } from "@/utils/time";
import { exportNodeToPng } from "@/utils/exportImage";
import { buildScheduleCalendar } from "@/utils/exportScheduleCalendar";
import { downloadTextFile, filenameFromTitle } from "@/utils/download";
import { printSchedule } from "@/utils/printSchedule";
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

export default function PlannerWorkspace({ planner }: { planner: PlannerDefinition }) {
  const { t, i18n } = useTranslation("pages.Planner");
  const navigate = useNavigate();
  const PlannerIcon = PLANNER_ICONS[planner.id];
  const { document: doc, update, saveEvent, appendEvents, deleteEvent } = usePlannerStore(planner.id);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [pane, setPane] = useState<"events" | "settings">(planner.id === "custom" ? "settings" : "events");
  const [showGrid, setShowGrid] = useState(planner.id === "weekly");
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("preview");
  const [busy, setBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [range, setRange] = useState({ start: doc.date, end: addDays(doc.date, 90) });
  const exportRef = useRef<HTMLDivElement>(null);
  const title = doc.settings.title || t(`tools.${planner.id}.name`);
  const addLabel = t(`views.${planner.id}.action`, { defaultValue: t("addEvent") });
  const canvasHint = showGrid ? t("canvasHint") : t(`views.${planner.id}.hint`, { defaultValue: t("canvasHint") });
  const sidebarTitle = t(`views.${planner.id}.sidebarTitle`, { defaultValue: t("events") });
  const sidebarEmpty = t(`views.${planner.id}.sidebarEmpty`, { defaultValue: t("empty") });
  const previewLabel = t(`views.${planner.id}.mobilePreview`, { defaultValue: t("preview") });
  const settings = { ...doc.settings, title };
  const setSettings = (patch: Partial<TimetableSettings>) => update({ settings: { ...doc.settings, ...patch } });
  const dateLabel = (date: string) => new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", weekday: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  const dates = planner.mode === "day" ? [doc.date] : [...new Set(doc.events.flatMap((event) => event.date ? [event.date] : []))].sort();
  const columns: ScheduleColumn[] = planner.mode === "week" ? ALL_WEEK_DAYS.map((day) => ({ key: day, day, label: t(`days.${day}`, { ns: "language" }) })) : (dates.length ? dates : [doc.date]).map((date) => ({ key: date, date, label: dateLabel(date) }));
  const shownEvents = planner.mode === "day" ? doc.events.filter((event) => event.date === doc.date) : doc.events;
  const create = (column?: ScheduleColumn, time = "09:00") => setEditing({ id: createId(), title: "", color: "#DBEAFE", startTime: time, endTime: addDuration(time, 60) ?? "23:59", category: "", ...(planner.mode === "week" ? { days: [column?.day ?? ALL_WEEK_DAYS[0]] } : { date: column?.date ?? doc.date }) });
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
            </> : <>
              <div className="rounded-xl border bg-muted/30 p-3"><p className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true"><LayoutDashboardIcon size={15} /></span>{t("templateTitle")}</p><p className="my-2 text-xs leading-5 text-muted-foreground">{t("templateHint")}</p><HoverIconButton icon={LayoutDashboardIcon} className="w-full" variant="outline" onClick={() => { appendEvents(templateEvents(planner.id, doc.date, t)); toast.success(t("templateAdded")); }}>{t("addTemplate")}</HoverIconButton></div>
              {planner.id === "study" && <div className="space-y-2"><HoverIconButton icon={CopyIcon} variant="outline" className="w-full" onClick={() => { void copyClasses().catch(() => toast.error(t("errorSave"))); }}>{t("copyClasses")}</HoverIconButton><p className="text-xs leading-5 text-muted-foreground">{t("copyHint")} <Link className="underline" to="/tools/schedule-maker">{t("className")}</Link></p></div>}
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{sidebarTitle}</h2><span className="text-xs text-muted-foreground">{doc.events.length}</span></div>
              {!doc.events.length && <p className="py-4 text-sm leading-6 text-muted-foreground">{sidebarEmpty}</p>}
              <ul className="space-y-2">{[...doc.events].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.startTime.localeCompare(b.startTime)).map((event) => <li key={event.id}><Button variant="outline" className="block h-auto w-full whitespace-normal rounded-xl p-3 text-left" onClick={() => setEditing(event)}><div className="flex items-center gap-2"><span className="size-3 shrink-0 rounded-full border" style={{ background: event.color }} /><span className="truncate text-sm font-medium">{event.title}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.date ? dateLabel(event.date) : event.days?.map((day) => t(`daysShort.${day}`, { ns: "language", defaultValue: t(`days.${day}`, { ns: "language" }) })).join(" · ")}</p><p className="mt-1 text-xs text-muted-foreground">{formatTimeRange(event.startTime, event.endTime)}</p></Button></li>)}</ul>
            </>}
          </div>
        </aside>
        <section aria-label={previewLabel} className={`${mobilePane === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col gap-3 lg:flex`}>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <HoverIconButton icon={AlarmClockPlusIcon} size="sm" onClick={() => create()}>{addLabel}</HoverIconButton>
            {planner.mode === "day" && <Label className="flex items-center gap-2 text-sm">{t("date")}<Input className="w-auto" type="date" value={doc.date} onChange={(e) => { if (isValidDate(e.target.value)) update({ date: e.target.value }); }} /></Label>}
            {planner.id !== "weekly" && <Button size="sm" variant="outline" onClick={() => setShowGrid((current) => !current)}>{showGrid ? t("views.common.specialView") : t("views.common.weekGrid")}</Button>}
            <div className="ml-auto flex flex-wrap gap-2"><HoverIconButton icon={DownloadIcon} variant="outline" size="sm" disabled={busy || !shownEvents.length} onClick={() => { if (exportRef.current) void runExport(() => exportNodeToPng(exportRef.current!, filenameFromTitle(title, "png"))); }}>PNG</HoverIconButton><HoverIconButton icon={ClockIcon} variant="outline" size="sm" disabled={busy || !doc.events.length} onClick={() => setCalendarOpen(true)}>.ics</HoverIconButton><HoverIconButton icon={FileDescriptionIcon} variant="outline" size="sm" disabled={busy || !shownEvents.length} onClick={() => { if (exportRef.current) void runExport(() => printSchedule(exportRef.current!, title)); }}>{t("print")}</HoverIconButton></div>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">{busy ? t("exporting") : canvasHint}</p>
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl pb-4">
            {showGrid ? (
              <TimetableEngine events={shownEvents} columns={columns} settings={settings} exportRef={exportRef} onBlockClick={setEditing} onSlotClick={create} onTitleCommit={(title) => setSettings({ title })} emptyHint={t("empty")} slotLabel={(column, time) => `${t("addEvent")}: ${column.label} ${time}`} />
            ) : planner.id === "custom" ? (
              <div className="space-y-5 rounded-2xl border bg-muted/20 p-4 md:p-6">
                <div className="grid gap-4 rounded-xl border bg-background p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div><p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t("views.custom.kicker")}</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{t("views.custom.description")}</p></div>
                  <div className="flex flex-wrap gap-2">{[TimetableTheme.Clean, TimetableTheme.Soft, TimetableTheme.Minimal, TimetableTheme.Classic].map((theme) => <Button key={theme} variant={settings.theme === theme ? "default" : "outline"} size="sm" onClick={() => setSettings(appearanceFromTheme(theme))}>{t(`theme${theme[0].toUpperCase()}${theme.slice(1)}`, { ns: "pages.App" })}</Button>)}</div>
                </div>
                <TimetableEngine events={shownEvents} columns={columns} settings={settings} exportRef={exportRef} onBlockClick={setEditing} onSlotClick={create} onTitleCommit={(value) => setSettings({ title: value })} emptyHint={t("empty")} slotLabel={(column, time) => `${t("addEvent")}: ${column.label} ${time}`} />
              </div>
            ) : (
              <div ref={exportRef}><PlannerView planner={planner} events={shownEvents} date={doc.date} title={title} dateLabel={dateLabel} onEdit={setEditing} onCreate={(day, time) => create(day ? { key: day, day, label: day } : undefined, time)} /></div>
            )}
          </div>
        </section>
      </div>
    </div>
    {editing && <EventEditor key={editing.id} initial={editing} dated={planner.mode !== "week"} plannerId={planner.id} onClose={() => setEditing(null)} onSave={(event) => { saveEvent(event); if (planner.mode === "day" && event.date) update({ date: event.date }); setEditing(null); }} onDelete={doc.events.some((event) => event.id === editing.id) ? () => { deleteEvent(editing.id); setEditing(null); } : undefined} />}
    <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}><DialogContent><DialogHeader><DialogTitle>{t("calendarTitle")}</DialogTitle><DialogDescription>{t("calendarHint")}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); try { const calendar = buildScheduleCalendar(doc.events, title, range); downloadTextFile(filenameFromTitle(title, "ics"), calendar, "text/calendar;charset=utf-8"); setCalendarOpen(false); } catch (error) { toast.error(t(error instanceof Error ? error.message : "errorExport")); } }}>
      <p className="text-sm">{t("calendarScope")}</p>
      {doc.events.some((event) => !event.date) && <div className="grid grid-cols-2 gap-3">{(["start", "end"] as const).map((key) => <Label className="block space-y-1 text-sm" key={key}>{t(`range.${key}`)}<Input type="date" required value={range[key]} onChange={(e) => setRange({ ...range, [key]: e.target.value })} /></Label>)}</div>}<HoverIconButton icon={DownloadIcon} type="submit">{t("downloadCalendar")}</HoverIconButton>
    </form></DialogContent></Dialog>
  </div>;
}
