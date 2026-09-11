import type { SVGProps } from "react";

/** Standard stroke width for 24×24 outline icons */
export const DEFAULT_STROKE_WIDTH = 2;

/** Scale stroke to match DEFAULT_STROKE_WIDTH on non-24 viewBoxes */
export function scaledStrokeWidth(
  strokeWidth: number,
  viewBoxSize: number,
): number {
  return strokeWidth * (viewBoxSize / 24);
}

export enum IconEasingEnum {
  LINEAR = "linear",
  EASE_IN = "easeIn",
  EASE_OUT = "easeOut",
  EASE_IN_OUT = "easeInOut",
  CIRC_IN = "circIn",
  CIRC_OUT = "circOut",
  CIRC_IN_OUT = "circInOut",
  BACK_IN = "backIn",
  BACK_OUT = "backOut",
  BACK_IN_OUT = "backInOut",
  ANTICIPATE = "anticipate",
}

export interface AnimatedIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  | "ref"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
  | "values"
> {
  /** Icon size in pixels or CSS string */
  size?: number | string;
  /** Icon color (defaults to currentColor) */
  color?: string;
  /** SVG stroke width */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}
