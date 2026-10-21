import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { APP_NAME } from "@/constants";
import { PLANNERS, plannerPath } from "@/config/planners";
import { ROUTES } from "@/navigations";

export default function Footer() {
  const { t } = useTranslation(["language", "pages.Planner"]);
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("footer.tag")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to={ROUTES.TOOL_SCHEDULE_MAKER}>{t("className", { ns: "pages.Planner" })}</Link>
          {PLANNERS.map((planner) => <Link key={planner.id} to={plannerPath(planner)}>{t(`tools.${planner.id}.maker`, { ns: "pages.Planner" })}</Link>)}
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
