import { useTranslation } from "react-i18next";

import { LANG_NS } from "@/assets/language";
import { TITLE_PRESETS, TitlePreset, termFromTitlePreset, type Term, type TimetableSettings } from "@/types/course";
import { TITLE_PRESET_I18N_KEY } from "@/utils/appearance";

interface TitlePickerProps {
  settings: TimetableSettings;
  selectedTerm: Term;
  onSelectPreset: (preset: TitlePreset) => void;
}

export default function TitlePicker({ settings, selectedTerm, onSelectPreset }: TitlePickerProps) {
  const { t } = useTranslation(LANG_NS);

  return (
    <div className="min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 [scrollbar-width:thin]">
      <div className="flex w-max flex-nowrap items-center gap-1.5">
        {TITLE_PRESETS.map((preset) => {
          const active =
            settings.titlePreset === preset ||
            (settings.titlePreset === TitlePreset.Custom && termFromTitlePreset(preset) === selectedTerm);
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
      </div>
    </div>
  );
}
