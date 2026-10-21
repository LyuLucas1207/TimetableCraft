import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EnumSelect } from "@/components/ui/enum-select";
import { Input } from "@/components/ui/input";
import { ALL_WEEK_DAYS, type PlannerColumn } from "@/types/schedule";
import type { WeekDay } from "@/types/course";
import { createId } from "@/utils/ids";
import { COLOR_SWATCHES } from "./EventEditor";

export const MAX_COLUMNS = 14;

/** The classic seven weekday columns, as editable data. */
export function weekdayColumns(label: (day: WeekDay) => string): PlannerColumn[] {
  return ALL_WEEK_DAYS.map((day) => ({ id: createId(), kind: "day", day, label: label(day) }));
}

/** Lets the Custom Timetable define its own columns: weekdays, dates, or free-text lanes like rooms or people. */
export default function ColumnEditor({ columns, dayLabel, onChange }: {
  columns: PlannerColumn[] | undefined; dayLabel: (day: WeekDay) => string; onChange: (columns: PlannerColumn[] | undefined) => void;
}) {
  const { t } = useTranslation("pages.Planner");
  const list = columns ?? [];
  const patch = (id: string, next: Partial<PlannerColumn>) => onChange(list.map((column) => (column.id === id ? { ...column, ...next } : column)));
  const move = (index: number, delta: number) => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + delta, 0, item); onChange(next); };
  const add = (kind: PlannerColumn["kind"]) => {
    if (list.length >= MAX_COLUMNS) return;
    const base = { id: createId(), kind, color: COLOR_SWATCHES[list.length % COLOR_SWATCHES.length] };
    onChange([...list, kind === "day" ? { ...base, day: ALL_WEEK_DAYS[list.filter((c) => c.kind === "day").length % 7], label: dayLabel(ALL_WEEK_DAYS[list.filter((c) => c.kind === "day").length % 7]) }
      : kind === "date" ? { ...base, date: new Date().toISOString().slice(0, 10), label: t("columns.newDate") } : { ...base, label: t("columns.newText", { n: list.length + 1 }) }]);
  };
  const remove = (column: PlannerColumn) => onChange(list.filter((item) => item.id !== column.id));
  const kinds = [{ value: "text", label: t("columns.kindText") }, { value: "day", label: t("columns.kindDay") }, { value: "date", label: t("columns.kindDate") }] as const;
  return <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
    <div><p className="text-sm font-semibold">{t("columns.title")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t("columns.hint")}</p></div>
    {!columns ? <Button className="w-full" variant="outline" onClick={() => onChange(weekdayColumns(dayLabel))}>{t("columns.customize")}</Button> : <>
      <ul className="space-y-2">{list.map((column, index) => <li key={column.id} className="space-y-2 rounded-lg border bg-background p-2">
        <div className="flex items-center gap-2">
          <input type="color" aria-label={t("columns.color")} className="size-7 shrink-0 rounded border bg-transparent p-0" value={column.color ?? "#DBEAFE"} onChange={(e) => patch(column.id, { color: e.target.value })} />
          <Input aria-label={t("columns.name")} className="h-8" value={column.label} maxLength={40} onChange={(e) => patch(column.id, { label: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-28"><EnumSelect aria-label={t("columns.kind")} value={column.kind} options={kinds} onChange={(kind) => patch(column.id, { kind, ...(kind === "day" ? { day: column.day ?? ALL_WEEK_DAYS[0] } : {}), ...(kind === "date" ? { date: column.date ?? new Date().toISOString().slice(0, 10) } : {}) })} /></div>
          {column.kind === "day" && <div className="w-32"><EnumSelect aria-label={t("columns.weekday")} value={column.day ?? ALL_WEEK_DAYS[0]} onChange={(day) => patch(column.id, { day, label: column.label === dayLabel(column.day ?? ALL_WEEK_DAYS[0]) ? dayLabel(day) : column.label })} options={ALL_WEEK_DAYS.map((day) => ({ value: day, label: dayLabel(day) }))} /></div>}
          {column.kind === "date" && <Input aria-label={t("date")} className="h-8 w-36" type="date" value={column.date ?? ""} onChange={(e) => e.target.value && patch(column.id, { date: e.target.value })} />}
          <div className="ml-auto flex gap-1">
            <Button size="icon-xs" variant="ghost" aria-label={t("columns.up")} disabled={index === 0} onClick={() => move(index, -1)}>↑</Button>
            <Button size="icon-xs" variant="ghost" aria-label={t("columns.down")} disabled={index === list.length - 1} onClick={() => move(index, 1)}>↓</Button>
            <Button size="icon-xs" variant="ghost" aria-label={t("delete")} disabled={list.length <= 1} onClick={() => remove(column)}>✕</Button>
          </div>
        </div>
      </li>)}</ul>
      <div className="flex flex-wrap gap-2">{(["text", "day", "date"] as const).map((kind) => <Button key={kind} size="sm" variant="outline" disabled={list.length >= MAX_COLUMNS} onClick={() => add(kind)}>{t(`columns.add.${kind}`)}</Button>)}</div>
      <Button size="sm" variant="ghost" onClick={() => onChange(undefined)}>{t("columns.reset")}</Button>
    </>}
  </div>;
}
