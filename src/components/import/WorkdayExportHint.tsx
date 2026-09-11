import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { LANG_NS, PAGE } from "@/assets/language";
import { ROUTES } from "@/navigations";
import { cn } from "cn";

export default function WorkdayExportHint({ className }: { className?: string }) {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  return (
    <div className={cn("rounded-xl border bg-muted/30 px-3 py-3 text-left", className)}>
      <p className="text-sm font-medium text-foreground">{t("excelHowTitle", { ns: PAGE.App })}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-6 text-muted-foreground">
        <li>{t("excelHow1", { ns: PAGE.App })}</li>
        <li>{t("excelHow2", { ns: PAGE.App })}</li>
        <li>{t("excelHow3", { ns: PAGE.App })}</li>
      </ol>
      <Link
        to={ROUTES.GUIDE}
        className="mt-2 inline-block text-sm font-medium text-foreground underline-offset-2 hover:underline"
      >
        {t("excelHowMore", { ns: PAGE.App })}
      </Link>
    </div>
  );
}
