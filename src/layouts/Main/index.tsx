import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import Footer from "@/layouts/Footer";
import Header from "@/layouts/Header";
import { ROUTES } from "@/navigations";
import { cn } from "cn";

export default function Main() {
  const { pathname } = useLocation();
  const toolWorkspace = pathname.startsWith(`${ROUTES.TOOLS}/`);

  useEffect(() => {
    if (!toolWorkspace) return;
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, [toolWorkspace]);

  return (
    <div className={cn("flex flex-col bg-slate-50 text-foreground dark:bg-zinc-950", toolWorkspace ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <Header />
      <main className={cn("flex-1", toolWorkspace && "flex min-h-0 flex-col overflow-hidden")}>
        <Outlet />
      </main>
      {toolWorkspace ? null : <Footer />}
    </div>
  );
}
