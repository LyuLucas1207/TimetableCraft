import { useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";
import { ArrowNarrowRightIcon, ExternalLinkIcon } from "@/animations";
import type { AnimatedIconHandle } from "@/animations/types";
import { PLANNERS, plannerPath } from "@/config/planners";
import { PLANNER_ICONS, type ToolIcon } from "@/components/planner/icons";

interface ToolCardProps {
  path: string;
  name: string;
  description: string;
  cta: string;
  icon: ToolIcon;
}

function ToolCard({ path, name, description, cta, icon: Icon }: ToolCardProps) {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const reducedMotion = useReducedMotion();
  const start = () => { if (!reducedMotion) iconRef.current?.startAnimation(); };
  const stop = () => iconRef.current?.stopAnimation();

  return (
    <Link
      to={path}
      className="group flex flex-col rounded-2xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div aria-hidden="true" className="pointer-events-none flex items-center justify-between">
        <Icon ref={iconRef} size={28} className="text-foreground" />
        <ExternalLinkIcon size={16} className="text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 flex items-center gap-2 text-sm font-medium">
        {cta}
        <span aria-hidden="true" className="pointer-events-none inline-flex"><ArrowNarrowRightIcon size={16} /></span>
      </span>
    </Link>
  );
}

export default function ToolCatalog() {
  const { t } = useTranslation("pages.Planner");
  const tools = [
    { id: "class", icon: PLANNER_ICONS.class, path: "/tools/schedule-maker", name: t("className"), description: t("classDescription") },
    ...PLANNERS.map((planner) => ({
      id: planner.id,
      icon: PLANNER_ICONS[planner.id],
      path: plannerPath(planner),
      name: t(`tools.${planner.id}.name`),
      description: t(`tools.${planner.id}.description`),
    })),
  ];

  return (
    <section aria-labelledby="tool-catalog-title">
      <h2 id="tool-catalog-title" className="text-3xl font-semibold tracking-tight">{t("chooseTitle")}</h2>
      <p className="mt-3 text-muted-foreground">{t("chooseLead")}</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => <ToolCard key={tool.id} {...tool} cta={t("openTool")} />)}
      </div>
    </section>
  );
}
