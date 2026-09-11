import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { HomeIcon } from "@/animations";
import { LANG_NS } from "@/assets/language";
import Seo from "@/components/Seo";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { MarketingHero, PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";

export default function NotFoundPage() {
  const { t } = useTranslation(LANG_NS);

  return (
    <>
      <Seo title={t("notFound.seoTitle")} description={t("notFound.seoDescription")} path={ROUTES.NOT_FOUND} noindex />
      <MarketingHero title={t("notFound.title")} lead={t("notFound.lead")} kicker="404" />
      <PageFrame maxWidth={800} className="py-12 md:py-16">
        <HoverIconButton icon={HomeIcon} nativeButton={false} render={<Link to={ROUTES.HOME} />}>
          {t("notFound.cta")}
        </HoverIconButton>
      </PageFrame>
    </>
  );
}
