import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon, UnorderedListIcon, UploadIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import MiniWeek from "@/components/marketing/MiniWeek";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, softwareJsonLd } from "@/utils/seo";

export default function UbcPage() {
  const { t } = useTranslation([PAGE.Ubc, LANG_NS]);
  const points = [
    ["importTitle", "importBody"],
    ["manualTitle", "manualBody"],
    ["gridTitle", "gridBody"],
  ] as const;
  const questions = [
    ["q1", "a1"],
    ["q2", "a2"],
    ["q3", "a3"],
  ] as const;
  const faqEntries = questions.map(([q, a]) => ({ question: t(q), answer: t(a) }));

  return (
    <>
      <Seo
        title={t("seoTitle")}
        description={t("seoDescription")}
        path={ROUTES.UBC_TIMETABLE_MAKER}
        jsonLd={[
          softwareJsonLd(
            t("seoDescription"),
            absoluteUrl(ROUTES.UBC_TIMETABLE_MAKER),
            t("appName"),
            ["UBC timetable maker", "UBC schedule maker", "UBC course table maker"],
          ),
          faqJsonLd(faqEntries, absoluteUrl(ROUTES.UBC_TIMETABLE_MAKER)),
          breadcrumbJsonLd([
            { name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME },
            { name: t("header.ubcTimetable", { ns: LANG_NS }), path: ROUTES.UBC_TIMETABLE_MAKER },
          ]),
        ]}
      />
      <MarketingHero kicker={t("kicker")} title={t("headline")} lead={t("lead")}>
        <HoverIconButton size="lg" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
          {t("ctaOpen")}
        </HoverIconButton>
        <HoverIconButton size="lg" variant="outline" icon={UploadIcon} nativeButton={false} render={<Link to={ROUTES.GUIDE} />}>
          {t("ctaGuide")}
        </HoverIconButton>
      </MarketingHero>

      <PageFrame maxWidth={1100} className="py-14 md:py-20">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("whatTitle")}</h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t("whatBody")}</p>
            <p className="mt-3 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t("whatMore")}</p>
          </div>
          <Link
            to={ROUTES.TOOL_SCHEDULE_MAKER}
            className="block rounded-2xl border bg-muted/30 p-4 no-underline shadow-sm transition-colors hover:bg-muted/50"
          >
            <MiniWeek />
            <p className="mt-3 text-sm font-medium text-foreground">{t("appName")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("previewHint")}</p>
          </Link>
        </div>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("howTitle")}</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {points.map(([title, body]) => (
              <article key={title}>
                <h3 className="text-lg font-semibold">{t(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{t(body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("diffTitle")}</h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-7 text-muted-foreground">{t("diffBody")}</p>
          <div className="mt-6">
            <HoverIconButton variant="outline" icon={UnorderedListIcon} nativeButton={false} render={<Link to={ROUTES.TOOLS} />}>
              {t("ctaTools")}
            </HoverIconButton>
          </div>
        </section>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("faqTitle")}</h2>
          {questions.map(([q, a]) => (
            <article key={q} className="mt-6 border-t pt-6 first:border-t-0 first:pt-0">
              <h3 className="text-lg font-semibold">{t(q)}</h3>
              <p className="mt-2 max-w-[52ch] text-sm leading-7 text-muted-foreground">{t(a)}</p>
            </article>
          ))}
        </section>

        <nav aria-label={t("helpTitle")} className="mt-10 flex flex-wrap gap-6 border-t pt-6 text-sm underline underline-offset-4">
          <Link to={ROUTES.GUIDE}>{t("ctaGuide")}</Link>
          <Link to={ROUTES.FAQ}>{t("faqLink")}</Link>
          <Link to={ROUTES.HOME}>{t("homeLink")}</Link>
        </nav>
      </PageFrame>
    </>
  );
}
