import { useTranslation } from "react-i18next";

import { PAGE } from "@/assets/language";
import Seo from "@/components/Seo";
import ScheduleWorkspace from "@/components/schedule/ScheduleWorkspace";
import { PageFrame } from "@/layouts";
import { ROUTES } from "@/navigations";

export default function ScheduleMakerPage() {
  const { t } = useTranslation(PAGE.Tools);
  return (
    <PageFrame className="flex h-full min-h-0 flex-col overflow-hidden py-4 md:py-5" maxWidth={1680}>
      <Seo title={t("scheduleMakerName")} description={t("scheduleMakerBody")} path={ROUTES.TOOL_SCHEDULE_MAKER} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScheduleWorkspace />
      </div>
    </PageFrame>
  );
}
