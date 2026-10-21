import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import PlannerWorkspace from "@/components/planner/PlannerWorkspace";
import { plannerPath, type PlannerDefinition } from "@/config/planners";
import { absoluteUrl, breadcrumbJsonLd, softwareJsonLd } from "@/utils/seo";

export default function PlannerPage({ planner }: { planner: PlannerDefinition }) {
  const { t } = useTranslation("pages.Planner");
  const name = t(`tools.${planner.id}.name`);
  const description = t(`tools.${planner.id}.seoDescription`);
  const maker = t(`tools.${planner.id}.maker`);
  const path = plannerPath(planner);
  return (
    <>
      <Seo
        title={t(`tools.${planner.id}.seoTitle`)}
        description={description}
        path={path}
        jsonLd={[
          softwareJsonLd(description, absoluteUrl(path), maker, [name, "timetable maker", "free timetable maker"], {
            category: "ProductivityApplication",
            features: ["Editable templates", "Drag and drop time blocks", "Undo and redo", "Backup and share link", "Local browser storage", "PNG export", "ICS calendar export with reminders", "Print and Save as PDF"],
          }),
          breadcrumbJsonLd([
            { name: "TimetableCraft", path: "/" },
            { name: t("allTools"), path: "/tools" },
            { name, path },
          ]),
        ]}
      />
      <PlannerWorkspace key={planner.id} planner={planner} />
    </>
  );
}
