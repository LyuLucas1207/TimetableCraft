import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import MiniWeek from "@/components/marketing/MiniWeek";
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article className="flex min-h-[280px] flex-col justify-between rounded-2xl border bg-background p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold tracking-wide text-[#002145] uppercase dark:text-sky-300">{t("available")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{t("scheduleMakerName")}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("scheduleMakerBody")}</p>
              <div className="mt-5">
                <MiniWeek />
              </div>
            </div>
            <div className="mt-6">
              <HoverIconButton icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
                {t("openTool")}
              </HoverIconButton>
            </div>
          </article>
          <article className="flex min-h-[280px] flex-col justify-between rounded-2xl border bg-background p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold tracking-wide text-[#002145] uppercase dark:text-sky-300">{t("available")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{t("ubcName")}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("ubcBody")}</p>
            </div>
            <div className="mt-6">
              <HoverIconButton variant="outline" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.UBC_TIMETABLE_MAKER} />}>
                {t("ubcCta")}
              </HoverIconButton>
            </div>
          </article>
          <article className="flex min-h-[280px] flex-col justify-end rounded-2xl border border-dashed bg-muted/20 p-6">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t("comingSoonLabel")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-muted-foreground">{t("comingSoonName")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("comingSoonBody")}</p>
          </article>
        </div>
      </PageFrame>
    </>
  );
}
