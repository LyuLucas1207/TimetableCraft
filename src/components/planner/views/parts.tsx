import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { WeekDay } from "@/types/course";
import type { PlannerDocument } from "@/stores/planners";
import type { ScheduleEvent } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EnumSelect } from "@/components/ui/enum-select";
import { formatDisplayTime } from "@/utils/time";

export interface CreateOptions { day?: WeekDay; date?: string; time?: string; title?: string }

export interface ViewProps {
  doc: PlannerDocument;
  /** Stored events after the category filter. */
  events: ScheduleEvent[];
  /** The same events with overnight blocks split at midnight, for placing on a timeline. */
  segments: ScheduleEvent[];
  title: string;
  today: string;
  /** Weekdays in the order and visibility the user picked. */
  days: WeekDay[];
  dateLabel: (date: string) => string;
  dayLabel: (day: WeekDay, short?: boolean) => string;
  onEdit: (event: ScheduleEvent) => void;
  onCreate: (options?: CreateOptions) => void;
  onPatch: (id: string, patch: Partial<ScheduleEvent>) => void;
  update: (patch: Partial<PlannerDocument>) => void;
  toggleCheckin: (id: string, date: string) => void;
  copyDay: (from: { day?: WeekDay; date?: string }, to: { day?: WeekDay; date?: string }[]) => void;
  openSmartFill: () => void;
}

export const fmtTime = (value: string, hour24: boolean) => (hour24 ? value : formatDisplayTime(value));
export const fmtRange = (start: string, end: string, hour24: boolean) => `${fmtTime(start, hour24)} – ${fmtTime(end, hour24)}`;
export const fmtHours = (hours: number) => `${(Math.round(hours * 10) / 10).toString()}h`;

export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" | "good" | "bad" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground", warn: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    good: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200", bad: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
  };
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium ${tones[tone]}`}>{children}</span>;
}

export function EventCard({ event, onClick, hour24, compact = false, fill = false, onToggleDone, chips, lead }: {
  event: ScheduleEvent; onClick: () => void; hour24: boolean; compact?: boolean; fill?: boolean; onToggleDone?: (done: boolean) => void; chips?: ReactNode; lead?: ReactNode;
}) {
  const { t } = useTranslation("pages.Planner");
  return (
    <div className={`relative ${fill ? "h-full" : ""}`}>
      <Button variant="outline" onClick={onClick} className={`${fill ? "h-full overflow-hidden" : "h-auto"} w-full justify-start whitespace-normal rounded-xl bg-background text-left shadow-sm hover:bg-muted/40 ${compact ? "p-2.5" : "p-4"} ${onToggleDone ? "pr-9" : ""} ${event.done ? "opacity-60" : ""}`} >
        <span className="block min-w-0">
          <span className={`flex items-center gap-2 font-semibold ${event.done ? "line-through" : ""}`}><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full border border-black/10" style={{ background: event.color }} />{lead}<span className="truncate">{event.title}</span></span>
          {event.subtitle && <span className="mt-1 block truncate text-xs text-muted-foreground">{event.subtitle}</span>}
          <span className="mt-1 block text-xs text-muted-foreground">{fmtRange(event.startTime, event.endTime, hour24)}{event.overnight && timeBefore(event) ? ` · ${t("nextDay")}` : ""}</span>
          {event.location && <span className="mt-1 block truncate text-xs text-muted-foreground">{event.location}</span>}
          {chips && <span className="mt-1.5 flex flex-wrap gap-1">{chips}</span>}
        </span>
      </Button>
      {onToggleDone && <span className="absolute top-2.5 right-2.5"><Checkbox aria-label={t("markDone")} checked={Boolean(event.done)} onCheckedChange={(checked) => onToggleDone(Boolean(checked))} /></span>}
    </div>
  );
}
const timeBefore = (event: ScheduleEvent) => event.endTime < event.startTime;

export function EmptyView({ description, onCreate, label }: { description: string; onCreate: () => void; label: string }) {
  return <div className="rounded-2xl border border-dashed bg-background p-8 text-center"><p className="text-sm text-muted-foreground">{description}</p><Button className="mt-4" onClick={onCreate}>{label}</Button></div>;
}

export function ViewHeader({ icon: Icon, kicker, title, detail, actions }: { icon: React.ComponentType<{ size?: number }>; kicker: string; title: string; detail: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-4"><span aria-hidden="true" className="rounded-xl border bg-background p-3"><Icon size={24} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{kicker}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>{detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warn" | "good" }) {
  return <div className={`rounded-xl border bg-background p-4 ${tone === "warn" ? "border-amber-400/70" : tone === "good" ? "border-emerald-400/70" : ""}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(value)} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} /></div>;
}

/** "Copy Monday to …" for tools that repeat a pattern across weekdays. */
export function DayCopyControl({ days, dayLabel, onCopy }: { days: WeekDay[]; dayLabel: (day: WeekDay) => string; onCopy: (from: WeekDay, to: WeekDay[]) => void }) {
  const { t } = useTranslation("pages.Planner");
  const [from, setFrom] = useState<WeekDay>(days[0]);
  const [to, setTo] = useState<string>("all");
  const source = days.includes(from) ? from : days[0];
  const targets = to === "all" ? days.filter((day) => day !== source) : [to as WeekDay];
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-background p-3">
      <div className="min-w-32 flex-1 space-y-1"><p className="text-xs text-muted-foreground">{t("copyDayFrom")}</p><EnumSelect aria-label={t("copyDayFrom")} value={source} onChange={setFrom} options={days.map((day) => ({ value: day, label: dayLabel(day) }))} /></div>
      <div className="min-w-32 flex-1 space-y-1"><p className="text-xs text-muted-foreground">{t("copyDayTo")}</p><EnumSelect aria-label={t("copyDayTo")} value={to} onChange={setTo} options={[{ value: "all", label: t("copyDayAll") }, ...days.filter((day) => day !== source).map((day) => ({ value: day as string, label: dayLabel(day) }))]} /></div>
      <Button variant="outline" disabled={!targets.length} onClick={() => onCopy(source, targets)}>{t("copyDay")}</Button>
    </div>
  );
}
