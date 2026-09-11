import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon, UnorderedListIcon, UploadIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import logoMark from "@/assets/logo_no_background.png";
import CampusInvite from "@/components/marketing/CampusInvite";
import MiniWeek from "@/components/marketing/MiniWeek";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { APP_NAME } from "@/constants";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { absoluteUrl, breadcrumbJsonLd, softwareJsonLd } from "@/utils/seo";

export default function HomePage() {
  const { t } = useTranslation([PAGE.Home, LANG_NS]);
  const how = [
    ["how1", "how1b"],
    ["how2", "how2b"],
    ["how3", "how3b"],
  ] as const;

  return (
    <>
      <Seo
        title={t("seoTitle")}
        description={t("seoDescription")}
        path={ROUTES.HOME}
        jsonLd={[
          softwareJsonLd(
            t("seoDescription"),
            absoluteUrl(ROUTES.HOME),
            `${APP_NAME} Timetable Maker`,
            ["timetable maker", "schedule maker", "course table maker"],
          ),
          breadcrumbJsonLd([{ name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME }]),
        ]}
      />
      <MarketingHero kicker={t("kicker")} title={t("headline")} lead={t("support")}>
        <HoverIconButton size="lg" className="w-full sm:w-auto" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
          {t("ctaOpen")}
        </HoverIconButton>
        <HoverIconButton size="lg" className="w-full sm:w-auto" variant="outline" icon={UnorderedListIcon} nativeButton={false} render={<Link to={ROUTES.TOOLS} />}>
          {t("ctaTools")}
        </HoverIconButton>
      </MarketingHero>

      <PageFrame maxWidth={1100} className="py-14 md:py-20">
        <p className="text-xs font-bold tracking-wide text-[#002145] uppercase dark:text-sky-300">{t("featuredLabel")}</p>
        <div className="mt-4 grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[280px] flex-col justify-end">
            <img src={logoMark} alt={`${APP_NAME} timetable maker`} width={48} height={48} className="mb-3 size-12 object-contain dark:rounded-lg dark:bg-white dark:p-1" />
            <p className="text-sm text-muted-foreground">{APP_NAME}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("featuredName")}</h2>
            <p className="mt-3 max-w-[46ch] text-sm leading-7 text-muted-foreground">{t("featuredBody")}</p>
            <div className="mt-6">
              <HoverIconButton icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
                {t("ctaOpen")}
              </HoverIconButton>
            </div>
          </div>
          <Link
            to={ROUTES.TOOL_SCHEDULE_MAKER}
            className="block rounded-2xl border bg-muted/30 p-4 no-underline shadow-sm transition-colors hover:bg-muted/50"
          >
            <MiniWeek />
            <p className="mt-3 text-sm font-medium text-foreground">{t("featuredName")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("privacyBadge")}</p>
          </Link>
        </div>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("useTitle")}</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <article>
              <h3 className="text-lg font-semibold">{t("manualTitle")}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("manualBody")}</p>
            </article>
            <article>
              <h3 className="text-lg font-semibold">{t("ubcTitle")}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("ubcBody")}</p>
              <Link className="mt-3 inline-block text-sm underline underline-offset-4" to={ROUTES.UBC_TIMETABLE_MAKER}>{t("ubcLink")}</Link>
            </article>
          </div>
        </section>

        <CampusInvite className="mt-16" />

        <h2 className="mt-20 text-2xl font-semibold tracking-tight">{t("excelHowTitle")}</h2>
        <ol className="mt-6">
          {(["excelHow1", "excelHow2", "excelHow3"] as const).map((key, index) => (
            <li key={key} className="border-t py-6">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{index + 1}</p>
              <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t(key)}</p>
            </li>
          ))}
        </ol>
        <div className="mt-2">
          <HoverIconButton variant="outline" icon={UploadIcon} nativeButton={false} render={<Link to={ROUTES.GUIDE} />}>
            {t("ctaGuide")}
          </HoverIconButton>
        </div>

        <h2 className="mt-20 text-2xl font-semibold tracking-tight">{t("howTitle")}</h2>
        <ol className="mt-6">
          {how.map(([title, body], index) => (
            <li key={title} className="border-t py-6">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{t(title)}</h3>
              <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t(body)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t py-10">
          <h2 className="text-2xl font-semibold tracking-tight">{t("privacyTitle")}</h2>
          <p className="mt-3 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t("privacyBody")}</p>
          <div className="mt-6">
            <HoverIconButton variant="outline" icon={UploadIcon} nativeButton={false} render={<Link to={ROUTES.GUIDE} />}>
              {t("ctaGuide")}
            </HoverIconButton>
          </div>
        </div>
        <nav aria-label={t("helpTitle")} className="flex flex-wrap gap-6 border-t pt-6 text-sm underline underline-offset-4">
          <Link to={ROUTES.GUIDE}>{t("ctaGuide")}</Link>
          <Link to={ROUTES.FAQ}>{t("faqLink")}</Link>
          <Link to={ROUTES.UBC_TIMETABLE_MAKER}>{t("ubcLink")}</Link>
        </nav>
      </PageFrame>
    </>
  );
}
