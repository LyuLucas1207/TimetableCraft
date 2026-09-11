import { Outlet } from "react-router";

import Footer from "@/layouts/Footer";
import Header from "@/layouts/Header";

export default function Main() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-foreground dark:bg-zinc-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
