import { useTranslation } from "react-i18next";

import { FileDescriptionIcon, QuestionMark } from "@/animations";
import { PAGE } from "@/assets/language";
import WorkdayExportHint from "@/components/import/WorkdayExportHint";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

function ExcelHowHelp() {
  const { t } = useTranslation(PAGE.App);
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        closeDelay={400}
        closeOnClick={false}
        render={
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("excelHowTitle")}
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
  if (compact) {
    return (
      <HoverIconButton
        type="button"
        variant="outline"
        size="icon-sm"
        className={className}
        icon={FileDescriptionIcon}
        aria-label={t("importExcel")}
        onClick={onClick}
      />
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-0.5", className)}>
      <HoverIconButton
        type="button"
        variant="outline"
        size="sm"
        className="min-w-0 flex-1"
        icon={FileDescriptionIcon}
        aria-label={t("importExcel")}
        onClick={onClick}
      >
        {t("importExcel")}
      </HoverIconButton>
      <ExcelHowHelp />
    </div>
  );
}
