import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { FileDescriptionIcon, UploadIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import { HoverIconButton, useAnimatedIconHover } from "@/components/ui/hover-icon-button";
import { buildMailto } from "@/constants";
import { useScheduleStore } from "@/stores";

interface ExcelUploaderProps {
  onFile: (file: File) => void;
}

export default function ExcelUploader({ onFile }: ExcelUploaderProps) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const inputRef = useRef<HTMLInputElement>(null);
  const summary = useScheduleStore((s) => s.importSummary);
  const [dragging, setDragging] = useState(false);
  const upload = useAnimatedIconHover();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    onFile(file);
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dashed bg-background p-5 text-center transition-colors sm:p-8 ${
        dragging ? "border-foreground/40 bg-muted/40" : "border-border"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      {...upload.hoverProps}
    >
      <UploadIcon ref={upload.ref} size={32} className="mx-auto mb-3 text-muted-foreground" />
      <p className="text-base font-medium">{t("uploadTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("uploadBody")}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <HoverIconButton className="mt-4" type="button" icon={FileDescriptionIcon} onClick={() => inputRef.current?.click()}>
        {t("common.browse", { ns: LANG_NS })}
      </HoverIconButton>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        {t("campusInvite.toolHint", { ns: LANG_NS })}{" "}
        <a
          href={buildMailto(t("campusInvite.mailSubject", { ns: LANG_NS }), t("campusInvite.mailBody", { ns: LANG_NS }))}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {t("campusInvite.cta", { ns: LANG_NS })}
        </a>
      </p>
      {summary ? (
        <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-xl border bg-muted/40 p-3 text-left">
          <FileDescriptionIcon size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{summary.filename}</p>
            <p className="text-muted-foreground">{t("detected", { courses: summary.uniqueCourseCount })}</p>
            <p className="text-muted-foreground">{t("sections", { count: summary.scheduledSectionCount })}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
