import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

interface FitWidthFrameProps {
  enabled: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * When enabled, scales children to the container width (no horizontal scroll).
 * Vertical scroll remains. Transform is on a wrapper so export nodes stay full size.
 */
export default function FitWidthFrame({ enabled, children, className }: FitWidthFrameProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const contentWidth = (entry?: ResizeObserverEntry) => {
      if (entry?.contentBoxSize?.[0]) return entry.contentBoxSize[0].inlineSize;
      if (entry) return entry.contentRect.width;
      const style = getComputedStyle(outer);
      return outer.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    };

    const measure = (entry?: ResizeObserverEntry) => {
      const w = Math.max(inner.scrollWidth, inner.offsetWidth);
      const h = Math.max(inner.scrollHeight, inner.offsetHeight);
      setNatural((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      if (!enabled) {
        setScale((prev) => (prev === 1 ? prev : 1));
        return;
      }
      const available = contentWidth(entry?.target === outer ? entry : undefined);
      const next = available > 0 && w > 0 ? Math.min(1, available / w) : 1;
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
  }, [enabled]);

  return (
    <div
      ref={outerRef}
      className={cn(
        "h-full min-h-0 min-w-0 overscroll-contain",
        enabled ? "overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]" : "overflow-auto",
        className,
      )}
    >
      <div
        className={enabled ? "overflow-hidden" : undefined}
        style={
          enabled && natural.w > 0
            ? { width: natural.w * scale, height: natural.h * scale }
            : undefined
        }
      >
        <div
          ref={innerRef}
          style={enabled ? { transform: `scale(${scale})`, transformOrigin: "top left" } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
