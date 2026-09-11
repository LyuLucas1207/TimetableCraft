import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { PenIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import { EnumSelect } from "@/components/ui/enum-select";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ColorPreset, GridInterval, TimetableTheme, type TimetableSettings } from "@/types/course";
import { toTimeInputValue } from "@/utils/time";

interface AppearanceEditorProps {
  settings: TimetableSettings;
  onChange: (patch: Partial<TimetableSettings>) => void;
  onTheme: (theme: TimetableTheme) => void;
  onColorPreset: (preset: ColorPreset) => void;
}

export default function AppearanceEditor({
  settings,
  onChange,
  onTheme,
  onColorPreset,
}: AppearanceEditorProps) {
  const { t } = useTranslation([PAGE.App, "language"]);
  return (
    <div className="flex flex-col gap-5">
      <Section title={t("appearanceTitle")}>
        <Field label={t("subtitle")}>
          <Input value={settings.subtitle} onChange={(event) => onChange({ subtitle: event.target.value })} placeholder={t("optional")} />
        </Field>
        <SizeField label={t("sizeTitle")} value={settings.titleFontSize} min={14} max={40} onChange={(titleFontSize) => onChange({ titleFontSize })} />
        <SizeField label={t("sizeSubtitle")} value={settings.subtitleFontSize} min={10} max={22} onChange={(subtitleFontSize) => onChange({ subtitleFontSize })} />
        <SizeField label={t("sizeBrand")} value={settings.kickerFontSize} min={8} max={16} onChange={(kickerFontSize) => onChange({ kickerFontSize })} />
        <ToggleRow label={t("showBrand")} checked={settings.showBrand} onChange={(showBrand) => onChange({ showBrand })} />
        <ToggleRow label={t("showCredits")} checked={settings.showCredits} onChange={(showCredits) => onChange({ showCredits })} />
      </Section>

      <Section title={t("appearanceColors")}>
        <Field label={t("theme")}>
          <EnumSelect
            value={settings.theme}
            onChange={onTheme}
            options={[
              { value: TimetableTheme.Clean, label: t("themeClean") },
              { value: TimetableTheme.Soft, label: t("themeSoft") },
              { value: TimetableTheme.Minimal, label: t("themeMinimal") },
              { value: TimetableTheme.Classic, label: t("themeClassic") },
            ]}
          />
        </Field>
        <ColorField label={t("colorHeaderBg")} value={settings.headerBg} onChange={(headerBg) => onChange({ headerBg })} />
        <ColorField label={t("colorHeaderText")} value={settings.headerText} onChange={(headerText) => onChange({ headerText })} />
        <ColorField label={t("colorBrand")} value={settings.kickerColor} onChange={(kickerColor) => onChange({ kickerColor })} />
        <ColorField label={t("colorPage")} value={settings.pageBg} onChange={(pageBg) => onChange({ pageBg })} />
        <ColorField label={t("colorDayBg")} value={settings.dayHeaderBg} onChange={(dayHeaderBg) => onChange({ dayHeaderBg })} />
        <ColorField label={t("colorDayText")} value={settings.dayHeaderText} onChange={(dayHeaderText) => onChange({ dayHeaderText })} />
        <ColorField label={t("colorGrid")} value={settings.gridLine} onChange={(gridLine) => onChange({ gridLine })} />
        <ColorField label={t("colorTimeBg")} value={settings.timeBg} onChange={(timeBg) => onChange({ timeBg })} />
        <ColorField label={t("colorTime")} value={settings.timeText} onChange={(timeText) => onChange({ timeText })} />
        <ColorField label={t("colorFooter")} value={settings.footerColor} onChange={(footerColor) => onChange({ footerColor })} />
      </Section>

      <Section title={t("appearanceGrid")}>
        <Field label={t("interval")}>
          <EnumSelect
            value={settings.intervalMinutes}
            onChange={(intervalMinutes) => onChange({ intervalMinutes })}
            options={[
              { value: GridInterval.Fifteen, label: t("interval15") },
              { value: GridInterval.Thirty, label: t("interval30") },
              { value: GridInterval.Sixty, label: t("interval60") },
              { value: GridInterval.OneTwenty, label: t("interval120") },
            ]}
          />
        </Field>
        <Field label={t("startTime")}>
          <Input
            type="time"
            step={900}
            value={toTimeInputValue(settings.startTime)}
            onChange={(event) => onChange({ startTime: toTimeInputValue(event.target.value) || settings.startTime, autoBounds: false })}
          />
        </Field>
        <Field label={t("endTime")}>
          <Input
            type="time"
            step={900}
            value={toTimeInputValue(settings.endTime)}
            onChange={(event) => onChange({ endTime: toTimeInputValue(event.target.value) || settings.endTime, autoBounds: false })}
          />
        </Field>
        <ToggleRow label={t("autoBounds")} checked={settings.autoBounds} onChange={(autoBounds) => onChange({ autoBounds })} />
        <ToggleRow label={t("collapseEmptyTime")} checked={settings.collapseEmptyTime} onChange={(collapseEmptyTime) => onChange({ collapseEmptyTime })} />
        <SizeField label={t("sizeBlockTitle")} value={settings.blockTitleFontSize} min={9} max={18} onChange={(blockTitleFontSize) => onChange({ blockTitleFontSize })} />
        <SizeField label={t("sizeBlockMeta")} value={settings.blockMetaFontSize} min={8} max={14} onChange={(blockMetaFontSize) => onChange({ blockMetaFontSize })} />
        <SizeField label={t("cornerRadius")} value={settings.cornerRadius} min={0} max={18} onChange={(cornerRadius) => onChange({ cornerRadius })} />
      </Section>

      <Section title={t("appearanceBlocks")}>
        <ToggleRow label={t("showTitles")} checked={settings.showTitles} onChange={(showTitles) => onChange({ showTitles })} />
        <ToggleRow label={t("showRooms")} checked={settings.showRooms} onChange={(showRooms) => onChange({ showRooms })} />
        <ToggleRow label={t("showSections")} checked={settings.showSections} onChange={(showSections) => onChange({ showSections })} />
        <Field label={t("colorPreset")}>
          <EnumSelect
            value={settings.colorPreset}
            onChange={onColorPreset}
            options={[
              { value: ColorPreset.Pastel, label: t("presetPastel") },
              { value: ColorPreset.Ubc, label: t("presetUbc") },
              { value: ColorPreset.Ocean, label: t("presetOcean") },
              { value: ColorPreset.Sunset, label: t("presetSunset") },
              { value: ColorPreset.Forest, label: t("presetForest") },
              { value: ColorPreset.Mono, label: t("presetMono") },
            ]}
          />
        </Field>
      </Section>

      <Section title={t("appearanceFooter")}>
        <ToggleRow label={t("showFooter")} checked={settings.showFooter} onChange={(showFooter) => onChange({ showFooter })} />
        <Field label={t("footerText")}>
          <Input value={settings.footerText} onChange={(event) => onChange({ footerText: event.target.value })} />
        </Field>
      </Section>
    </div>
  );
}

export function RegionEdit({
  title,
  children,
  align = "start",
  className,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <HoverIconButton
            type="button"
            variant="ghost"
            size="icon-sm"
            icon={PenIcon}
            className={cn("overflow-visible text-current opacity-70 hover:bg-black/10 hover:opacity-100", className)}
            aria-label={title}
          />
        }
      />
      <PopoverContent align={align} className={cn("w-80 max-w-[calc(100vw-2rem)] overflow-x-hidden", contentClassName)}>
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        <div className="flex min-w-0 flex-col gap-3 overflow-x-hidden">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <Label className="min-w-0 shrink text-xs">{label}</Label>
      <div className="flex shrink-0 items-center gap-2">
        <input type="color" value={toColorInput(value)} onChange={(event) => onChange(event.target.value)} className="size-7 cursor-pointer rounded border bg-transparent p-0" />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-7 w-[5.5rem] px-2 font-mono text-[11px]" />
      </div>
    </div>
  );
}

export function SizeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-[11px] text-muted-foreground">{value}px</span>
      </div>
      <div className="min-w-0 overflow-hidden">
        <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="block min-w-0 w-full max-w-full accent-foreground" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function toColorInput(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}
