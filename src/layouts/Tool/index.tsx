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
    <div className="h-dvh overflow-hidden bg-slate-50 text-foreground dark:bg-zinc-950">
      <Outlet />
    </div>
  );
}
