import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GearIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppLanguage } from "@/config";
import { useTheme } from "@/providers/ThemeProvider";
import { ThemeMode } from "@/types/course";

const LANGUAGES = [
  { id: AppLanguage.En, labelKey: "languageSwitcher.english" },
  { id: AppLanguage.Zh, labelKey: "languageSwitcher.chinese" },
  { id: AppLanguage.Fr, labelKey: "languageSwitcher.french" },
];

export default function PreferencesPopover() {
  const { t, i18n } = useTranslation("language");
  const { theme, setTheme } = useTheme();
  const currentLng = (i18n.resolvedLanguage ?? AppLanguage.En).slice(0, 2) as AppLanguage;

  return (
    <Popover>
      <PopoverTrigger render={<HoverIconButton variant="outline" size="icon" icon={GearIcon} aria-label={t("header.preferences")} />} />
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t("header.appearance")}</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {[ThemeMode.Light, ThemeMode.Dark, ThemeMode.System].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-md px-2 py-1.5 text-xs font-medium ${theme === value ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                  onClick={() => setTheme(value)}
                >
                  {t(`header.appearanceMode.${value}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("header.language")}</p>
            <div className="flex flex-col gap-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => void i18n.changeLanguage(item.id)}
                >
                  {t(item.labelKey)}
                  {currentLng === item.id ? <CheckIcon className="size-4" /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
