import { type RefObject, useState } from "react";
import { CalendarDaysIcon, CheckIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { DownloadIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useScheduleStore } from "@/stores";
import { ExportAspect, ExportFormat, EXPORT_ASPECTS, EXPORT_ASPECT_RATIO, EXPORT_FORMATS, type Course } from "@/types/course";
import { filenameFromTitle, downloadTextFile } from "@/utils/download";
import { buildIcsCalendar } from "@/utils/exportCalendar";
import { exportNodeToPng, measureScreenSize, resolveExportAspectRatio } from "@/utils/exportImage";
import { cn } from "cn";

export default function ExportPopover({
  disabled,
  courses,
  title,
  exportRef,
}: {
  disabled: boolean;
  courses: Course[];
  title: string;
  exportRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation(PAGE.App);
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.Png);
  const collapseEmptyTime = useScheduleStore((s) => s.settings.collapseEmptyTime);
  const exportAspect = useScheduleStore((s) => s.settings.exportAspect);
  const exportScreenWidth = useScheduleStore((s) => s.settings.exportScreenWidth);
  const exportScreenHeight = useScheduleStore((s) => s.settings.exportScreenHeight);
  const settings = useScheduleStore((s) => s.settings);
  const setSettings = useScheduleStore((s) => s.setSettings);

  const selectAspect = (aspect: ExportAspect) => {
    if (aspect === ExportAspect.Screen) {
      const { width, height } = measureScreenSize();
      setSettings({ exportAspect: aspect, exportScreenWidth: width, exportScreenHeight: height });
      return;
    }
    setSettings({ exportAspect: aspect });
  };

  const downloadPng = async () => {
    if (!exportRef.current) {
      toast.error(t("emptyTitle"));
      return;
    }
    await exportNodeToPng(exportRef.current, filenameFromTitle(title, "png"), {
      aspectRatio: resolveExportAspectRatio(settings),
    });
    setOpen(false);
  };

  const downloadIcs = () => {
    const ics = buildIcsCalendar(courses, title.trim() || t("untitled"));
    if (!ics) {
      toast.error(t("exportIcsEmpty"));
      return;
    }
    downloadTextFile(filenameFromTitle(title, "ics"), ics, "text/calendar;charset=utf-8");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <HoverIconButton
            size="icon-sm"
            className="md:h-7 md:w-auto md:gap-1 md:px-2.5"
            icon={DownloadIcon}
            aria-label={t("export")}
            disabled={disabled}
          >
            <span className="hidden md:inline">{t("export")}</span>
          </HoverIconButton>
        }
      />
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
        <PopoverHeader>
          <PopoverTitle>{t("export")}</PopoverTitle>
        </PopoverHeader>
        <div className="grid grid-cols-2 gap-1.5">
          {EXPORT_FORMATS.map((item) => (
            <FormatCard
              key={item}
              selected={format === item}
              icon={FORMAT_ICON[item]}
              label={t(`exportFormats.${item}`)}
              meta={t(`exportFormatMeta.${item}`)}
              onClick={() => setFormat(item)}
            />
          ))}
        </div>
        {format === ExportFormat.Png ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm">{t("collapseEmptyTime")}</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t("collapseEmptyTimeHint")}</p>
              </div>
              <Switch
                checked={collapseEmptyTime}
                onCheckedChange={(checked) => setSettings({ collapseEmptyTime: checked === true })}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("exportAspect")}</p>
              <div className="flex flex-col gap-1">
                {EXPORT_ASPECTS.map((aspect) => {
                  const ratio = EXPORT_ASPECT_RATIO[aspect];
                  const active = exportAspect === aspect;
                  const screenMeasured = exportScreenWidth > 0 && exportScreenHeight > 0;
                  const detail =
                    aspect === ExportAspect.Screen
                      ? screenMeasured
                        ? `${exportScreenWidth} × ${exportScreenHeight}`
                        : t("exportScreenTap")
                      : ratio
                        ? formatRatio(ratio)
                        : null;
                  return (
                    <button
                      key={aspect}
                      type="button"
                      className={cn(
                        "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        active && "bg-muted",
                      )}
                      onClick={() => selectAspect(aspect)}
                    >
                      <span>
                        {t(`exportAspects.${aspect}`)}
                        {detail ? <span className="ml-1.5 text-[11px] text-muted-foreground">{detail}</span> : null}
                      </span>
                      {active ? <CheckIcon className="size-4" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <HoverIconButton size="sm" className="w-full" icon={DownloadIcon} onClick={() => void downloadPng()}>
              {t("exportDownloadPng")}
            </HoverIconButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("exportCalendarHint")}</p>
            <HoverIconButton size="sm" className="w-full" icon={DownloadIcon} onClick={downloadIcs}>
              {t("exportDownloadIcs")}
            </HoverIconButton>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const FORMAT_ICON = {
  [ExportFormat.Png]: ImageIcon,
  [ExportFormat.Ics]: CalendarDaysIcon,
};

function FormatCard({
  selected,
  icon: Icon,
  label,
  meta,
  onClick,
}: {
  selected: boolean;
  icon: typeof ImageIcon;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors",
        selected ? "border-foreground bg-muted" : "border-transparent bg-muted/50 hover:bg-muted",
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{meta}</span>
    </button>
  );
}

function formatRatio(ratio: number): string {
  if (Math.abs(ratio - 9 / 16) < 0.001) return "9:16";
  if (Math.abs(ratio - 16 / 9) < 0.001) return "16:9";
  if (Math.abs(ratio - 16 / 10) < 0.001) return "16:10";
  if (Math.abs(ratio - 1) < 0.001) return "1:1";
  return ratio.toFixed(2);
}
