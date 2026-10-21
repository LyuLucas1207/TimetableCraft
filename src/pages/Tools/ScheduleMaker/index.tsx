import { Link } from "react-router";
import { ArrowNarrowLeftIcon } from "@/animations";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { useTranslation } from "react-i18next";

import { LANG_NS, PAGE } from "@/assets/language";
import Seo from "@/components/Seo";
import ScheduleWorkspace from "@/components/schedule/ScheduleWorkspace";
import ModalProvider from "@/providers/ModalProvider";
import { PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { absoluteUrl, breadcrumbJsonLd, softwareJsonLd } from "@/utils/seo";

export default function ScheduleMakerPage() {
  const { t } = useTranslation([PAGE.Tools, LANG_NS]);
  return (
    <ModalProvider>
    <PageFrame className="flex h-full min-h-0 flex-col overflow-hidden px-3 py-3 md:px-6 md:py-5" maxWidth={1680}>
      <Seo
        title={t("scheduleMakerSeoTitle")}
        description={t("scheduleMakerSeoDescription")}
        path={ROUTES.TOOL_SCHEDULE_MAKER}
        jsonLd={[
          softwareJsonLd(
            t("scheduleMakerSeoDescription"),
            absoluteUrl(ROUTES.TOOL_SCHEDULE_MAKER),
            t("scheduleMakerName"),
            ["timetable maker", "class timetable maker", "school timetable maker", "schedule maker", "course table maker"],
          ),
          breadcrumbJsonLd([
            { name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME },
            { name: t("header.tools", { ns: LANG_NS }), path: ROUTES.TOOLS },
            { name: t("scheduleMakerName"), path: ROUTES.TOOL_SCHEDULE_MAKER },
          ]),
        ]}
      />
      <header className="mb-3 shrink-0">
        <HoverIconButton className="mb-2" icon={ArrowNarrowLeftIcon} variant="outline" size="sm" nativeButton={false} render={<Link to={ROUTES.TOOLS} />}>{t("header.tools", { ns: LANG_NS })}</HoverIconButton>
        <h1 className="text-lg font-semibold">{t("scheduleMakerHeading")}</h1>
        <p className="text-xs text-muted-foreground">{t("scheduleMakerIntro")}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScheduleWorkspace />
      </div>
    </PageFrame>
    </ModalProvider>
  );
}
