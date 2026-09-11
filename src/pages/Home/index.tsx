import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon, UnorderedListIcon, UploadIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import logoMark from "@/assets/logo_no_background.png";
import MiniWeek from "@/components/marketing/MiniWeek";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { APP_NAME } from "@/constants";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";

export default function HomePage() {
  const { t } = useTranslation(PAGE.Home);
  const how = [
    ["how1", "how1b"],
    ["how2", "how2b"],
    ["how3", "how3b"],
  ] as const;

  return (
    <>
      <Seo title={t("seoTitle")} description={t("seoDescription")} path={ROUTES.HOME} />
      <MarketingHero kicker={t("kicker")} title={t("headline")} lead={t("support")}>
        <HoverIconButton size="lg" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
          {t("ctaOpen")}
        </HoverIconButton>
        <HoverIconButton size="lg" variant="outline" icon={UnorderedListIcon} nativeButton={false} render={<Link to={ROUTES.TOOLS} />}>
          {t("ctaTools")}
        </HoverIconButton>
      </MarketingHero>

      <PageFrame maxWidth={1100} className="py-14 md:py-20">
        <p className="text-xs font-bold tracking-wide text-[#002145] uppercase dark:text-sky-300">{t("featuredLabel")}</p>
        <div className="mt-4 grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[280px] flex-col justify-end">
            <img src={logoMark} alt="" width={48} height={48} className="mb-3 size-12 object-contain dark:rounded-lg dark:bg-white dark:p-1" />
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
      </PageFrame>
    </>
  );
}
