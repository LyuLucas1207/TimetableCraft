import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DownloadIcon, LinkIcon, TrashIcon, UploadIcon } from "@/animations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import { Input } from "@/components/ui/input";
import type { PlannerId } from "@/config/planners";
import type { PlannerDocument } from "@/stores/planners";
import type { ScheduleEvent } from "@/types/schedule";
import { downloadTextFile, filenameFromTitle } from "@/utils/download";
import { csvToEvents, eventsToCSV, exportPlannerJSON, mergeDocuments, parsePlannerJSON } from "@/utils/planIO";
import { SHARE_LIMIT, encodeShare, shareUrl } from "@/utils/shareLink";

type Pending =
  | { kind: "json"; document: PlannerDocument; dropped: number; name: string }
  | { kind: "csv"; events: ScheduleEvent[]; skipped: number; name: string };

export default function DataDialog({ planner, doc, title, onClose, onReplace, onAppend, onClear }: {
  planner: PlannerId; doc: PlannerDocument; title: string; onClose: () => void;
  onReplace: (document: PlannerDocument) => void; onAppend: (events: ScheduleEvent[], document?: PlannerDocument) => void; onClear: () => void;
}) {
  const { t } = useTranslation("pages.Planner");
  const [pending, setPending] = useState<Pending | null>(null);
  const [link, setLink] = useState("");
  const [confirm, setConfirm] = useState<"replace" | "clear" | null>(null);
  const fail = (error: unknown) => toast.error(t(error instanceof Error && error.message.startsWith("error") ? error.message : "errorImportFormat"));
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      if (/\.csv$/i.test(file.name)) { const { events, errors } = csvToEvents(text); setPending({ kind: "csv", events, skipped: errors.length, name: file.name }); }
      else { const { document, dropped } = parsePlannerJSON(text, planner); setPending({ kind: "json", document, dropped, name: file.name }); }
      setConfirm(null);
    } catch (error) { fail(error); }
  };
  const makeLink = async () => {
    try {
      const url = shareUrl(await encodeShare(planner, { ...doc }));
      if (url.length > SHARE_LIMIT) { toast.error(t("errorShareTooLong")); setLink(""); return; }
      setLink(url);
    } catch { toast.error(t("errorExport")); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast.success(t("linkCopied")); } catch { toast.error(t("errorExport")); } };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{t("data.title")}</DialogTitle><DialogDescription>{t("data.hint")}</DialogDescription></DialogHeader>
      <section className="space-y-2"><h3 className="text-sm font-semibold">{t("data.backup")}</h3>
        <div className="flex flex-wrap gap-2">
          <HoverIconButton icon={DownloadIcon} variant="outline" onClick={() => downloadTextFile(filenameFromTitle(title, "json"), exportPlannerJSON(planner, doc), "application/json;charset=utf-8")}>{t("data.downloadJson")}</HoverIconButton>
          <HoverIconButton icon={DownloadIcon} variant="outline" disabled={!doc.events.length} onClick={() => downloadTextFile(filenameFromTitle(title, "csv"), eventsToCSV(doc.events), "text/csv;charset=utf-8")}>{t("data.downloadCsv")}</HoverIconButton>
        </div></section>
      <section className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold">{t("data.import")}</h3><p className="text-xs text-muted-foreground">{t("data.importHint")}</p>
        <label className="inline-flex"><input type="file" accept=".json,.csv,application/json,text/csv" className="sr-only peer" aria-label={t("data.chooseFile")} onChange={(e) => void onFile(e)} />
          <span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted"><UploadIcon size={16} />{t("data.chooseFile")}</span></label>
        {pending && <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
          <p>{pending.kind === "json" ? t("data.jsonFound", { name: pending.name, count: pending.document.events.length }) : t("data.csvFound", { name: pending.name, count: pending.events.length })}</p>
          {(pending.kind === "json" ? pending.dropped : pending.skipped) > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">{t("data.skipped", { count: pending.kind === "json" ? pending.dropped : pending.skipped })}</p>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending.kind === "json" ? !pending.document.events.length : !pending.events.length} onClick={() => { if (pending.kind === "json") onAppend([], mergeDocuments(doc, pending.document)); else onAppend(pending.events); setPending(null); onClose(); }}>{t("data.merge")}</Button>
            {pending.kind === "json" && (confirm === "replace"
              ? <Button variant="destructive" onClick={() => { onReplace(pending.document); setPending(null); onClose(); }}>{t("data.confirmReplace")}</Button>
              : <Button variant="outline" onClick={() => setConfirm("replace")}>{t("data.replace")}</Button>)}
            <Button variant="ghost" onClick={() => { setPending(null); setConfirm(null); }}>{t("cancel")}</Button>
          </div></div>}
      </section>
      <section className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold">{t("data.share")}</h3><p className="text-xs text-muted-foreground">{t("data.shareHint")}</p>
        <HoverIconButton icon={LinkIcon} variant="outline" onClick={() => void makeLink()}>{t("data.createLink")}</HoverIconButton>
        {link && <div className="flex gap-2"><Input readOnly aria-label={t("data.share")} value={link} onFocus={(e) => e.currentTarget.select()} /><Button variant="outline" onClick={() => void copy()}>{t("data.copy")}</Button></div>}
      </section>
      <section className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold text-destructive">{t("data.danger")}</h3><p className="text-xs text-muted-foreground">{t("data.clearHint")}</p>
        {confirm === "clear" ? <div className="flex gap-2"><Button variant="destructive" onClick={() => { onClear(); onClose(); }}>{t("data.confirmClear")}</Button><Button variant="ghost" onClick={() => setConfirm(null)}>{t("cancel")}</Button></div>
          : <HoverIconButton icon={TrashIcon} variant="outline" disabled={!doc.events.length} onClick={() => setConfirm("clear")}>{t("data.clear")}</HoverIconButton>}
      </section>
    </DialogContent>
  </Dialog>;
}
