import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { APP_NAME } from "@/constants";
import { ROUTES } from "@/navigations";

export default function Footer() {
  const { t } = useTranslation("language");
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("footer.tag")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to={ROUTES.UBC_TIMETABLE_MAKER}>{t("header.ubcTimetable")}</Link>
          <Link to={ROUTES.TOOLS}>{t("header.tools")}</Link>
          <Link to={ROUTES.GUIDE}>{t("header.guide")}</Link>
          <Link to={ROUTES.FAQ}>{t("header.faq")}</Link>
          <Link to={ROUTES.CONTACT}>{t("header.contact")}</Link>
        </div>
      </div>
    </footer>
  );
}
