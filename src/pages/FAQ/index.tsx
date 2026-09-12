import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { GmailIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import { WorkdayExcelShots, WorkdayHomeShot } from "@/components/import/WorkdayExportFigures";
import CampusInvite from "@/components/marketing/CampusInvite";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/constants";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from "@/utils/seo";

export default function FAQPage() {
  const { t } = useTranslation([PAGE.FAQ, LANG_NS]);
  const items = [
    ["q1", "a1"],
    ["q9", "a9"],
    ["q2", "a2"],
    ["q3", "a3"],
    ["q4", "a4"],
    ["q5", "a5"],
    ["q6", "a6"],
    ["q7", "a7"],
    ["q8", "a8"],
    ["q10", "a10"],
  ] as const;

  return (
    <>
      <Seo
        title={t("seoTitle")}
        description={t("seoDescription")}
        path={ROUTES.FAQ}
        jsonLd={[
          faqJsonLd(
            items.map(([q, a]) => ({ question: t(q), answer: t(a) })),
            absoluteUrl(ROUTES.FAQ),
          ),
          breadcrumbJsonLd([
            { name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME },
            { name: t("header.faq", { ns: LANG_NS }), path: ROUTES.FAQ },
          ]),
        ]}
      />
      <MarketingHero title={t("title")} lead={t("lead")} />
      <PageFrame maxWidth={1100} className="py-12 md:py-16">
        {items.map(([q, a]) => (
          <article key={q} className="border-t py-8">
            <h2 className="text-lg font-semibold">{t(q)}</h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-7 text-muted-foreground">{t(a)}</p>
            {q === "q9" ? (
              <div className="mt-5 space-y-4">
                <WorkdayHomeShot />
                <WorkdayExcelShots />
                <Link to={ROUTES.GUIDE} className="inline-block text-sm underline underline-offset-4">
                  {t("guideLink")}
                </Link>
              </div>
            ) : null}
            {q === "q7" ? (
              <Link to={ROUTES.UBC_TIMETABLE_MAKER} className="mt-3 inline-block text-sm underline underline-offset-4">
                {t("ubcLink")}
              </Link>
            ) : null}
          </article>
        ))}
        <CampusInvite className="my-4" />
        <section className="border-t py-8">
          <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
          <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">
            {t("contactBody", { email: CONTACT_EMAIL })}
          </p>
          <div className="mt-4">
            <HoverIconButton icon={GmailIcon} nativeButton={false} render={<a href={CONTACT_MAILTO} />}>
              {t("contactCta")}
            </HoverIconButton>
          </div>
        </section>
      </PageFrame>
    </>
  );
}
