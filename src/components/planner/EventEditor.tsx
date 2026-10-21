import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CopyIcon, SaveIcon, TrashIcon, XIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EnumSelect } from "@/components/ui/enum-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ALL_WEEK_DAYS, type PlannerColumn, type Priority, type ScheduleEvent } from "@/types/schedule";
import { addDuration, formatTimeRange, timeToMinutes } from "@/utils/time";
import { conflictsFor, numberMeta, stringMeta } from "@/utils/planStats";
import { eventMinutes, validateScheduleEvent } from "@/utils/schedule";
import type { PlannerId } from "@/config/planners";

export const COLOR_SWATCHES = ["#DBEAFE", "#D1FAE5", "#FEF3C7", "#FFEDD5", "#FEE2E2", "#FCE7F3", "#EDE9FE", "#CCFBF1", "#E5E7EB"];
const REMINDERS = [0, 5, 10, 15, 30, 60, 120, 1440];
const DURATIONS: Record<PlannerId, number[]> = {
  weekly: [30, 60, 90, 120], study: [25, 50, 90, 120], exam: [60, 120, 180], work: [240, 360, 480], daily: [15, 30, 60, 90], routine: [15, 30, 45, 60], custom: [30, 60, 90, 120],
};
/** One-tap shift times for the Work Schedule editor. */
const SHIFT_PRESETS = [
  { key: "morning", start: "07:00", end: "15:00" }, { key: "mid", start: "11:00", end: "19:00" },
  { key: "evening", start: "15:00", end: "23:00" }, { key: "night", start: "22:00", end: "06:00" },
] as const;

export interface EventEditorProps {
  initial: ScheduleEvent;
  dated: boolean;
  plannerId: PlannerId;
  /** Custom Timetable columns, when the planner has defined its own. */
  columns?: PlannerColumn[];
  existing: ScheduleEvent[];
  hour24: boolean;
  onSave: (event: ScheduleEvent) => void;
  onClose: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function EventEditor({ initial, dated, plannerId, columns, existing, hour24, onSave, onClose, onDelete, onDuplicate }: EventEditorProps) {
  const { t } = useTranslation("pages.Planner");
  const [event, setEvent] = useState(initial);
  const [error, setError] = useState("");
  const patch = (next: Partial<ScheduleEvent>) => setEvent((current) => ({ ...current, ...next }));
  const setMeta = (key: string, value: string | number | undefined) => setEvent((current) => {
    const meta = { ...current.meta };
    if (value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value))) delete meta[key]; else meta[key] = value;
    return { ...current, meta: Object.keys(meta).length ? meta : undefined };
  });
  const allowOvernight = plannerId !== "exam";
  const crossesMidnight = allowOvernight && /^\d\d:\d\d$/.test(event.startTime) && /^\d\d:\d\d$/.test(event.endTime) && timeToMinutes(event.endTime) < timeToMinutes(event.startTime);
  const custom = plannerId === "custom" && columns?.length ? columns : undefined;
  const normalized = (): ScheduleEvent => {
    const column = custom?.find((item) => item.id === event.columnKey);
    const base = { ...event, title: event.title.trim(), overnight: crossesMidnight || undefined };
    if (custom) {
      return { ...base, columnKey: column?.id, date: column?.kind === "date" ? column.date : undefined, days: column?.kind === "day" && column.day ? [column.day] : undefined };
    }
    return { ...base, ...(dated ? { days: undefined } : { date: undefined }), ...(plannerId === "custom" ? { columnKey: undefined } : {}) };
  };
  const preview = normalized();
  const conflicts = validateScheduleEvent(preview) ? [] : conflictsFor(preview, existing);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = normalized();
    const problem = validateScheduleEvent(next);
    if (problem) { setError(t(problem)); return; }
    try { onSave(next); } catch (caught) { setError(t(caught instanceof Error ? caught.message : "errorSave")); }
  };
  const applyDuration = (minutes: number) => {
    const end = addDuration(event.startTime, minutes);
    if (end) patch({ endTime: end });
  };
  const net = Math.max(0, eventMinutes({ ...event, overnight: crossesMidnight }) - numberMeta(event, "breakMin"));
  const subjects = [...new Set(existing.map((item) => stringMeta(item, "subject")).filter(Boolean))];
  const categories = [...new Set(existing.map((item) => item.category).filter((item): item is string => Boolean(item)))];
  const range = (a: string, b: string) => (hour24 ? `${a} – ${b}` : formatTimeRange(a, b));
  const action = onDelete ? "editAction" : "action";
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{t(`views.${plannerId}.${action}`, { defaultValue: t(onDelete ? "editEvent" : "addEvent") })}</DialogTitle><DialogDescription>{t(`views.${plannerId}.editorHint`, { defaultValue: t("eventHint") })}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <Label className="block space-y-1 text-sm font-medium">{t(`views.${plannerId}.titleLabel`, { defaultValue: t("eventTitle") })}<Input autoFocus required value={event.title} onChange={(e) => patch({ title: e.target.value })} maxLength={160} /></Label>
        {plannerId === "exam" && <div className="grid grid-cols-2 gap-3">
          <Label className="block space-y-1 text-sm font-medium">{t("fields.code")}<Input value={stringMeta(event, "code")} onChange={(e) => setMeta("code", e.target.value)} maxLength={40} /></Label>
          <Label className="block space-y-1 text-sm font-medium">{t("fields.seat")}<Input value={stringMeta(event, "seat")} onChange={(e) => setMeta("seat", e.target.value)} maxLength={20} /></Label>
        </div>}
        {plannerId === "study" && <Label className="block space-y-1 text-sm font-medium">{t("fields.subject")}
          <Input list="planner-subjects" value={stringMeta(event, "subject")} onChange={(e) => setMeta("subject", e.target.value)} maxLength={60} />
          <datalist id="planner-subjects">{subjects.map((subject) => <option key={subject} value={subject} />)}</datalist>
        </Label>}
        {plannerId === "work" && <div className="grid grid-cols-3 gap-3">
          <Label className="col-span-3 block space-y-1 text-sm font-medium sm:col-span-1">{t("fields.role")}<Input value={stringMeta(event, "role")} onChange={(e) => setMeta("role", e.target.value)} maxLength={40} /></Label>
          <Label className="block space-y-1 text-sm font-medium">{t("fields.breakMin")}<Input type="number" min={0} max={600} step={5} value={stringMeta(event, "breakMin")} onChange={(e) => setMeta("breakMin", e.target.value === "" ? undefined : Number(e.target.value))} /></Label>
          <Label className="block space-y-1 text-sm font-medium">{t("fields.rate")}<Input type="number" min={0} step="0.01" value={stringMeta(event, "rate")} onChange={(e) => setMeta("rate", e.target.value === "" ? undefined : Number(e.target.value))} /></Label>
        </div>}
        <Label className="block space-y-1 text-sm font-medium">{t("subtitle")}<Input value={event.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value })} /></Label>
        {custom ? <div className="space-y-1"><Label>{t("column")}</Label>
          <EnumSelect aria-label={t("column")} value={event.columnKey ?? custom[0].id} onChange={(columnKey) => patch({ columnKey })} options={custom.map((column) => ({ value: column.id, label: column.label }))} />
        </div> : dated ? <Label className="block space-y-1 text-sm font-medium">{t("date")}<Input type="date" required value={event.date ?? ""} onChange={(e) => patch({ date: e.target.value })} /></Label> :
          <fieldset><legend className="mb-2 text-sm font-medium">{t("days")}</legend><div className="flex flex-wrap gap-2">{ALL_WEEK_DAYS.map((day) => <Label key={day} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs"><Checkbox checked={event.days?.includes(day) ?? false} onCheckedChange={(checked) => patch({ days: checked ? [...(event.days ?? []), day] : event.days?.filter((item) => item !== day) })} />{t(`days.${day}`, { ns: "language" })}</Label>)}</div></fieldset>}
        {plannerId === "work" && <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{t("fields.presets")}</span>{SHIFT_PRESETS.map((preset) => <Button key={preset.key} type="button" size="xs" variant="outline" onClick={() => patch({ startTime: preset.start, endTime: preset.end })}>{t(`fields.preset.${preset.key}`)}</Button>)}</div>}
        <div className="grid grid-cols-2 gap-3">{(["startTime", "endTime"] as const).map((key) => <Label key={key} className="block space-y-1 text-sm font-medium">{t(key)}<Input type="time" required value={event[key]} onChange={(e) => patch({ [key]: e.target.value })} /></Label>)}</div>
        <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{t("fields.duration")}</span>{DURATIONS[plannerId].map((minutes) => <Button key={minutes} type="button" size="xs" variant="outline" onClick={() => applyDuration(minutes)}>{minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}m`}</Button>)}</div>
        {crossesMidnight && <p className="text-xs text-muted-foreground">{t("fields.overnightHint", { time: range(event.startTime, event.endTime) })}</p>}
        {plannerId === "work" && net > 0 && <p className="text-xs text-muted-foreground">{t("fields.netHours", { hours: (net / 60).toFixed(2).replace(/\.?0+$/, "") })}</p>}
        <Label className="block space-y-1 text-sm font-medium">{plannerId === "exam" ? t("fields.room") : t("location")}<Input value={event.location ?? ""} onChange={(e) => patch({ location: e.target.value })} /></Label>
        {plannerId === "exam" && <Label className="block space-y-1 text-sm font-medium">{t("fields.allowed")}<Input value={stringMeta(event, "allowed")} onChange={(e) => setMeta("allowed", e.target.value)} maxLength={120} /></Label>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Label className="block space-y-1 text-sm font-medium">{t("category")}<Input list="planner-categories" value={event.category ?? ""} onChange={(e) => patch({ category: e.target.value })} /><datalist id="planner-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></Label>
          <div className="space-y-1"><Label>{t("reminder")}</Label>
            <EnumSelect aria-label={t("reminder")} value={event.reminderMinutes ?? -1} onChange={(value) => patch({ reminderMinutes: value < 0 ? undefined : value })}
              options={[{ value: -1, label: t("reminderNone") }, ...REMINDERS.map((minutes) => ({ value: minutes, label: t(`reminderOption.${minutes}`) }))]} />
          </div>
        </div>
        <div className="space-y-2"><Label>{t("color")}</Label>
          <div className="flex flex-wrap items-center gap-2">{COLOR_SWATCHES.map((color) => <button key={color} type="button" aria-label={color} aria-pressed={event.color.toLowerCase() === color.toLowerCase()} onClick={() => patch({ color })} className="size-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: color, borderColor: event.color.toLowerCase() === color.toLowerCase() ? "currentColor" : "transparent" }} />)}
            <Input aria-label={t("color")} className="h-8 w-14 p-1" type="color" value={event.color} onChange={(e) => patch({ color: e.target.value })} /></div>
        </div>
        {(plannerId === "study" || plannerId === "daily" || plannerId === "weekly") && <div className="flex flex-wrap items-center gap-4">
          {plannerId !== "weekly" && <div className="flex items-center gap-2"><Label className="text-sm">{t("priority")}</Label><EnumSelect aria-label={t("priority")} className="w-32" value={event.priority ?? "none"} onChange={(value) => patch({ priority: value === "none" ? undefined : value as Priority })}
            options={[{ value: "none", label: t("priorityOption.none") }, ...(["low", "medium", "high"] as const).map((value) => ({ value, label: t(`priorityOption.${value}`) }))]} /></div>}
          <Label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(event.done)} onCheckedChange={(checked) => patch({ done: checked ? true : undefined })} />{t("markDone")}</Label>
        </div>}
        {conflicts.length > 0 && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">{t("conflictWarning", { names: conflicts.slice(0, 3).map((item) => item.title).join(", "), count: conflicts.length })}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2 border-t pt-4">{onDelete && <HoverIconButton icon={TrashIcon} type="button" variant="destructive" onClick={onDelete}>{t("delete")}</HoverIconButton>}{onDuplicate && <HoverIconButton icon={CopyIcon} type="button" variant="outline" onClick={onDuplicate}>{t("duplicate")}</HoverIconButton>}<HoverIconButton icon={XIcon} type="button" className="ml-auto" variant="outline" onClick={onClose}>{t("cancel")}</HoverIconButton><HoverIconButton icon={SaveIcon} type="submit">{t(`views.${plannerId}.saveAction`, { defaultValue: t("save") })}</HoverIconButton></div>
      </form>
    </DialogContent>
  </Dialog>;
}
