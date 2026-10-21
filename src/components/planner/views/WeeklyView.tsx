import { useTranslation } from "react-i18next";
import { LayoutDashboardIcon } from "@/animations";
import { Bar, DayCopyControl, EmptyView, StatCard, ViewHeader, fmtHours, type ViewProps } from "./parts";
import { eventMinutes } from "@/utils/schedule";
import { minutesByCategory } from "@/utils/planStats";
import { timeToMinutes } from "@/utils/time";

/** Overview of where the week goes: hours by day and by category, and what is left free. */
export default function WeeklyView({ doc, events, title, days, dayLabel, onCreate, copyDay }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const windowMinutes = Math.max(0, timeToMinutes(doc.settings.endTime) - timeToMinutes(doc.settings.startTime));
  const perDay = days.map((day) => {
    const minutes = events.filter((event) => event.days?.includes(day)).reduce((sum, event) => sum + eventMinutes(event), 0);
    return { day, minutes };
  });
  const scheduled = perDay.reduce((sum, item) => sum + item.minutes, 0);
  const free = Math.max(0, windowMinutes * days.length - scheduled);
  const busiest = perDay.reduce((best, item) => (item.minutes > best.minutes ? item : best), perDay[0]);
  const shares = minutesByCategory(events.map((event) => ({ ...event, days: event.days?.filter((day) => days.includes(day)) })), t("uncategorized"));
  const max = Math.max(1, ...perDay.map((item) => item.minutes));
  const total = shares.reduce((sum, item) => sum + item.minutes, 0);
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f7f9fc] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={LayoutDashboardIcon} kicker={t("views.weekly.kicker")} title={title} detail={t("views.weekly.description")} />
    {!events.length ? <EmptyView description={t("empty")} onCreate={() => onCreate()} label={t("addEvent")} /> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("views.weekly.scheduled")} value={fmtHours(scheduled / 60)} />
        <StatCard label={t("views.weekly.free")} value={fmtHours(free / 60)} hint={t("views.weekly.freeHint", { start: doc.settings.startTime, end: doc.settings.endTime })} />
        <StatCard label={t("views.weekly.busiest")} value={dayLabel(busiest.day)} hint={fmtHours(busiest.minutes / 60)} />
        <StatCard label={t("views.weekly.blocks")} value={events.length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border bg-background p-4"><h3 className="text-sm font-semibold">{t("views.weekly.byDay")}</h3>
          {perDay.map(({ day, minutes }) => <div key={day} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3 text-sm"><span className="truncate text-muted-foreground">{dayLabel(day, true)}</span><Bar value={minutes} max={max} color="var(--primary, #2563eb)" label={dayLabel(day)} /><span className="text-right text-xs tabular-nums">{fmtHours(minutes / 60)}</span></div>)}
        </section>
        <section className="space-y-3 rounded-xl border bg-background p-4"><h3 className="text-sm font-semibold">{t("views.weekly.byCategory")}</h3>
          {shares.map((share) => <div key={share.category} className="space-y-1"><div className="flex items-center justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="size-3 shrink-0 rounded-full border" style={{ background: share.color }} /><span className="truncate">{share.category}</span></span><span className="text-xs tabular-nums text-muted-foreground">{fmtHours(share.minutes / 60)} · {Math.round(total ? (share.minutes / total) * 100 : 0)}%</span></div><Bar value={share.minutes} max={total} color={share.color} label={share.category} /></div>)}
        </section>
      </div>
      <DayCopyControl days={days} dayLabel={dayLabel} onCopy={(from, to) => copyDay({ day: from }, to.map((day) => ({ day })))} />
    </>}
  </div>;
}
