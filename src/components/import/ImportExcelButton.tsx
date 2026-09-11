import type { MouseEvent, PointerEvent } from "react";
import { useTranslation } from "react-i18next";

import { FileDescriptionIcon, QuestionMark } from "@/animations";
import { PAGE } from "@/assets/language";
import WorkdayExportHint from "@/components/import/WorkdayExportHint";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

function stopHelpEvent(event: MouseEvent | PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function ExcelHowHelp() {
  const { t } = useTranslation(PAGE.App);
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        closeDelay={400}
        closeOnClick={false}
        render={
          <span
            role="note"
            tabIndex={0}
            aria-label={t("excelHowTitle")}
            className="ml-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            data-icon="inline-end"
            onClick={stopHelpEvent}
            onPointerDown={stopHelpEvent}
          />
        }
      >
        <QuestionMark size={12} />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="block max-w-[min(22rem,calc(100vw-2rem))] bg-popover p-0 text-left text-popover-foreground shadow-md ring-1 ring-foreground/10"
        arrowClassName="bg-popover fill-popover"
      >
        <WorkdayExportHint className="border-0 bg-transparent" />
      </TooltipContent>
    </Tooltip>
  );
}

export default function ImportExcelButton({
  onClick,
  compact = false,
  className,
}: {
  onClick: () => void;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation(PAGE.App);
  return (
    <HoverIconButton
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
      icon={FileDescriptionIcon}
      aria-label={t("importExcel")}
      onClick={onClick}
    >
      {compact ? <span className="sr-only">{t("importExcel")}</span> : t("importExcel")}
      <ExcelHowHelp />
    </HoverIconButton>
  );
}
