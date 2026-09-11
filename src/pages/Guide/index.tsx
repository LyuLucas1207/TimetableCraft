import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "@/animations";
import { PAGE } from "@/assets/language";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";

export default function GuidePage() {
  const { t } = useTranslation(PAGE.Guide);
  const steps = [
    ["step1", "step1b"],
    ["step2", "step2b"],
    ["step3", "step3b"],
    ["step4", "step4b"],
  ] as const;

  return (
    <>
      <Seo title={t("seoTitle")} description={t("seoDescription")} path={ROUTES.GUIDE} />
      <MarketingHero title={t("title")} lead={t("lead")} />
      <PageFrame maxWidth={800} className="py-12 md:py-16">
        <ol>
          {steps.map(([title, body], index) => (
            <li key={title} className="border-t py-8">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{index + 1}</p>
              <h2 className="mt-2 text-xl font-semibold">{t(title)}</h2>
              <p className="mt-2 max-w-[48ch] text-sm leading-7 text-muted-foreground">{t(body)}</p>
            </li>
          ))}
        </ol>
        <p className="border-t py-8 text-sm leading-7 text-muted-foreground">{t("note")}</p>
        <HoverIconButton icon={ClockIcon} nativeButton={false} render={<Link to={ROUTES.TOOL_SCHEDULE_MAKER} />}>
          {t("ctaOpen")}
        </HoverIconButton>
      </PageFrame>
    </>
  );
}
