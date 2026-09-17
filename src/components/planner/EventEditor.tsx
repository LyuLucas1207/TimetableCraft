import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SaveIcon, TrashIcon, XIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ALL_WEEK_DAYS, type ScheduleEvent } from "@/types/schedule";
import { validateScheduleEvent } from "@/utils/schedule";
import type { PlannerId } from "@/config/planners";

export default function EventEditor({ initial, dated, plannerId, onSave, onClose, onDelete }: {
  initial: ScheduleEvent; dated: boolean; plannerId: PlannerId; onSave: (event: ScheduleEvent) => void; onClose: () => void; onDelete?: () => void;
}) {
  const { t } = useTranslation("pages.Planner");
  const [event, setEvent] = useState(initial);
  const [error, setError] = useState("");
  const patch = (next: Partial<ScheduleEvent>) => setEvent({ ...event, ...next });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { ...event, title: event.title.trim(), ...(dated ? { days: undefined } : { date: undefined }) };
    const problem = validateScheduleEvent(next);
    if (problem) { setError(t(problem)); return; }
    try { onSave(next); } catch (error) { setError(t(error instanceof Error ? error.message : "errorSave")); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{t(`views.${plannerId}.${onDelete ? "editAction" : "action"}`, { defaultValue: t(onDelete ? "editEvent" : "addEvent") })}</DialogTitle><DialogDescription>{t(`views.${plannerId}.editorHint`, { defaultValue: t("eventHint") })}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <Label className="block space-y-1 text-sm font-medium">{t(`views.${plannerId}.titleLabel`, { defaultValue: t("eventTitle") })}<Input autoFocus required value={event.title} onChange={(e) => patch({ title: e.target.value })} maxLength={160} /></Label>
        <Label className="block space-y-1 text-sm font-medium">{t("subtitle")}<Input value={event.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value })} /></Label>
        {dated ? <Label className="block space-y-1 text-sm font-medium">{t("date")}<Input type="date" required value={event.date ?? ""} onChange={(e) => patch({ date: e.target.value })} /></Label> :
          <fieldset><legend className="mb-2 text-sm font-medium">{t("days")}</legend><div className="flex flex-wrap gap-2">{ALL_WEEK_DAYS.map((day) => <Label key={day} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs"><Checkbox checked={event.days?.includes(day) ?? false} onCheckedChange={(checked) => patch({ days: checked ? [...(event.days ?? []), day] : event.days?.filter((item) => item !== day) })} />{t(`days.${day}`, { ns: "language" })}</Label>)}</div></fieldset>}
        <div className="grid grid-cols-2 gap-3">{(["startTime", "endTime"] as const).map((key) => <Label key={key} className="block space-y-1 text-sm font-medium">{t(key)}<Input type="time" required value={event[key]} onChange={(e) => patch({ [key]: e.target.value })} /></Label>)}</div>
        <Label className="block space-y-1 text-sm font-medium">{t("location")}<Input value={event.location ?? ""} onChange={(e) => patch({ location: e.target.value })} /></Label>
        <div className="grid grid-cols-[1fr_100px] gap-3"><Label className="block space-y-1 text-sm font-medium">{t("category")}<Input value={event.category ?? ""} onChange={(e) => patch({ category: e.target.value })} /></Label><Label className="block space-y-1 text-sm font-medium">{t("color")}<Input type="color" value={event.color} onChange={(e) => patch({ color: e.target.value })} /></Label></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 border-t pt-4">{onDelete && <HoverIconButton icon={TrashIcon} type="button" variant="destructive" onClick={onDelete}>{t("delete")}</HoverIconButton>}<HoverIconButton icon={XIcon} type="button" className="ml-auto" variant="outline" onClick={onClose}>{t("cancel")}</HoverIconButton><HoverIconButton icon={SaveIcon} type="submit">{t(`views.${plannerId}.saveAction`, { defaultValue: t("save") })}</HoverIconButton></div>
      </form>
    </DialogContent>
  </Dialog>;
}
