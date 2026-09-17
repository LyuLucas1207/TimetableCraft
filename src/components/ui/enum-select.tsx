import { cn } from "cn";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface EnumSelectOption<T extends string | number> {
  value: T;
  label: string;
}

export function EnumSelect<T extends string | number>({
  value,
  onChange,
  options,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly EnumSelectOption<T>[] | EnumSelectOption<T>[];
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const items = options.map((option) => ({ value: option.value, label: option.label }));

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next == null) return;
        onChange(next as T);
      }}
      items={items}
      modal={false}
      id={id}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn("w-full min-w-0", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-(--anchor-width)">
        {options.map((option) => (
          <SelectItem key={String(option.value)} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
