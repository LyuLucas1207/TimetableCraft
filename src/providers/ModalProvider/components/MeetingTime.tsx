import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { XIcon } from "lucide-react";

import { PAGE } from "@/assets/language";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnumSelect } from "@/components/ui/enum-select";
import { Label } from "@/components/ui/label";
import { hideModal, ModalTypeEnum, useModalStore } from "@/stores/modal";
import { WEEK_DAYS, WeekDay } from "@/types/course";
import { addDuration, pad2, parseOptionalTimeRange, parseToMinutes, minutesToTime, toTimeInputValue, QUARTER_MINUTES } from "@/utils/time";

const EMPTY_TIME = "__";
const TIME_HOURS = Array.from({ length: 16 }, (_, index) => index + 7);

const DURATION_PRESETS = [
  { minutes: 60, key: "formPlus1h" },
  { minutes: 90, key: "formPlus90" },
  { minutes: 120, key: "formPlus2h" },
  { minutes: 150, key: "formPlus2h30" },
  { minutes: 180, key: "formPlus3h" },
] as const;

export default function MeetingTime() {
  const { t } = useTranslation([PAGE.App, "language"]);
  const isOpen = useModalStore((s) => s.meetingTimeModal.isOpen);
  const days = useModalStore((s) => s.meetingTimeModal.days);
  const startTime = useModalStore((s) => s.meetingTimeModal.startTime);
  const endTime = useModalStore((s) => s.meetingTimeModal.endTime);

  const [draftDays, setDraftDays] = useState<WeekDay[]>(days);
  const [draftStart, setDraftStart] = useState(startTime);
  const [draftEnd, setDraftEnd] = useState(endTime);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setDraftDays(days);
    setDraftStart(toTimeInputValue(startTime));
    setDraftEnd(toTimeInputValue(endTime));
    setError("");
  }, [isOpen, days, startTime, endTime]);

  const close = () => hideModal(ModalTypeEnum.MeetingTime);

  const handleCancel = () => {
    useModalStore.getState().meetingTimeModal.onCancel?.();
    close();
  };

  const toggleDay = (day: WeekDay, checked: boolean) => {
    setDraftDays((current) => (checked ? [...current, day] : current.filter((item) => item !== day)));
  };

  const applyDuration = (minutes: number) => {
    const nextEnd = addDuration(draftStart, minutes);
    if (!nextEnd) {
      setError(t("formDurationNeedStart", { ns: PAGE.App }));
      return;
    }
    setDraftEnd(nextEnd);
    setError("");
  };

  return (
    <Dialog
      open={isOpen}
      modal="trap-focus"
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent className="z-[65] max-h-[85dvh] w-[calc(100%-1.25rem)] overflow-y-auto p-3 sm:max-w-lg sm:p-4" overlayClassName="z-[65]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("formMeetingTitle", { ns: PAGE.App })}</DialogTitle>
          <DialogDescription>{t("formDurationHint", { ns: PAGE.App })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              {t("formDays", { ns: PAGE.App })}
              <span className="ml-1 font-normal text-muted-foreground">({t("optional", { ns: PAGE.App })})</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {WEEK_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={draftDays.includes(day)} onCheckedChange={(checked) => toggleDay(day, checked === true)} />
                  {t(`days.${day}`, { ns: "language" })}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeField
              label={t("formStart", { ns: PAGE.App })}
              optional={t("optional", { ns: PAGE.App })}
              value={draftStart}
              onChange={(value) => {
                setDraftStart(value);
                setError("");
              }}
              clearLabel={t("formClearTime", { ns: PAGE.App })}
            />
            <TimeField
              label={t("formEnd", { ns: PAGE.App })}
              optional={t("optional", { ns: PAGE.App })}
              value={draftEnd}
              onChange={(value) => {
                setDraftEnd(value);
                setError("");
              }}
              clearLabel={t("formClearTime", { ns: PAGE.App })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("formDuration", { ns: PAGE.App })}</p>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((item) => (
                <Button key={item.minutes} type="button" size="xs" variant="outline" disabled={!draftStart} onClick={() => applyDuration(item.minutes)}>
                  {t(item.key, { ns: PAGE.App })}
                </Button>
              ))}
            </div>
          </div>
          {draftStart || draftEnd || draftDays.length > 0 ? (
            <button
              type="button"
              className="justify-self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => {
                setDraftDays([]);
                setDraftStart("");
                setDraftEnd("");
                setError("");
              }}
            >
              {t("formRemoveTime", { ns: PAGE.App })}
            </button>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("common.cancel", { ns: "language" })}
          </Button>
          <Button
            type="button"
            onClick={() => {
              const range = parseOptionalTimeRange(draftStart, draftEnd);
              if (range === "invalid") {
                setError(t("formErrorTime", { ns: PAGE.App }));
                return;
              }
              useModalStore.getState().meetingTimeModal.onApply?.({
                days: draftDays,
                startTime: range === "empty" ? "" : range.startTime,
                endTime: range === "empty" ? "" : range.endTime,
              });
              close();
            }}
          >
            {t("formMeetingDone", { ns: PAGE.App })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeField({
  label,
  optional,
  value,
  onChange,
  clearLabel,
}: {
  label: string;
  optional?: string;
  value: string;
  onChange: (value: string) => void;
  clearLabel: string;
}) {
  const display = toTimeInputValue(value);
  const total = parseToMinutes(display);
  const hour = total == null ? EMPTY_TIME : String(Math.floor(total / 60));
  const minute = total == null ? EMPTY_TIME : String(total % 60);
  const hours = TIME_HOURS.includes(Number(hour)) || hour === EMPTY_TIME ? TIME_HOURS : [...TIME_HOURS, Number(hour)].sort((a, b) => a - b);

  const commit = (nextHour: string, nextMinute: string) => {
    if (nextHour === EMPTY_TIME) {
      onChange("");
      return;
    }
    const mins = nextMinute === EMPTY_TIME ? 0 : Number(nextMinute);
    onChange(minutesToTime(Number(nextHour) * 60 + mins));
  };

  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">({optional})</span> : null}
      </Label>
      <div className="flex items-center gap-1">
        <EnumSelect
          className="min-w-0 flex-1"
          value={hour}
          onChange={(next) => commit(next, minute)}
          options={[
            { value: EMPTY_TIME, label: "—" },
            ...hours.map((item) => ({ value: String(item), label: pad2(item) })),
          ]}
        />
        <span className="text-sm text-muted-foreground">:</span>
        <EnumSelect
          className="min-w-0 flex-1"
          value={minute}
          onChange={(next) => commit(hour === EMPTY_TIME ? "8" : hour, next)}
          options={[
            { value: EMPTY_TIME, label: "—" },
            ...QUARTER_MINUTES.map((item) => ({ value: String(item), label: pad2(item) })),
          ]}
        />
        {display ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange("")} aria-label={clearLabel}>
            <XIcon />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

