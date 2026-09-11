import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const SlidersHorizontalIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(() => {
      animate(
        ".slider-1",
        { x: [0, -4, 0] },
        { duration: 2, repeat: Infinity, ease: "easeInOut" },
      );
      animate(
        ".slider-2",
        { x: [0, 4, 0] },
        { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
      );
      animate(
        ".slider-3",
        { x: [0, -4, 0] },
        { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
      );
    }, [animate]);

    const stop = useCallback(() => {
      animate(".slider-1, .slider-2, .slider-3", { x: 0 }, { duration: 0.3 });
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <line x1="3" y1="5" x2="21" y2="5" />
        <motion.g className="slider-1">
          <line x1="14" y1="3" x2="14" y2="7" />
        </motion.g>

        <line x1="3" y1="12" x2="21" y2="12" />
        <motion.g className="slider-2">
          <line x1="8" y1="10" x2="8" y2="14" />
        </motion.g>

        <line x1="3" y1="19" x2="21" y2="19" />
        <motion.g className="slider-3">
          <line x1="16" y1="17" x2="16" y2="21" />
        </motion.g>
      </motion.svg>
    );
  },
);

SlidersHorizontalIcon.displayName = "SlidersHorizontalIcon";
export default SlidersHorizontalIcon;
