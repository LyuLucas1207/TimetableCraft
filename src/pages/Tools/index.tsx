import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import CampusInvite from "@/components/marketing/CampusInvite";
import ToolCatalog from "@/components/marketing/ToolCatalog";
import WorkdayExportHint from "@/components/import/WorkdayExportHint";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { absoluteUrl, breadcrumbJsonLd, collectionJsonLd, softwareJsonLd } from "@/utils/seo";

export default function ToolsPage() {
  const { t } = useTranslation([PAGE.Tools, LANG_NS]);

  return (
    <>
      <Seo
        title={t("seoTitle")}
        description={t("seoDescription")}
        path={ROUTES.TOOLS}
        jsonLd={[
          collectionJsonLd(t("seoTitle"), t("seoDescription"), absoluteUrl(ROUTES.TOOLS)),
          softwareJsonLd(t("scheduleMakerSeoDescription"), absoluteUrl(ROUTES.TOOL_SCHEDULE_MAKER), t("scheduleMakerName")),
          breadcrumbJsonLd([
            { name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME },
            { name: t("header.tools", { ns: LANG_NS }), path: ROUTES.TOOLS },
          ]),
        ]}
      />
      <MarketingHero title={t("title")} lead={t("lead")} />
      <PageFrame maxWidth={1100} className="py-12 md:py-16">
        <ToolCatalog />
        <aside className="mt-10 rounded-2xl border bg-muted/20 p-6">
          <h2 className="text-xl font-semibold">{t("ubcName")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("ubcBody")}</p>
          <WorkdayExportHint className="my-4" />
          <HoverIconButton variant="outline" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.UBC_TIMETABLE_MAKER} />}>{t("ubcCta")}</HoverIconButton>
        </aside>
        <CampusInvite className="mt-10" />
      </PageFrame>
    </>
  );
}
