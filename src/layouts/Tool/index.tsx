import { useEffect } from "react";
import { Outlet } from "react-router";

export default function Tool() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-foreground dark:bg-zinc-950">
      <Outlet />
    </div>
  );
}
