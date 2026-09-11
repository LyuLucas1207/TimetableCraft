import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon, GmailIcon, UnorderedListIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/constants";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";
import { breadcrumbJsonLd, contactJsonLd } from "@/utils/seo";

export default function AboutPage() {
  const { t } = useTranslation([PAGE.About, LANG_NS]);
  const pillars = [
    ["p1", "p1b"],
    ["p2", "p2b"],
    ["p3", "p3b"],
  ] as const;

  return (
    <>
      <Seo
        title={t("seoTitle")}
        description={t("seoDescription")}
        path={ROUTES.CONTACT}
        jsonLd={[
          contactJsonLd(t("seoTitle"), t("seoDescription")),
          breadcrumbJsonLd([
            { name: t("header.home", { ns: LANG_NS }), path: ROUTES.HOME },
            { name: t("header.contact", { ns: LANG_NS }), path: ROUTES.CONTACT },
          ]),
        ]}
      />
      <MarketingHero title={t("title")} lead={t("lead")} />
      <PageFrame maxWidth={1100} className="py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="max-w-[48ch] text-lg leading-8">{t("body")}</p>
            <p className="mt-4 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t("bodyMore")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HoverIconButton icon={UnorderedListIcon} nativeButton={false} render={<Link to={ROUTES.TOOLS} />}>
                {t("ctaTools")}
              </HoverIconButton>
              <HoverIconButton variant="outline" icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.GUIDE} />}>
                {t("ctaGuide")}
              </HoverIconButton>
            </div>
          </div>
          <div>
            {pillars.map(([title, body]) => (
              <section key={title} className="border-t py-5">
                <h2 className="text-lg font-semibold">{t(title)}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{t(body)}</p>
              </section>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-10 border-t py-10 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold">{t("privacyTitle")}</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t("privacyBody")}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">
              {t("contactBody", { email: CONTACT_EMAIL })}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <HoverIconButton icon={GmailIcon} nativeButton={false} render={<a href={CONTACT_MAILTO} />}>
                {t("contactCta")}
              </HoverIconButton>
              <a href={CONTACT_MAILTO} className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>
        </div>
      </PageFrame>
    </>
  );
}
