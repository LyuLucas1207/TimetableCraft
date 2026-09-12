import {
  type ComponentProps,
  type ComponentType,
  type RefAttributes,
  useRef,
} from "react";

import type { AnimatedIconHandle, AnimatedIconProps } from "@/animations/types";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type AnimatedIcon = ComponentType<AnimatedIconProps & RefAttributes<AnimatedIconHandle>>;

type HoverIconButtonProps = ComponentProps<typeof Button> & {
  icon: AnimatedIcon;
  iconSize?: number;
};

export function useAnimatedIconHover() {
  const ref = useRef<AnimatedIconHandle>(null);
  return {
    ref,
    hoverProps: {
      onMouseEnter: () => {
        ref.current?.startAnimation();
      },
      onMouseLeave: () => {
        ref.current?.stopAnimation();
      },
    },
  };
}

export function HoverIconButton({
  icon: Icon,
  iconSize,
  children,
  className,
  size,
  onMouseEnter,
  onMouseLeave,
  ...props
}: HoverIconButtonProps) {
  const { ref, hoverProps } = useAnimatedIconHover();
  const compact = size === "sm" || size === "icon-sm" || size === "xs" || size === "icon-xs";
  const resolvedSize = iconSize ?? (compact ? 14 : 16);
  const iconOnly = typeof size === "string" && size.startsWith("icon");
  const hasLabel = !iconOnly && children != null && children !== false;

  return (
    <Button
      size={size}
      className={cn("overflow-visible", iconOnly && "justify-center p-0", className)}
      {...props}
      onMouseEnter={(event) => {
        hoverProps.onMouseEnter();
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        hoverProps.onMouseLeave();
        onMouseLeave?.(event);
      }}
    >
      <span data-icon={hasLabel ? "inline-start" : undefined} className="inline-flex overflow-visible">
        <Icon ref={ref} size={resolvedSize} />
      </span>
      {children}
    </Button>
  );
}
