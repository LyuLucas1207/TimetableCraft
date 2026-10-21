import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowNarrowLeftIcon, ArrowNarrowRightIcon, RefreshIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Chip, EmptyView, StatCard, ViewHeader, fmtTime, type ViewProps } from "./parts";
import { streak, weekDates } from "@/utils/planStats";
import { addDays, eventMatchesColumn, weekdayOf } from "@/utils/schedule";
import type { ScheduleEvent } from "@/types/schedule";

const PARTS = [{ key: "morning", until: 12 * 60 }, { key: "afternoon", until: 17 * 60 }, { key: "evening", until: 24 * 60 }] as const;

export default function RoutineView({ doc, events, title, today, days, dayLabel, onEdit, onCreate, toggleCheckin }: ViewProps) {
  const { t, i18n } = useTranslation("pages.Planner");
  const hour24 = doc.prefs.hour24;
  const [offset, setOffset] = useState(0);
  const checkins = doc.checkins ?? {};
  const week = weekDates(addDays(today, offset * 7), doc.prefs.weekStart);
  const dateOf = (day: (typeof days)[number]) => week.find((date) => weekdayOf(date) === day) ?? week[0];
  const shown = days.map((day) => ({ day, date: dateOf(day) }));
  const planned = (event: ScheduleEvent, date: string) => eventMatchesColumn(event, { key: date, date, label: date });
  const due = shown.flatMap(({ date }) => events.filter((event) => planned(event, date) && date <= today).map((event) => ({ event, date })));
  const doneCount = due.filter(({ event, date }) => checkins[event.id]?.includes(date)).length;
  const rate = due.length ? Math.round((doneCount / due.length) * 100) : null;
  const todayItems = events.filter((event) => planned(event, today)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const best = Math.max(0, ...events.map((event) => streak(checkins[event.id], today)));
  const rangeLabel = (() => { const fmt = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", timeZone: "UTC" }); return `${fmt.format(new Date(`${week[0]}T12:00:00Z`))} – ${fmt.format(new Date(`${week[6]}T12:00:00Z`))}`; })();
  const grouped = PARTS.map((part, index) => ({ ...part, items: events.filter((event) => { const start = timeOf(event); return start < part.until && start >= (PARTS[index - 1]?.until ?? 0); }).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter((part) => part.items.length);
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f7faf6] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={RefreshIcon} kicker={t("views.routine.kicker")} title={title} detail={t("views.routine.description")} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t("views.routine.routines")} value={events.length} />
      <StatCard label={t("views.routine.repeat")} value={events.reduce((count, event) => count + (event.days?.length ?? 0), 0)} />
      <StatCard label={t("views.routine.rate")} value={rate === null ? "—" : `${rate}%`} hint={t("views.routine.rateHint")} tone={rate !== null && rate >= 80 ? "good" : undefined} />
      <StatCard label={t("views.routine.streak")} value={t("views.routine.days", { count: best })} />
    </div>
    {!events.length ? <EmptyView description={t("views.routine.empty")} onCreate={() => onCreate()} label={t("views.routine.action")} /> : <>
      <section className="rounded-xl border bg-background p-4"><h3 className="text-sm font-semibold">{t("views.routine.today")}</h3>
        {todayItems.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{todayItems.map((event) => { const done = checkins[event.id]?.includes(today); return <li key={event.id}>
          <Button variant={done ? "default" : "outline"} className="h-auto w-full justify-start gap-2 whitespace-normal p-3 text-left" aria-pressed={Boolean(done)} onClick={() => toggleCheckin(event.id, today)}>
            <span className="size-3 shrink-0 rounded-full border" style={{ background: event.color }} /><span className="min-w-0 flex-1"><span className={`block truncate ${done ? "line-through" : ""}`}>{event.title}</span><span className="block text-xs opacity-80">{fmtTime(event.startTime, hour24)}</span></span>
            {streak(checkins[event.id], today) > 1 && <Chip tone="good">{t("views.routine.streakChip", { count: streak(checkins[event.id], today) })}</Chip>}
          </Button></li>; })}</ul> : <p className="mt-2 text-sm text-muted-foreground">{t("views.routine.noneToday")}</p>}
      </section>
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{t("views.routine.matrix")}</h3>
        <div className="flex items-center gap-2"><HoverIconButton icon={ArrowNarrowLeftIcon} size="icon-sm" variant="outline" aria-label={t("views.routine.prevWeek")} onClick={() => setOffset(offset - 1)} /><span className="text-xs tabular-nums text-muted-foreground">{rangeLabel}</span><HoverIconButton icon={ArrowNarrowRightIcon} size="icon-sm" variant="outline" aria-label={t("views.routine.nextWeek")} onClick={() => setOffset(offset + 1)} />{offset !== 0 && <Button size="sm" variant="ghost" onClick={() => setOffset(0)}>{t("views.routine.thisWeek")}</Button>}</div></div>
      <div className="overflow-x-auto rounded-xl border bg-background"><table className="w-full min-w-[660px] border-collapse text-left text-sm">
        <thead><tr className="border-b bg-muted/30"><th className="p-3 font-semibold">{t("views.routine.routine")}</th>{shown.map(({ day, date }) => <th className={`p-3 text-center font-medium ${date === today ? "text-primary" : ""}`} key={day}>{dayLabel(day, true)}<span className="block text-[11px] font-normal text-muted-foreground">{Number(date.slice(8))}</span></th>)}</tr></thead>
        <tbody>{grouped.map((part) => [
          <tr key={part.key} className="bg-muted/20"><td colSpan={shown.length + 1} className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`views.routine.${part.key}`)}</td></tr>,
          ...part.items.map((event) => <tr className="border-b last:border-b-0" key={event.id}>
            <th className="p-3"><Button variant="ghost" className="h-auto justify-start p-1 text-left" onClick={() => onEdit(event)}><span className="size-2 shrink-0 rounded-full" style={{ background: event.color }} />{event.title}<span className="text-xs text-muted-foreground">{fmtTime(event.startTime, hour24)}</span></Button></th>
            {shown.map(({ day, date }) => { const on = planned(event, date); const done = checkins[event.id]?.includes(date); const future = date > today;
              return <td key={day} className="p-3 text-center">{on && <Button variant={done ? "default" : "outline"} size="icon-sm" disabled={future} aria-pressed={Boolean(done)} aria-label={`${event.title} · ${dayLabel(day)} · ${done ? t("views.routine.checked") : t("views.routine.unchecked")}`} onClick={() => toggleCheckin(event.id, date)}>{done ? <span className="text-xs">✓</span> : <span className="size-2 rounded-full" style={{ background: event.color }} />}</Button>}</td>; })}
          </tr>),
        ])}</tbody></table></div>
    </>}
  </div>;
}

const timeOf = (event: ScheduleEvent) => Number(event.startTime.slice(0, 2)) * 60 + Number(event.startTime.slice(3, 5));
