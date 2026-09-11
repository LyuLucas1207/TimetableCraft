import type { ReactNode } from "react";

import { cn } from "cn";

export default function PageFrame({
  children,
  className,
  maxWidth = 1680,
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-8 md:px-6 md:py-10", className)} style={{ maxWidth }}>
      {children}
    </div>
  );
}
