import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ExpandIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useScheduleStore } from "@/stores";
import { EXPORT_ASPECTS, EXPORT_ASPECT_RATIO } from "@/types/course";

export default function ExportOptionsPopover() {
  const { t } = useTranslation(PAGE.App);
  const collapseEmptyTime = useScheduleStore((s) => s.settings.collapseEmptyTime);
  const exportAspect = useScheduleStore((s) => s.settings.exportAspect);
  const setSettings = useScheduleStore((s) => s.setSettings);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <HoverIconButton
            variant="outline"
            size="icon"
            icon={ExpandIcon}
            aria-label={t("exportOptions")}
          />
        }
      />
      <PopoverContent align="end" className="w-80">
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
                return (
                  <button
                    key={aspect}
                    type="button"
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      active ? "bg-muted" : ""
                    }`}
                    onClick={() => setSettings({ exportAspect: aspect })}
                  >
                    <span>
                      {t(`exportAspects.${aspect}`)}
                      {ratio ? (
                        <span className="ml-1.5 text-[11px] text-muted-foreground">{formatRatio(ratio)}</span>
                      ) : null}
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
