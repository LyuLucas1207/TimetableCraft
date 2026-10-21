import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SparklesIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeekDay } from "@/types/course";
import type { ScheduleEvent } from "@/types/schedule";
import type { PlannerDocument } from "@/stores/planners";
import { createId } from "@/utils/ids";
import { stringMeta, weeklyMinutes } from "@/utils/planStats";
import { smartFill, type FillSession } from "@/utils/smartFill";
import { timeToMinutes } from "@/utils/time";
import { COLOR_SWATCHES } from "./EventEditor";
import { fmtRange } from "./views/parts";

interface Row { subject: string; hours: number }

export default function SmartFillDialog({ doc, days, dayLabel, onClose, onApply }: {
  doc: PlannerDocument; days: WeekDay[]; dayLabel: (day: WeekDay) => string; onClose: () => void; onApply: (events: ScheduleEvent[]) => void;
}) {
  const { t } = useTranslation("pages.Planner");
  const studyBlocks = doc.events.filter((event) => !event.sourceCourseId);
  const initial = useMemo<Row[]>(() => {
    const subjects = [...new Set([...Object.keys(doc.goals ?? {}), ...studyBlocks.map((event) => stringMeta(event, "subject")).filter(Boolean)])];
    return subjects.map((subject) => {
      const planned = studyBlocks.filter((event) => stringMeta(event, "subject") === subject).reduce((sum, event) => sum + weeklyMinutes(event), 0) / 60;
      const goal = doc.goals?.[subject];
      return { subject, hours: goal === undefined ? 2 : Math.max(0, Math.round((goal - planned) * 4) / 4) };
    });
    // Seeded once per opening: later edits in the dialog are the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [rows, setRows] = useState<Row[]>(initial);
  const [chosenDays, setChosenDays] = useState<WeekDay[]>(days.filter((day) => !["Saturday", "Sunday"].includes(day)).length ? days.filter((day) => !["Saturday", "Sunday"].includes(day)) : days);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("22:00");
  const [minSession, setMinSession] = useState(45);
  const [maxSession, setMaxSession] = useState(120);
  const [gap, setGap] = useState(10);
  const [result, setResult] = useState<FillSession[] | null>(null);
  const [unmet, setUnmet] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [newSubject, setNewSubject] = useState("");
  const colorOf = (subject: string) => {
    const known = studyBlocks.find((event) => stringMeta(event, "subject") === subject);
    return known?.color ?? COLOR_SWATCHES[Math.max(0, rows.findIndex((row) => row.subject === subject)) % COLOR_SWATCHES.length];
  };
  const valid = timeToMinutes(end) - timeToMinutes(start) >= minSession && minSession <= maxSession && minSession >= 15 && chosenDays.length > 0 && rows.some((row) => row.hours > 0);
  const generate = () => {
    const outcome = smartFill({
      busy: doc.events, days: days.filter((day) => chosenDays.includes(day)), window: { start, end }, minSession, maxSession, gap,
      goals: rows.filter((row) => row.hours > 0).map((row) => ({ subject: row.subject, minutes: row.hours * 60, color: colorOf(row.subject) })),
    });
    setResult(outcome.sessions); setUnmet(outcome.unmet); setSkipped(new Set());
  };
  const picked = (result ?? []).filter((_, index) => !skipped.has(index));
  const apply = () => onApply(picked.map<ScheduleEvent>((session) => ({
    id: createId(), title: session.subject, color: session.color, days: [session.day], startTime: session.start, endTime: session.end,
    category: t("categories.study"), meta: { subject: session.subject },
  })));
  const num = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(Number(e.target.value));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{t("smartFill.title")}</DialogTitle><DialogDescription>{t("smartFill.hint")}</DialogDescription></DialogHeader>
      {result === null ? <div className="space-y-4">
        <div className="space-y-2"><h3 className="text-sm font-semibold">{t("smartFill.subjects")}</h3>
          {rows.map((row, index) => <div key={row.subject} className="flex items-center gap-2"><span className="size-3 shrink-0 rounded-full border" style={{ background: colorOf(row.subject) }} /><span className="min-w-0 flex-1 truncate text-sm">{row.subject}</span>
            <Input aria-label={t("smartFill.hoursFor", { subject: row.subject })} className="h-8 w-24" type="number" min={0} max={80} step={0.25} value={row.hours} onChange={(e) => setRows(rows.map((item, i) => (i === index ? { ...item, hours: Number(e.target.value) } : item)))} /><span className="text-xs text-muted-foreground">h</span></div>)}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const name = newSubject.trim(); if (name && !rows.some((row) => row.subject === name)) setRows([...rows, { subject: name, hours: 2 }]); setNewSubject(""); }}>
            <Input aria-label={t("views.study.addSubject")} placeholder={t("views.study.addSubject")} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} maxLength={60} /><Button type="submit" variant="outline" disabled={!newSubject.trim()}>{t("views.study.addSubjectAction")}</Button></form>
          {!rows.length && <p className="text-xs text-muted-foreground">{t("smartFill.noSubjects")}</p>}
        </div>
        <fieldset><legend className="mb-2 text-sm font-semibold">{t("smartFill.days")}</legend><div className="flex flex-wrap gap-2">{days.map((day) => <Label key={day} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs"><Checkbox checked={chosenDays.includes(day)} onCheckedChange={(checked) => setChosenDays(checked ? [...chosenDays, day] : chosenDays.filter((item) => item !== day))} />{dayLabel(day)}</Label>)}</div></fieldset>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Label className="block space-y-1 text-xs">{t("smartFill.from")}<Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Label>
          <Label className="block space-y-1 text-xs">{t("smartFill.to")}<Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Label>
          <Label className="block space-y-1 text-xs">{t("smartFill.min")}<Input type="number" min={15} step={5} value={minSession} onChange={num(setMinSession)} /></Label>
          <Label className="block space-y-1 text-xs">{t("smartFill.max")}<Input type="number" min={15} step={5} value={maxSession} onChange={num(setMaxSession)} /></Label>
          <Label className="block space-y-1 text-xs">{t("smartFill.gap")}<Input type="number" min={0} step={5} value={gap} onChange={num(setGap)} /></Label>
        </div>
        {!valid && <p className="text-xs text-muted-foreground">{t("smartFill.invalid")}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><HoverIconButton icon={SparklesIcon} disabled={!valid} onClick={generate}>{t("smartFill.generate")}</HoverIconButton></div>
      </div> : <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("smartFill.preview", { count: picked.length })}</p>
        <ul className="max-h-72 space-y-1.5 overflow-y-auto">{result.map((session, index) => <li key={`${session.subject}${session.day}${session.start}`} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
          <Checkbox aria-label={`${session.subject} ${dayLabel(session.day)}`} checked={!skipped.has(index)} onCheckedChange={(checked) => setSkipped((current) => { const next = new Set(current); if (checked) next.delete(index); else next.add(index); return next; })} />
          <span className="size-3 shrink-0 rounded-full border" style={{ background: session.color }} /><span className="min-w-0 flex-1 truncate">{session.subject}</span>
          <span className="text-xs text-muted-foreground">{dayLabel(session.day)} · {fmtRange(session.start, session.end, doc.prefs.hour24)}</span></li>)}
          {!result.length && <li className="text-sm text-muted-foreground">{t("smartFill.none")}</li>}</ul>
        {Object.keys(unmet).length > 0 && <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">{t("smartFill.unmet", { list: Object.entries(unmet).map(([subject, minutes]) => `${subject} ${Math.round((minutes / 60) * 10) / 10}h`).join(", ") })}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => setResult(null)}>{t("smartFill.back")}</Button><Button disabled={!picked.length} onClick={apply}>{t("smartFill.add", { count: picked.length })}</Button></div>
      </div>}
    </DialogContent>
  </Dialog>;
}
