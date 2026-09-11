import { useId } from "react";
import { useTranslation } from "react-i18next";

import { GmailIcon, WorldIcon } from "@/animations";
import { LANG_NS } from "@/assets/language";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { CONTACT_EMAIL, buildMailto } from "@/constants";
import { cn } from "cn";

const CAMPUSES = [
  { name: "UBC", live: true },
  { name: "SFU", live: false },
  { name: "Waterloo", live: false },
  { name: "U of T", live: false },
  { name: "McGill", live: false },
  { name: "UVic", live: false },
] as const;

export default function CampusInvite({ className }: { className?: string }) {
  const { t } = useTranslation(LANG_NS);
  const titleId = useId();
  const href = buildMailto(t("campusInvite.mailSubject"), t("campusInvite.mailBody"));
  const steps = ["step1", "step2", "step3"] as const;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-[#002145] px-6 py-8 text-white shadow-[0_24px_60px_-28px_rgba(0,33,69,0.85)] md:px-10 md:py-10",
        className,
      )}
      aria-labelledby={titleId}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:40px_52px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-sky-300/20 blur-3xl"
      />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-sky-200 uppercase">
            <WorldIcon size={14} color="currentColor" />
            {t("campusInvite.kicker")}
          </p>
          <h2 id={titleId} className="mt-3 max-w-[22ch] text-2xl font-semibold tracking-tight md:text-3xl">
            {t("campusInvite.title")}
          </h2>
          <p className="mt-3 max-w-[46ch] text-sm leading-7 text-sky-100/85">{t("campusInvite.body")}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {CAMPUSES.map((campus) => (
              <li
                key={campus.name}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
                  campus.live
                    ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
                    : "border-white/15 bg-white/10 text-white/90",
                )}
              >
                {campus.name}
                <span className={cn("text-[10px] font-bold uppercase", campus.live ? "text-emerald-200" : "text-sky-200/80")}>
                  {campus.live ? t("campusInvite.live") : t("campusInvite.wanted")}
                </span>
              </li>
            ))}
            <li className="inline-flex items-center rounded-full border border-dashed border-white/30 px-3 py-1 text-xs font-semibold text-sky-100">
              {t("campusInvite.yourCampus")}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <HoverIconButton
              icon={GmailIcon}
              nativeButton={false}
              render={<a href={href} />}
              className="bg-white text-[#002145] hover:bg-sky-50 dark:bg-white dark:text-[#002145] dark:hover:bg-sky-50"
            >
              {t("campusInvite.cta")}
            </HoverIconButton>
            <a href={href} className="text-sm font-medium text-sky-100 underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-xs font-bold tracking-wide text-sky-200 uppercase">{t("campusInvite.stepsTitle")}</p>
          <ol className="mt-4 space-y-4">
            {steps.map((key, index) => (
              <li key={key} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-6 text-sky-50/90">{t(`campusInvite.${key}`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-sky-100/70">{t("campusInvite.hint")}</p>
        </div>
      </div>
    </section>
  );
}
