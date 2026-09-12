import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ExpandIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useScheduleStore } from "@/stores";
import { ExportAspect, EXPORT_ASPECTS, EXPORT_ASPECT_RATIO } from "@/types/course";
import { measureScreenSize } from "@/utils/exportImage";

export default function ExportOptionsPopover() {
  const { t } = useTranslation(PAGE.App);
  const collapseEmptyTime = useScheduleStore((s) => s.settings.collapseEmptyTime);
  const exportAspect = useScheduleStore((s) => s.settings.exportAspect);
  const exportScreenWidth = useScheduleStore((s) => s.settings.exportScreenWidth);
  const exportScreenHeight = useScheduleStore((s) => s.settings.exportScreenHeight);
  const setSettings = useScheduleStore((s) => s.setSettings);

  const selectAspect = (aspect: ExportAspect) => {
    if (aspect === ExportAspect.Screen) {
      const { width, height } = measureScreenSize();
      setSettings({ exportAspect: aspect, exportScreenWidth: width, exportScreenHeight: height });
      return;
    }
    setSettings({ exportAspect: aspect });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <HoverIconButton
            variant="outline"
            size="icon-sm"
            className="md:size-8"
            icon={ExpandIcon}
            aria-label={t("exportOptions")}
          />
        }
      />
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <PopoverHeader>
          <PopoverTitle>{t("exportOptions")}</PopoverTitle>
        </PopoverHeader>
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
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      active ? "bg-muted" : ""
                    }`}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatRatio(ratio: number): string {
  if (Math.abs(ratio - 9 / 16) < 0.001) return "9:16";
  if (Math.abs(ratio - 16 / 9) < 0.001) return "16:9";
  if (Math.abs(ratio - 16 / 10) < 0.001) return "16:10";
  if (Math.abs(ratio - 1) < 0.001) return "1:1";
  return ratio.toFixed(2);
}
