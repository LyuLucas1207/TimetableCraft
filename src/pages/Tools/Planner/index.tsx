import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import PlannerWorkspace from "@/components/planner/PlannerWorkspace";
import { plannerPath, type PlannerDefinition } from "@/config/planners";
import { absoluteUrl, breadcrumbJsonLd, softwareJsonLd } from "@/utils/seo";

export default function PlannerPage({ planner }: { planner: PlannerDefinition }) {
  const { t } = useTranslation("pages.Planner");
  const name = t(`tools.${planner.id}.name`);
  const description = t(`tools.${planner.id}.description`);
  const path = plannerPath(planner);
  return (
    <>
      <Seo
        title={`${name} – TimetableCraft`}
        description={description}
        path={path}
        jsonLd={[
          softwareJsonLd(description, absoluteUrl(path), name, [name], {
            category: "ProductivityApplication",
            features: ["Event editor", "Editable templates", "Local browser storage", "PNG export", "ICS calendar export", "Print and Save as PDF"],
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
