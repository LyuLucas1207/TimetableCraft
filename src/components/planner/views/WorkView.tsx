import { useTranslation } from "react-i18next";
import { UsersIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip, DayCopyControl, EventCard, StatCard, ViewHeader, fmtHours, type ViewProps } from "./parts";
import { numberMeta, stringMeta } from "@/utils/planStats";
import { eventMinutes } from "@/utils/schedule";

const netMinutes = (event: Parameters<typeof eventMinutes>[0] & { meta?: Record<string, string | number> }) => Math.max(0, eventMinutes(event) - Number(event.meta?.breakMin ?? 0));

export default function WorkView({ doc, events, title, days, dayLabel, onEdit, onCreate, update, copyDay }: ViewProps) {
  const { t } = useTranslation("pages.Planner");
  const hour24 = doc.prefs.hour24;
  const { overtimeHours, currency } = doc.rules;
  const weekly = events.flatMap((event) => (event.days ?? []).filter((day) => days.includes(day)).map(() => event));
  const netHours = weekly.reduce((sum, event) => sum + netMinutes(event), 0) / 60;
  const grossHours = weekly.reduce((sum, event) => sum + eventMinutes(event), 0) / 60;
  const pay = weekly.reduce((sum, event) => sum + (netMinutes(event) / 60) * numberMeta(event, "rate"), 0);
  const overtime = Math.max(0, netHours - overtimeHours);
  const setRules = (patch: Partial<typeof doc.rules>) => update({ rules: { ...doc.rules, ...patch } });
  return <div className="min-h-full space-y-6 rounded-2xl border bg-[#f6f8f8] p-5 md:p-7 dark:bg-zinc-900">
    <ViewHeader icon={UsersIcon} kicker={t("views.work.kicker")} title={title} detail={t("views.work.description")} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t("views.work.hours")} value={fmtHours(netHours)} hint={grossHours !== netHours ? t("views.work.grossHint", { hours: fmtHours(grossHours) }) : undefined} tone={overtime > 0 ? "warn" : undefined} />
      <StatCard label={t("views.work.shifts")} value={weekly.length} />
      <StatCard label={t("views.work.pay")} value={pay > 0 ? `${currency}${pay.toFixed(2)}` : "—"} hint={pay > 0 ? undefined : t("views.work.payHint")} />
      <StatCard label={t("views.work.overtime")} value={overtime > 0 ? fmtHours(overtime) : "0h"} hint={t("views.work.overtimeHint", { hours: overtimeHours })} tone={overtime > 0 ? "warn" : "good"} />
    </div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-3">
      <Label className="block space-y-1 text-xs">{t("views.work.overtimeAfter")}<Input className="h-8 w-28" type="number" min={1} max={168} value={overtimeHours} onChange={(e) => { const value = Number(e.target.value); if (value > 0 && value <= 168) setRules({ overtimeHours: value }); }} /></Label>
      <Label className="block space-y-1 text-xs">{t("views.work.currency")}<Input className="h-8 w-20" maxLength={4} value={currency} onChange={(e) => setRules({ currency: e.target.value })} /></Label>
      <p className="min-w-48 flex-1 text-xs text-muted-foreground">{t("views.work.rulesHint")}</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{days.map((day) => {
      const shifts = events.filter((event) => event.days?.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const hours = shifts.reduce((sum, event) => sum + netMinutes(event), 0) / 60;
      return <section key={day} className="min-h-48 rounded-xl border bg-background p-3"><div className="mb-3 flex items-center justify-between border-b pb-2"><h3 className="font-semibold">{dayLabel(day)}</h3><span className="text-xs text-muted-foreground">{shifts.length ? `${shifts.length} · ${fmtHours(hours)}` : t("views.work.off")}</span></div>
        <div className="space-y-2">{shifts.map((event) => <EventCard key={event.id} event={event} hour24={hour24} compact onClick={() => onEdit(event)}
          chips={<>{stringMeta(event, "role") && <Chip>{stringMeta(event, "role")}</Chip>}{numberMeta(event, "breakMin") > 0 && <Chip>{t("views.work.break", { minutes: numberMeta(event, "breakMin") })}</Chip>}</>} />)}
          <Button variant="ghost" className={`${shifts.length ? "h-8" : "h-20"} w-full border border-dashed text-xs text-muted-foreground`} onClick={() => onCreate({ day })}>{t("views.work.addShift")}</Button></div></section>;
    })}</div>
    <DayCopyControl days={days} dayLabel={dayLabel} onCopy={(from, to) => copyDay({ day: from }, to.map((day) => ({ day })))} />
  </div>;
}
