import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";

import { UnorderedListIcon } from "@/animations";
import Logo from "@/components/Logo";
import PreferencesPopover from "@/components/PreferencesPopover";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ROUTES, isActiveRoute } from "@/navigations";

const NAV = [
  { route: ROUTES.HOME, key: "header.home" },
  { route: ROUTES.TOOLS, key: "header.tools" },
  { route: ROUTES.GUIDE, key: "header.guide" },
  { route: ROUTES.FAQ, key: "header.faq" },
  { route: ROUTES.CONTACT, key: "header.contact" },
] as const;

export default function Header() {
  const { t } = useTranslation("language");
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b bg-background shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 px-4 md:px-6">
        <Logo />
        <nav className="hidden min-w-0 shrink-0 items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActiveRoute(pathname, item.route) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <PreferencesPopover />
          <HoverIconButton variant="ghost" size="icon" className="lg:hidden" icon={UnorderedListIcon} aria-label={t("header.openMenu")} onClick={() => setOpen(true)} />
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{t("header.openMenu")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {NAV.map((item) => (
              <NavLink
                key={item.route}
                to={item.route}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${isActiveRoute(pathname, item.route) ? "bg-muted font-medium" : "hover:bg-muted"}`}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
