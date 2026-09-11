import { PAGE } from "@/assets/language";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COURSE_TYPES,
  CourseType,
  INSTRUCTIONAL_FORMATS,
  InstructionalFormat,
  Term,
  TERMS,
} from "@/types/course";
import type { ManualCourseInput } from "@/stores/schedule";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnumSelect } from "@/components/ui/enum-select";
import { MeetingSummary } from "@/components/courses/MeetingSummary";
import { parseManualCourseCode } from "@/parser/courseListingParser";
import { useScheduleStore } from "@/stores";
import { showMeetingTimeModal } from "@/stores/modal";
import { colorsForPreset } from "@/utils/colors";
import { parseOptionalTimeRange, toTimeInputValue } from "@/utils/time";

interface CourseFormProps {
  initial?: Partial<ManualCourseInput>;
  submitLabel: string;
  autoOpenMeeting?: boolean;
  onCancel: () => void;
  onSubmit: (input: ManualCourseInput) => void;
}

export default function CourseForm({
  initial,
  submitLabel,
  autoOpenMeeting = false,
  onCancel,
  onSubmit,
}: CourseFormProps) {
  const { t } = useTranslation([PAGE.App, "language"]);
  const preset = useScheduleStore((s) => s.settings.colorPreset);
  const [courseCode, setCourseCode] = useState(initial?.courseCode ?? "");
  const [section, setSection] = useState(initial?.section ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [term, setTerm] = useState<Term>(initial?.term ?? Term.W1);
  const [instructionalFormat, setInstructionalFormat] = useState<InstructionalFormat>(initial?.instructionalFormat ?? InstructionalFormat.Lecture);
  const [courseType, setCourseType] = useState<CourseType>(initial?.courseType ?? CourseType.Active);
  const [days, setDays] = useState(initial?.days ?? []);
  const [startTime, setStartTime] = useState(toTimeInputValue(initial?.startTime));
  const [endTime, setEndTime] = useState(toTimeInputValue(initial?.endTime));
  const [building, setBuilding] = useState(initial?.building ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [instructor, setInstructor] = useState(initial?.instructor ?? "");
  const [color, setColor] = useState(initial?.color ?? colorsForPreset(preset)[0]);
  const [error, setError] = useState("");

  const hasMeeting = days.length > 0 || Boolean(startTime || endTime);

  const applyMeeting = (next: { days: typeof days; startTime: string; endTime: string }) => {
    setDays(next.days);
    setStartTime(next.startTime);
    setEndTime(next.endTime);
    setError("");
  };

  const openMeeting = () => {
    showMeetingTimeModal({
      days,
      startTime,
      endTime,
      onApply: applyMeeting,
    });
  };

  useEffect(() => {
    if (!autoOpenMeeting) return;
    showMeetingTimeModal({
      days: initial?.days ?? [],
      startTime: toTimeInputValue(initial?.startTime),
      endTime: toTimeInputValue(initial?.endTime),
      onApply: applyMeeting,
    });
    // Slot click opens the stacked meeting modal once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenMeeting]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!parseManualCourseCode(courseCode)) {
          setError(t("formErrorCode", { ns: PAGE.App }));
          return;
        }
        const range = parseOptionalTimeRange(startTime, endTime);
        if (range === "invalid") {
          setError(t("formErrorTime", { ns: PAGE.App }));
          return;
        }
        onSubmit({
          courseCode,
          section,
          title,
          term,
          instructionalFormat,
          courseType,
          days,
          startTime: range === "empty" ? "" : range.startTime,
          endTime: range === "empty" ? "" : range.endTime,
          building,
          room,
          instructor,
          color,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("formCode", { ns: PAGE.App })}>
          <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="CPEN 442" required />
        </Field>
        <Field label={t("formSection", { ns: PAGE.App })} optional={t("optional", { ns: PAGE.App })}>
          <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="101" />
        </Field>
      </div>
      <Field label={t("formTitle", { ns: PAGE.App })} optional={t("optional", { ns: PAGE.App })}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Introduction to Cybersecurity" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("formTerm", { ns: PAGE.App })}>
          <EnumSelect
            value={term}
            onChange={setTerm}
            options={TERMS.map((item) => ({
              value: item,
              label: t(`common.${termI18n(item)}`, { ns: "language" }),
            }))}
          />
        </Field>
        <Field label={t("formFormat", { ns: PAGE.App })}>
          <EnumSelect
            value={instructionalFormat}
            onChange={setInstructionalFormat}
            options={INSTRUCTIONAL_FORMATS.map((format) => ({
              value: format,
              label: t(`formats.${format}`, { ns: "language" }),
            }))}
          />
        </Field>
      </div>
      <Field label={t("formCourseType", { ns: PAGE.App })}>
        <EnumSelect
          value={courseType}
          onChange={setCourseType}
          options={COURSE_TYPES.map((item) => ({
            value: item,
            label: t(`courseTypes.${item}`, { ns: "language" }),
          }))}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">{t("formCourseTypeHint", { ns: PAGE.App })}</p>
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">
          {t("formMeeting", { ns: PAGE.App })}
          <span className="ml-1 font-normal text-muted-foreground">({t("optional", { ns: PAGE.App })})</span>
        </p>
        <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="min-w-0 text-sm text-muted-foreground">
            <MeetingSummary days={days} startTime={startTime} endTime={endTime} />
          </p>
          <Button type="button" variant="outline" size="sm" onClick={openMeeting}>
            <ClockIcon />
            {hasMeeting ? t("formMeetingEdit", { ns: PAGE.App }) : t("formMeetingSet", { ns: PAGE.App })}
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("formDaysHint", { ns: PAGE.App })}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("formBuilding", { ns: PAGE.App })} optional={t("optional", { ns: PAGE.App })}>
          <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="CHBE" />
        </Field>
        <Field label={t("formRoom", { ns: PAGE.App })} optional={t("optional", { ns: PAGE.App })}>
          <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="102" />
        </Field>
      </div>
      <Field label={t("formInstructor", { ns: PAGE.App })} optional={t("optional", { ns: PAGE.App })}>
        <Input value={instructor} onChange={(e) => setInstructor(e.target.value)} />
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">{t("formColor", { ns: PAGE.App })}</p>
        <div className="flex flex-wrap gap-2">
          {colorsForPreset(preset).map((item) => (
            <button
              key={item}
              type="button"
              className={`size-7 rounded-full border ${color === item ? "ring-2 ring-ring ring-offset-2" : ""}`}
              style={{ background: item }}
              onClick={() => setColor(item)}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-10 rounded border" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel", { ns: "language" })}
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

function termI18n(term: Term): "winterTerm1" | "winterTerm2" | "summerTerm1" | "summerTerm2" {
  switch (term) {
    case Term.W1:
      return "winterTerm1";
    case Term.W2:
      return "winterTerm2";
    case Term.S1:
      return "summerTerm1";
    case Term.S2:
      return "summerTerm2";
  }
}

function Field({ label, optional, children }: { label: string; optional?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">({optional})</span> : null}
      </Label>
      {children}
    </div>
  );
}
