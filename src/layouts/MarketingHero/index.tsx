import type { ReactNode } from "react";

import { APP_NAME } from "@/constants";
import { cn } from "cn";

export default function MarketingHero({
  kicker = APP_NAME,
  title,
  lead,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  lead: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_82%_18%,color-mix(in_oklab,#002145_18%,transparent),transparent_58%),radial-gradient(45%_40%_at_8%_88%,color-mix(in_oklab,#002145_8%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_7%,transparent)_1px,transparent_1px)] [background-size:48px_64px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,#000_35%,transparent_100%)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <p className="text-xs font-bold tracking-wide text-[#002145] uppercase dark:text-sky-300">{kicker}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-[46ch] text-lg leading-7 text-muted-foreground">{lead}</p>
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
