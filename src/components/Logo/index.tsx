import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import logoMark from "@/assets/logo_no_background.png";
import { APP_NAME } from "@/constants";
import { ROUTES } from "@/navigations";

export default function Logo() {
  const { t } = useTranslation("language");
  return (
    <Link to={ROUTES.HOME} className="flex min-w-0 shrink items-center gap-2.5 text-foreground no-underline">
      <img
        src={logoMark}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain dark:rounded-md dark:bg-white dark:p-0.5"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</span>
        <span className="truncate text-[11px] text-muted-foreground">{t("logoTagline")}</span>
      </span>
    </Link>
  );
}
