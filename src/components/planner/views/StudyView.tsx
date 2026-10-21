import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookIcon, SparklesIcon, XIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Input } from "@/components/ui/input";
import { Bar, Chip, EmptyView, EventCard, StatCard, ViewHeader, fmtHours, type ViewProps } from "./parts";
import { stringMeta, weeklyMinutes } from "@/utils/planStats";
import { ALL_WEEK_DAYS, type ScheduleEvent } from "@/types/schedule";

const PRIORITY_TONE = { high: "bad", medium: "warn", low: "muted" } as const;

export default function StudyView({ doc, events, title, dayLabel, onEdit, onCreate, onPatch, update, openSmartFill }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const [newSubject, setNewSubject] = useState("");
  const hour24 = doc.prefs.hour24;
  const classes = events.filter((event) => Boolean(event.sourceCourseId));
  const blocks = events.filter((event) => !event.sourceCourseId);
  const goals = doc.goals ?? {};
  const subjectOf = (event: ScheduleEvent) => stringMeta(event, "subject") || event.category || "";
  const subjects = [...new Set([...Object.keys(goals), ...blocks.map(subjectOf).filter(Boolean)])];
  const minutes = (subject: string, onlyDone = false) => blocks.filter((event) => subjectOf(event) === subject && (!onlyDone || event.done)).reduce((sum, event) => sum + weeklyMinutes(event), 0);
  const plannedTotal = blocks.reduce((sum, event) => sum + weeklyMinutes(event), 0);
  const doneTotal = blocks.filter((event) => event.done).reduce((sum, event) => sum + weeklyMinutes(event), 0);
  const unassigned = blocks.filter((event) => !subjectOf(event));
  const groups = [...subjects, ...(unassigned.length ? [""] : [])];
  const setGoal = (subject: string, hours: number | null) => {
    const next = { ...goals };
    if (hours === null) delete next[subject]; else next[subject] = Math.max(0, Math.min(168, hours));
    update({ goals: Object.keys(next).length ? next : undefined });
  };
  const addSubject = () => { const name = newSubject.trim(); if (!name || name in goals) return; setGoal(name, 4); setNewSubject(""); };
  const firstDay = (event: ScheduleEvent) => Math.min(...(event.days?.map((day) => ALL_WEEK_DAYS.indexOf(day)) ?? [7]));
  const sorted = (list: ScheduleEvent[]) => [...list].sort((a, b) => firstDay(a) - firstDay(b) || a.startTime.localeCompare(b.startTime));
  const daysText = (event: ScheduleEvent) => event.days?.map((day) => dayLabel(day, true)).join(" · ");
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f7f8fd] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={BookIcon} kicker={t("views.study.kicker")} title={title} detail={t("views.study.description")}
      actions={<HoverIconButton icon={SparklesIcon} onClick={openSmartFill}>{t("smartFill.open")}</HoverIconButton>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t("views.study.hours")} value={fmtHours(plannedTotal / 60)} />
      <StatCard label={t("views.study.done")} value={fmtHours(doneTotal / 60)} hint={plannedTotal ? `${Math.round((doneTotal / plannedTotal) * 100)}%` : undefined} />
      <StatCard label={t("views.study.sessions")} value={blocks.length} />
      <StatCard label={t("views.study.classes")} value={classes.length} />
    </div>
    <section className="space-y-3 rounded-xl border bg-background p-4">
      <div><h3 className="text-sm font-semibold">{t("views.study.goalsTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("views.study.goalsHint")}</p></div>
      {subjects.map((subject) => {
        const planned = minutes(subject) / 60;
        const goal = goals[subject];
        const met = goal !== undefined && planned >= goal;
        return <div key={subject} className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate font-medium">{subject}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{fmtHours(planned)} {t("views.study.of")}</span>
            <Input aria-label={t("views.study.goalFor", { subject })} className="h-7 w-20" type="number" min={0} max={168} step={0.5} placeholder="—" value={goal ?? ""} onChange={(e) => setGoal(subject, e.target.value === "" ? null : Number(e.target.value))} />
            {goal !== undefined && <Chip tone={met ? "good" : "warn"}>{met ? t("views.study.goalMet") : t("views.study.goalLeft", { hours: fmtHours(goal - planned) })}</Chip>}
            {subject in goals && <Button size="icon-xs" variant="ghost" aria-label={t("delete")} onClick={() => setGoal(subject, null)}><XIcon size={12} /></Button>}
          </div>
          {goal ? <Bar value={planned} max={goal} color={met ? "#10b981" : "#6366f1"} label={subject} /> : null}
        </div>;
      })}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addSubject(); }}>
        <Input aria-label={t("views.study.addSubject")} placeholder={t("views.study.addSubject")} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} maxLength={60} />
        <Button type="submit" variant="outline" disabled={!newSubject.trim()}>{t("views.study.addSubjectAction")}</Button>
      </form>
    </section>
    {!events.length ? <EmptyView description={t("views.study.empty")} onCreate={() => onCreate()} label={t("views.study.action")} /> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-4"><h3 className="text-sm font-semibold">{t("views.study.sessions")}</h3>
        {groups.map((subject) => <section key={subject || "other"} className="rounded-xl border bg-background p-4"><h4 className="mb-3 text-sm font-semibold">{subject || t("views.study.unassigned")}</h4>
          <div className="grid gap-2 sm:grid-cols-2">{sorted(blocks.filter((event) => subjectOf(event) === subject)).map((event) => <EventCard key={event.id} event={event} hour24={hour24} compact onClick={() => onEdit(event)} onToggleDone={(done) => onPatch(event.id, { done: done || undefined })}
            lead={event.priority ? <span className="mr-1 inline-block align-middle"><Chip tone={PRIORITY_TONE[event.priority]}>{t(`priorityOption.${event.priority}`)}</Chip></span> : null}
            chips={<Chip>{daysText(event) ?? event.date}</Chip>} />)}{!blocks.some((event) => subjectOf(event) === subject) && <p className="text-xs text-muted-foreground">{t("views.study.noSessions")}</p>}</div></section>)}
        {!blocks.length && <EmptyView description={t("views.study.emptySessions")} onCreate={() => onCreate()} label={t("views.study.action")} />}</div>
      <aside className="rounded-xl border bg-background p-4"><h3 className="mb-3 text-sm font-semibold">{t("views.study.classes")}</h3><div className="space-y-2">{classes.map((event) => <EventCard key={event.id} event={event} hour24={hour24} compact onClick={() => onEdit(event)} />)}{!classes.length && <p className="text-sm text-muted-foreground">{t("views.study.emptyClasses")}</p>}</div></aside>
    </div>}
  </div>;
}
