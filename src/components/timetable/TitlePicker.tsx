import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LANG_NS } from "@/assets/language";
import { TITLE_PRESETS, TitlePreset, type TimetableSettings } from "@/types/course";
import { TITLE_PRESET_I18N_KEY } from "@/utils/appearance";

interface TitlePickerProps {
  settings: TimetableSettings;
  onSelectPreset: (preset: TitlePreset) => void;
  onSelectCustom: (id: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (id: string) => void;
}

export default function TitlePicker({
  settings,
  onSelectPreset,
  onSelectCustom,
  onAddCustom,
  onRemoveCustom,
}: TitlePickerProps) {
  const { t } = useTranslation(LANG_NS);
  const customTimetables = settings.customTimetables ?? [];

  return (
    <div className="min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 [scrollbar-width:thin]">
      <div className="flex w-max flex-nowrap items-center gap-1.5">
        {TITLE_PRESETS.map((preset) => {
          const active = settings.titlePreset === preset;
          return (
            <button
              key={preset}
              type="button"
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
                active ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSelectPreset(preset)}
            >
              {t(TITLE_PRESET_I18N_KEY[preset])}
            </button>
          );
        })}
        {customTimetables.map((timetable) => {
          const active = settings.titlePreset === TitlePreset.Custom && settings.activeCustomId === timetable.id;
          return (
            <div
              key={timetable.id}
              className={`inline-flex shrink-0 items-center rounded-full ${
                active ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground"
              }`}
            >
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium whitespace-nowrap"
                onClick={() => onSelectCustom(timetable.id)}
              >
                {timetable.title}
              </button>
              <button
                type="button"
                className="rounded-full p-1.5 hover:bg-background/15"
                aria-label={t("common.removeTimetable")}
                onClick={() => onRemoveCustom(timetable.id)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("common.addTimetable")}
          onClick={onAddCustom}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
