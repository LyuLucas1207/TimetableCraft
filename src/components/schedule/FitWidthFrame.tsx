import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

interface FitWidthFrameProps {
  enabled: boolean;
  children: ReactNode;
  className?: string;
  /** Scale the card to fit both axes (up or down). */
  contain?: boolean;
}

/**
 * When enabled, scales children to the container width (no horizontal scroll).
 * `contain` also fits height and may scale up. Transform is on a wrapper so export nodes stay full size.
 */
export default function FitWidthFrame({ enabled, contain = false, children, className }: FitWidthFrameProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const scaleEnabled = enabled || contain;

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const contentBox = (entry?: ResizeObserverEntry) => {
      const style = getComputedStyle(outer);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      if (entry?.contentBoxSize?.[0]) {
        return { w: entry.contentBoxSize[0].inlineSize, h: entry.contentBoxSize[0].blockSize };
      }
      if (entry) return { w: entry.contentRect.width, h: entry.contentRect.height };
      return { w: outer.clientWidth - padX, h: outer.clientHeight - padY };
    };

    const measure = (entry?: ResizeObserverEntry) => {
      const w = Math.max(inner.scrollWidth, inner.offsetWidth);
      const h = Math.max(inner.scrollHeight, inner.offsetHeight);
      setNatural((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      if (!scaleEnabled) {
        setScale((prev) => (prev === 1 ? prev : 1));
        return;
      }
      const box = contentBox(entry?.target === outer ? entry : undefined);
      const scaleW = box.w > 0 && w > 0 ? box.w / w : 1;
      const scaleH = box.h > 0 && h > 0 ? box.h / h : scaleW;
      const next = contain ? Math.min(scaleW, scaleH) : Math.min(1, scaleW);
      setScale((prev) => (Math.abs(next - prev) < 0.002 ? prev : next));
    };

    measure();
    const observer = new ResizeObserver((entries) => {
      const outerEntry = entries.find((entry) => entry.target === outer);
      measure(outerEntry);
    });
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [contain, scaleEnabled]);

  return (
    <div
      ref={outerRef}
      className={cn(
        "h-full min-h-0 min-w-0 overscroll-contain",
        contain
          ? "flex items-center justify-center overflow-hidden"
          : scaleEnabled
            ? "overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
            : "overflow-auto",
        className,
      )}
    >
      <div
        className={cn(scaleEnabled && "overflow-hidden", contain && "shrink-0")}
        style={
          scaleEnabled && natural.w > 0
            ? { width: natural.w * scale, height: natural.h * scale }
            : undefined
        }
      >
        <div
          ref={innerRef}
          style={scaleEnabled ? { transform: `scale(${scale})`, transformOrigin: "top left" } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
