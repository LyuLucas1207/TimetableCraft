import { useTranslation } from "react-i18next";

import { GmailIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/constants";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";

export default function FAQPage() {
  const { t } = useTranslation(PAGE.FAQ);
  const items = [
    ["q1", "a1"],
    ["q2", "a2"],
    ["q3", "a3"],
    ["q4", "a4"],
    ["q5", "a5"],
  ] as const;

  return (
    <>
      <Seo title={t("seoTitle")} description={t("seoDescription")} path={ROUTES.FAQ} />
      <MarketingHero title={t("title")} lead={t("lead")} />
      <PageFrame maxWidth={800} className="py-12 md:py-16">
        {items.map(([q, a]) => (
          <article key={q} className="border-t py-8">
            <h2 className="text-lg font-semibold">{t(q)}</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t(a)}</p>
          </article>
        ))}
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
