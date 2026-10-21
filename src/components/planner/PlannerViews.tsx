import { LayoutDashboardIcon } from "@/animations";
import type { PlannerDefinition } from "@/config/planners";
import type { PlannerDocument } from "@/stores/planners";
import DailyView from "./views/DailyView";
import ExamView from "./views/ExamView";
import RoutineView from "./views/RoutineView";
import StudyView from "./views/StudyView";
import WeeklyView from "./views/WeeklyView";
import WorkView from "./views/WorkView";
import { ViewHeader, type ViewProps } from "./views/parts";

export type { ViewProps };
export type PlannerViewProps = ViewProps & { planner: PlannerDefinition; doc: PlannerDocument };

/** One purpose-built view per tool; each reads the same document and edits through the shared handlers. */
export default function PlannerView({ planner, ...props }: PlannerViewProps) {
  switch (planner.id) {
    case "weekly": return <WeeklyView {...props} />;
    case "study": return <StudyView {...props} />;
    case "exam": return <ExamView {...props} />;
    case "work": return <WorkView {...props} />;
    case "daily": return <DailyView {...props} />;
    case "routine": return <RoutineView {...props} />;
    default: return <div className="rounded-2xl border bg-background p-8"><ViewHeader icon={LayoutDashboardIcon} kicker={props.title} title={props.title} detail="" /></div>;
  }
}
