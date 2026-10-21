import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowNarrowLeftIcon, ArrowNarrowRightIcon, FileDescriptionIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Chip, EmptyView, EventCard, StatCard, ViewHeader, fmtTime, type ViewProps } from "./parts";
import { conflictsFor, daysUntil, examGaps, stringMeta } from "@/utils/planStats";
import { addDays, weekdayOf } from "@/utils/schedule";
import { ALL_WEEK_DAYS } from "@/types/schedule";

/** Days between exams below which we warn about back-to-back papers. */
const TIGHT_GAP_MINUTES = 120;

export default function ExamView({ doc, events, title, today, dateLabel, dayLabel, onEdit, onCreate }: ViewProps) {
  const { t, i18n } = useTranslation("pages.Planner");
  const hour24 = doc.prefs.hour24;
  const [mode, setMode] = useState<"list" | "month">("list");
  const dated = useMemo(() => events.filter((event) => event.date), [events]);
  const dates = [...new Set(dated.map((event) => event.date!))].sort();
  const upcoming = dated.filter((event) => event.date! >= today).sort((a, b) => (a.date! + a.startTime).localeCompare(b.date! + b.startTime));
  const next = upcoming[0];
  const gaps = examGaps(dated).filter((gap) => gap.minutes < TIGHT_GAP_MINUTES);
  const clashing = new Set(dated.filter((event) => conflictsFor(event, dated).length).map((event) => event.id));
  const [cursor, setCursor] = useState((next?.date ?? today).slice(0, 7));
  const countdown = (date: string) => {
    const days = daysUntil(date, today);
    return days === 0 ? t("views.exam.today") : days === 1 ? t("views.exam.tomorrow") : days > 0 ? t("views.exam.inDays", { count: days }) : t("views.exam.passed");
  };
  const metaChips = (event: (typeof events)[number]) => <>
    {stringMeta(event, "code") && <Chip>{stringMeta(event, "code")}</Chip>}
    {stringMeta(event, "seat") && <Chip>{t("views.exam.seat", { seat: stringMeta(event, "seat") })}</Chip>}
    {stringMeta(event, "allowed") && <Chip>{t("views.exam.allowed", { items: stringMeta(event, "allowed") })}</Chip>}
    {clashing.has(event.id) && <Chip tone="bad">{t("views.exam.clash")}</Chip>}
    {event.date && event.date >= today ? <Chip tone={daysUntil(event.date, today) <= 3 ? "warn" : "muted"}>{countdown(event.date)}</Chip> : <Chip>{t("views.exam.passed")}</Chip>}
  </>;
  // Month grid: six weeks starting on the user's first weekday.
  const monthStart = `${cursor}-01`;
  const lead = doc.prefs.weekStart === "mon" ? ALL_WEEK_DAYS.indexOf(weekdayOf(monthStart)) : (ALL_WEEK_DAYS.indexOf(weekdayOf(monthStart)) + 1) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index - lead));
  const shiftMonth = (delta: number) => { const [y, m] = cursor.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + delta, 1)); setCursor(d.toISOString().slice(0, 7)); };
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${monthStart}T12:00:00Z`));
  const headerDays = doc.prefs.weekStart === "mon" ? ALL_WEEK_DAYS : [ALL_WEEK_DAYS[6], ...ALL_WEEK_DAYS.slice(0, 6)];
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#faf9f7] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={FileDescriptionIcon} kicker={t("views.exam.kicker")} title={title} detail={t("views.exam.description")}
      actions={<div className="flex gap-1 rounded-lg border bg-background p-1">{(["list", "month"] as const).map((item) => <Button key={item} size="sm" variant={mode === item ? "default" : "ghost"} onClick={() => setMode(item)}>{t(`views.exam.${item}`)}</Button>)}</div>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t("views.exam.total")} value={dated.length} />
      <StatCard label={t("views.exam.next")} value={next ? dateLabel(next.date!) : "—"} hint={next ? `${next.title} · ${fmtTime(next.startTime, hour24)}` : undefined} />
      <StatCard label={t("views.exam.countdown")} value={next ? countdown(next.date!) : "—"} tone={next && daysUntil(next.date!, today) <= 3 ? "warn" : undefined} />
      <StatCard label={t("views.exam.warnings")} value={gaps.length + clashing.size} hint={gaps.length + clashing.size ? t("views.exam.warningsHint") : t("views.exam.noWarnings")} tone={gaps.length + clashing.size ? "warn" : "good"} />
    </div>
    {gaps.length > 0 && <ul className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
      {gaps.map((gap) => <li key={gap.a.id + gap.b.id}>{t("views.exam.tightGap", { a: gap.a.title, b: gap.b.title, date: dateLabel(gap.a.date!), minutes: Math.max(0, gap.minutes) })}</li>)}
    </ul>}
    {!dates.length ? <EmptyView description={t("views.exam.empty")} onCreate={() => onCreate()} label={t("views.exam.action")} /> : mode === "list" ?
      <div className="space-y-5">{dates.map((date) => <section key={date} className="grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]"><div className="border-l-2 border-foreground/20 pl-4"><p className="text-lg font-semibold">{dateLabel(date)}</p><p className="text-xs text-muted-foreground">{countdown(date)} · {t("views.exam.count", { count: dated.filter((event) => event.date === date).length })}</p></div>
        <div className="space-y-2">{dated.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((event) => <div key={event.id} className={date < today ? "opacity-60" : ""}><EventCard event={event} hour24={hour24} chips={metaChips(event)} onClick={() => onEdit(event)} /></div>)}</div></section>)}</div> :
      <div className="rounded-xl border bg-background p-3">
        <div className="mb-3 flex items-center justify-between"><HoverIconButton icon={ArrowNarrowLeftIcon} size="icon-sm" variant="outline" aria-label={t("views.exam.prevMonth")} onClick={() => shiftMonth(-1)} /><h3 className="text-sm font-semibold">{monthName}</h3><HoverIconButton icon={ArrowNarrowRightIcon} size="icon-sm" variant="outline" aria-label={t("views.exam.nextMonth")} onClick={() => shiftMonth(1)} /></div>
        <div className="overflow-x-auto"><div className="grid min-w-[640px] grid-cols-7 border-t border-l text-xs">
          {headerDays.map((day) => <div key={day} className="border-r border-b bg-muted/40 px-2 py-1 font-medium">{dayLabel(day, true)}</div>)}
          {cells.map((date) => { const inMonth = date.slice(0, 7) === cursor; const items = dated.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
            return <div key={date} className={`min-h-24 border-r border-b p-1 ${inMonth ? "" : "bg-muted/30 text-muted-foreground"} ${date === today ? "ring-2 ring-primary ring-inset" : ""}`}>
              <button type="button" className="mb-1 block w-full text-left text-[11px] tabular-nums hover:underline" aria-label={t("views.exam.addOn", { date: dateLabel(date) })} onClick={() => onCreate({ date })}>{Number(date.slice(8))}</button>
              <div className="space-y-1">{items.map((event) => <button key={event.id} type="button" onClick={() => onEdit(event)} className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium text-zinc-900" style={{ background: event.color }}>{fmtTime(event.startTime, hour24)} {event.title}</button>)}</div></div>; })}
        </div></div>
      </div>}
  </div>;
}
