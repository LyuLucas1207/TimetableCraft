import { useTranslation } from "react-i18next";
import { BookIcon, ClockIcon, FileDescriptionIcon, LayoutDashboardIcon, RefreshIcon, UsersIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import type { PlannerDefinition } from "@/config/planners";
import { ALL_WEEK_DAYS, type ScheduleEvent } from "@/types/schedule";
import { WeekDay } from "@/types/course";
import { eventMatchesColumn } from "@/utils/schedule";
import { formatDisplayTime, formatTimeRange, timeToMinutes, minutesToTime } from "@/utils/time";

export type ViewProps = {
  planner: PlannerDefinition;
  events: ScheduleEvent[];
  date: string;
  title: string;
  dateLabel: (date: string) => string;
  onEdit: (event: ScheduleEvent) => void;
  onCreate: (day?: WeekDay, time?: string) => void;
};

function EventCard({ event, onClick, compact = false, fill = false }: { event: ScheduleEvent; onClick: () => void; compact?: boolean; fill?: boolean }) {
  return (
    <Button variant="outline" onClick={onClick} className={`${fill ? "h-full overflow-hidden" : "h-auto"} w-full justify-start whitespace-normal rounded-xl border-l-4 bg-background text-left shadow-sm hover:bg-muted/40 ${compact ? "p-2.5" : "p-4"}`} style={{ borderLeftColor: event.color }}>
      <span className="block min-w-0">
        <span className="block truncate font-semibold">{event.title}</span>
        {event.subtitle && <span className="mt-1 block truncate text-xs text-muted-foreground">{event.subtitle}</span>}
        <span className="mt-1 block text-xs text-muted-foreground">{formatTimeRange(event.startTime, event.endTime)}</span>
        {event.location && <span className="mt-1 block truncate text-xs text-muted-foreground">{event.location}</span>}
      </span>
    </Button>
  );
}

function EmptyView({ description, onCreate, label }: { description: string; onCreate: () => void; label: string }) {
  return <div className="rounded-2xl border border-dashed bg-background p-8 text-center"><p className="text-sm text-muted-foreground">{description}</p><Button className="mt-4" onClick={onCreate}>{label}</Button></div>;
}

function ViewHeader({ icon: Icon, kicker, title, detail }: { icon: typeof BookIcon; kicker: string; title: string; detail: string }) {
  return <div className="flex items-start gap-4"><span aria-hidden="true" className="rounded-xl border bg-background p-3"><Icon size={24} /></span><div><p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{kicker}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></div>;
}

function hours(events: ScheduleEvent[]): number {
  return events.reduce((total, event) => total + (timeToMinutes(event.endTime) - timeToMinutes(event.startTime)) / 60 * (event.date ? 1 : event.days?.length ?? 0), 0);
}

function StudyView({ events, title, onEdit, onCreate }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const classes = events.filter((event) => Boolean(event.sourceCourseId));
  const blocks = events.filter((event) => !event.sourceCourseId);
  const labels = [...new Set(blocks.map((event) => event.category || t("views.study.unassigned")))];
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f7f8fd] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={BookIcon} kicker={t("views.study.kicker")} title={title} detail={t("views.study.description")} />
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.study.hours")}</p><p className="mt-1 text-2xl font-semibold">{hours(blocks).toFixed(1)}h</p></div>
      <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.study.sessions")}</p><p className="mt-1 text-2xl font-semibold">{blocks.length}</p></div>
      <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.study.classes")}</p><p className="mt-1 text-2xl font-semibold">{classes.length}</p></div>
    </div>
    {!events.length ? <EmptyView description={t("views.study.empty")} onCreate={() => onCreate()} label={t("views.study.action")} /> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-4"><h3 className="text-sm font-semibold">{t("views.study.sessions")}</h3>{labels.map((label) => <section key={label} className="rounded-xl border bg-background p-4"><h4 className="mb-3 text-sm font-semibold">{label}</h4><div className="grid gap-2 sm:grid-cols-2">{blocks.filter((event) => (event.category || t("views.study.unassigned")) === label).map((event) => <EventCard key={event.id} event={event} onClick={() => onEdit(event)} compact />)}</div></section>)}{!blocks.length && <EmptyView description={t("views.study.emptySessions")} onCreate={() => onCreate()} label={t("views.study.action")} />}</div>
      <aside className="rounded-xl border bg-background p-4"><h3 className="mb-3 text-sm font-semibold">{t("views.study.classes")}</h3><div className="space-y-2">{classes.map((event) => <EventCard key={event.id} event={event} onClick={() => onEdit(event)} compact />)}{!classes.length && <p className="text-sm text-muted-foreground">{t("views.study.emptyClasses")}</p>}</div></aside>
    </div>}
  </div>;
}

function ExamView({ events, title, dateLabel, onEdit, onCreate }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const dates = [...new Set(events.map((event) => event.date).filter((date): date is string => Boolean(date)))].sort();
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#faf9f7] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={FileDescriptionIcon} kicker={t("views.exam.kicker")} title={title} detail={t("views.exam.description")} />
    <div className="flex items-end justify-between rounded-xl border bg-background p-4"><div><p className="text-xs text-muted-foreground">{t("views.exam.total")}</p><p className="text-3xl font-semibold">{events.length}</p></div>{dates[0] && <div className="text-right"><p className="text-xs text-muted-foreground">{t("views.exam.next")}</p><p className="font-semibold">{dateLabel(dates[0])}</p></div>}</div>
    {!dates.length ? <EmptyView description={t("views.exam.empty")} onCreate={() => onCreate()} label={t("views.exam.action")} /> : <div className="space-y-5">{dates.map((date) => <section key={date} className="grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]"><div className="border-l-2 border-foreground/20 pl-4"><p className="text-lg font-semibold">{dateLabel(date)}</p><p className="text-xs text-muted-foreground">{t("views.exam.count", { count: events.filter((event) => event.date === date).length })}</p></div><div className="space-y-2">{events.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((event) => <EventCard key={event.id} event={event} onClick={() => onEdit(event)} />)}</div></section>)}</div>}
  </div>;
}

function WorkView({ events, title, onEdit, onCreate }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f6f8f8] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={UsersIcon} kicker={t("views.work.kicker")} title={title} detail={t("views.work.description")} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.work.hours")}</p><p className="mt-1 text-2xl font-semibold">{hours(events).toFixed(1)}h</p></div><div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.work.shifts")}</p><p className="mt-1 text-2xl font-semibold">{events.reduce((count, event) => count + (event.days?.length ?? 0), 0)}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{ALL_WEEK_DAYS.map((day) => {
      const shifts = events.filter((event) => event.days?.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
      return <section key={day} className="min-h-48 rounded-xl border bg-background p-3"><div className="mb-3 flex items-center justify-between border-b pb-2"><h3 className="font-semibold">{t(`days.${day}`, { ns: "language" })}</h3><span className="text-xs text-muted-foreground">{shifts.length}</span></div><div className="space-y-2">{shifts.map((event) => <EventCard key={event.id} event={event} onClick={() => onEdit(event)} compact />)}{!shifts.length && <Button variant="ghost" className="h-20 w-full border border-dashed text-xs text-muted-foreground" onClick={() => onCreate(day)}>{t("views.work.addShift")}</Button>}</div></section>;
    })}</div>
  </div>;
}

function DailyView({ events, date, title, dateLabel, onEdit, onCreate }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const filtered = events.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const first = Math.min(6, ...filtered.map((event) => Math.floor(timeToMinutes(event.startTime) / 60)));
  const last = 24;
  const rowHeight = 80;
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#fcfaf7] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={ClockIcon} kicker={dateLabel(date)} title={title} detail={t("views.daily.description")} />
    <div className="relative max-w-3xl overflow-hidden rounded-xl border bg-background px-4 py-2">{Array.from({ length: last - first }, (_, index) => first + index).map((hour) => {
      const slot = minutesToTime(hour * 60);
      const occupied = filtered.some((event) => timeToMinutes(event.startTime) < (hour + 1) * 60 && timeToMinutes(event.endTime) > hour * 60);
      return <div key={hour} className="grid grid-cols-[72px_minmax(0,1fr)] border-b last:border-b-0" style={{ height: rowHeight }}><div className="border-r py-3 text-xs text-muted-foreground">{formatDisplayTime(slot)}</div>{!occupied && <Button variant="ghost" className="m-2 h-auto justify-start text-xs text-muted-foreground/65 hover:text-foreground" onClick={() => onCreate(undefined, slot)}>{t("views.daily.addBlock")}</Button>}</div>;
    })}{filtered.map((event) => {
      const start = timeToMinutes(event.startTime);
      const end = timeToMinutes(event.endTime);
      return <div key={event.id} className="absolute right-6 left-[88px] z-10" style={{ top: 8 + (start / 60 - first) * rowHeight + 2, height: Math.max(36, (end - start) / 60 * rowHeight - 4) }}><EventCard event={event} onClick={() => onEdit(event)} compact fill /></div>;
    })}</div>
  </div>;
}

function RoutineView({ events, title, onEdit, onCreate }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f7faf6] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={RefreshIcon} kicker={t("views.routine.kicker")} title={title} detail={t("views.routine.description")} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.routine.routines")}</p><p className="text-2xl font-semibold">{events.length}</p></div><div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{t("views.routine.repeat")}</p><p className="text-2xl font-semibold">{events.reduce((count, event) => count + (event.days?.length ?? 0), 0)}</p></div></div>
    {!sorted.length ? <EmptyView description={t("views.routine.empty")} onCreate={() => onCreate()} label={t("views.routine.action")} /> : <div className="overflow-x-auto rounded-xl border bg-background"><table className="w-full min-w-[660px] border-collapse text-left text-sm"><thead><tr className="border-b bg-muted/30"><th className="p-3 font-semibold">{t("views.routine.routine")}</th>{ALL_WEEK_DAYS.map((day) => <th className="p-3 text-center font-medium" key={day}>{t(`days.${day}`, { ns: "language" }).slice(0, 3)}</th>)}</tr></thead><tbody>{sorted.map((event) => <tr className="border-b last:border-b-0" key={event.id}><th className="p-3"><Button variant="ghost" className="h-auto justify-start p-1 text-left" onClick={() => onEdit(event)}><span className="size-2 shrink-0 rounded-full" style={{ background: event.color }} />{event.title}<span className="text-xs text-muted-foreground">{formatDisplayTime(event.startTime)}</span></Button></th>{ALL_WEEK_DAYS.map((day) => <td key={day} className="p-3 text-center">{eventMatchesColumn(event, { key: day, day, label: day }) && <Button variant="outline" size="icon-sm" aria-label={`${event.title} · ${day}`} onClick={() => onEdit(event)}><span className="size-2 rounded-full" style={{ background: event.color }} /></Button>}</td>)}</tr>)}</tbody></table></div>}
  </div>;
}

export default function PlannerView(props: ViewProps) {
  switch (props.planner.id) {
    case "study": return <StudyView {...props} />;
    case "exam": return <ExamView {...props} />;
    case "work": return <WorkView {...props} />;
    case "daily": return <DailyView {...props} />;
    case "routine": return <RoutineView {...props} />;
    default: return <div className="rounded-2xl border bg-background p-8"><ViewHeader icon={LayoutDashboardIcon} kicker={props.title} title={props.title} detail="" /></div>;
  }
}
