import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import logoMark from "@/assets/logo_no_background.png";
import { APP_NAME } from "@/constants";
import { ROUTES } from "@/navigations";
import { cn } from "cn";

export default function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation("language");
  return (
    <Link to={ROUTES.HOME} className={cn("flex min-w-0 shrink items-center gap-2.5 text-foreground no-underline", className)}>
      <img
        src={logoMark}
        alt={APP_NAME}
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain dark:rounded-md dark:bg-white dark:p-0.5"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</span>
        {compact ? null : <span className="truncate text-[11px] text-muted-foreground">{t("logoTagline")}</span>}
      </span>
    </Link>
  );
}
