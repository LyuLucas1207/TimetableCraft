import { useTranslation } from "react-i18next";

import { PAGE } from "@/assets/language";
import {
  exportExcelPhoneShot,
  exportExcelWebShot,
  viewMyCoursesShot,
  WORKDAY_SHOT_SIZE,
} from "@/assets/workday";
import WorkdayShot from "@/components/import/WorkdayShot";
import { cn } from "cn";

export function WorkdayHomeShot({ className }: { className?: string }) {
  const { t } = useTranslation(PAGE.Guide);
  return (
    <WorkdayShot
      className={className}
      src={viewMyCoursesShot}
      alt={t("step1Alt")}
      caption={t("step1Caption")}
      width={WORKDAY_SHOT_SIZE.viewMyCourses.width}
      height={WORKDAY_SHOT_SIZE.viewMyCourses.height}
    />
  );
}

export function WorkdayExcelShots({
  captions = true,
  className,
}: {
  captions?: boolean;
  className?: string;
}) {
  const { t } = useTranslation(PAGE.Guide);
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <WorkdayShot
        src={exportExcelWebShot}
        label={t("step2web")}
        alt={t("step2webAlt")}
        caption={captions ? t("step2webCaption") : undefined}
        width={WORKDAY_SHOT_SIZE.exportExcelWeb.width}
        height={WORKDAY_SHOT_SIZE.exportExcelWeb.height}
      />
      <WorkdayShot
        src={exportExcelPhoneShot}
        label={t("step2phone")}
        alt={t("step2phoneAlt")}
        caption={captions ? t("step2phoneCaption") : undefined}
        width={WORKDAY_SHOT_SIZE.exportExcelPhone.width}
        height={WORKDAY_SHOT_SIZE.exportExcelPhone.height}
      />
    </div>
  );
}
