import type { ComponentType, RefAttributes } from "react";
import {
  BookIcon,
  ClockIcon,
  FileDescriptionIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  RefreshIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "@/animations";
import type { AnimatedIconHandle, AnimatedIconProps } from "@/animations/types";
import type { PlannerId } from "@/config/planners";

export type ToolIcon = ComponentType<AnimatedIconProps & RefAttributes<AnimatedIconHandle>>;

/** Use the supplied animated outline icons throughout the tool catalog and editors. */
export const PLANNER_ICONS = {
  class: LibraryIcon,
  weekly: LayoutDashboardIcon,
  study: BookIcon,
  exam: FileDescriptionIcon,
  work: UsersIcon,
  daily: ClockIcon,
  routine: RefreshIcon,
  custom: SlidersHorizontalIcon,
} satisfies Record<PlannerId | "class", ToolIcon>;
