import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { DownloadIcon, ExpandIcon, EyeIcon, FocusIcon, LayoutBottombarCollapseIcon, MagnifierIcon, RefreshIcon, SlidersHorizontalIcon, UserPlusIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import Logo from "@/components/Logo";
import PreferencesPopover from "@/components/PreferencesPopover";
import CourseList from "@/components/courses/CourseList";
import ExcelUploader from "@/components/import/ExcelUploader";
import ImportExcelButton from "@/components/import/ImportExcelButton";
import WorkdayExportHint from "@/components/import/WorkdayExportHint";
import ExportOptionsPopover from "@/components/schedule/ExportOptionsPopover";
import FitWidthFrame from "@/components/schedule/FitWidthFrame";
import AppearanceEditor, { ColorField, RegionEdit, SizeField, ToggleRow } from "@/components/timetable/AppearanceEditor";
import TitlePicker from "@/components/timetable/TitlePicker";
import Timetable from "@/components/timetable/Timetable";
import { HoverIconButton } from "@/components/ui/hover-icon-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { parseManualCourseCode, courseKeyOf, formatCourseCode, normalizeFormat } from "@/parser/courseListingParser";
import { hideModal, ModalTypeEnum, selectTimetableCourses, showCourseModal, useModalStore, useScheduleStore, type ManualCourseInput } from "@/stores";
import { ColorPreset, CourseType, ImportMode, TitlePreset, termFromTitlePreset, type Course, type WeekDay } from "@/types/course";
import { createId } from "@/utils/ids";
import { exportNodeToPng, resolveExportAspectRatio } from "@/utils/exportImage";
import { parseOptionalTimeRange } from "@/utils/time";

const FIT_TO_WIDTH_MQ = "(max-width: 1023px)";

export default function ScheduleWorkspace() {
  const { t } = useTranslation([PAGE.App, LANG_NS]);
  const courses = useScheduleStore((s) => s.courses);
  const selectedTerm = useScheduleStore((s) => s.selectedTerm);
  const settings = useScheduleStore((s) => s.settings);
  const importSummary = useScheduleStore((s) => s.importSummary);
  const setSettings = useScheduleStore((s) => s.setSettings);
  const setTitlePreset = useScheduleStore((s) => s.setTitlePreset);
  const commitTitle = useScheduleStore((s) => s.commitTitle);
  const importExcel = useScheduleStore((s) => s.importExcel);
  const addManualCourse = useScheduleStore((s) => s.addManualCourse);
  const updateCourse = useScheduleStore((s) => s.updateCourse);
  const deleteCourse = useScheduleStore((s) => s.deleteCourse);
  const setOnTimetable = useScheduleStore((s) => s.setOnTimetable);
  const setCourseColor = useScheduleStore((s) => s.setCourseColor);
  const applyColorPreset = useScheduleStore((s) => s.applyColorPreset);
  const applyTheme = useScheduleStore((s) => s.applyTheme);
  const reset = useScheduleStore((s) => s.reset);

  const visible = selectTimetableCourses(courses);
  const onTimetableCount = courses.filter((course) => course.onTimetable).length;
  const exportRef = useRef<HTMLDivElement>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [focusCourseId, setFocusCourseId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"courses" | "timetable">("timetable");
  const [fitToWidth, setFitToWidth] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(FIT_TO_WIDTH_MQ).matches,
  );
  const fitUserSetRef = useRef(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(FIT_TO_WIDTH_MQ);
    const sync = () => {
      if (!fitUserSetRef.current) setFitToWidth(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggleFitToWidth = () => {
    fitUserSetRef.current = true;
    setFitToWidth((on) => !on);
  };

  const openCreate = () => {
    showCourseModal({
      title: t("common.addCourse", { ns: LANG_NS }),
      submitLabel: t("common.addCourse", { ns: LANG_NS }),
      autoOpenMeeting: false,
      editing: null,
      initial: { term: selectedTerm, color: settings.colorPreset === ColorPreset.Pastel ? "#DBEAFE" : undefined },
      onSubmit: handleSubmit,
    });
  };

  const openCreateFromSlot = (day: WeekDay, startTime: string) => {
    showCourseModal({
      title: t("common.addCourse", { ns: LANG_NS }),
      submitLabel: t("common.addCourse", { ns: LANG_NS }),
      autoOpenMeeting: true,
      editing: null,
      initial: {
        term: selectedTerm,
        color: settings.colorPreset === ColorPreset.Pastel ? "#DBEAFE" : undefined,
        days: [day],
        startTime,
      },
      onSubmit: handleSubmit,
    });
  };

  const openEdit = (course: Course) => {
    setFocusCourseId(course.id);
    showCourseModal({
      title: t("common.edit", { ns: LANG_NS }),
      submitLabel: t("common.save", { ns: LANG_NS }),
      autoOpenMeeting: false,
      editing: course,
      initial: {
        courseCode: formatCourseCode(course.subject, course.courseNumber),
        section: course.section,
        title: course.title,
        term: course.term,
        instructionalFormat: course.instructionalFormat,
        courseType: course.courseType,
        days: course.meetings[0]?.days ?? [],
        startTime: course.meetings[0]?.startTime ?? "",
        endTime: course.meetings[0]?.endTime ?? "",
        building: course.meetings[0]?.building,
        room: course.meetings[0]?.room,
        instructor: course.instructor,
        color: course.color,
      },
      onSubmit: handleSubmit,
    });
  };

  const onSelectPreset = (preset: TitlePreset) => {
    const term = termFromTitlePreset(preset);
    const count = term ? courses.filter((course) => course.term === term && course.courseType !== CourseType.Drop).length : 0;
    setTitlePreset(preset);
    if (term) {
      toast.success(t("termPlaced", { ns: PAGE.App, count }));
    }
  };

  const handleFile = (file: File) => {
    if (courses.length > 0) {
      setPendingFile(file);
      return;
    }
    void runImport(file, ImportMode.Replace);
  };

  const runImport = async (file: File, mode: ImportMode) => {
    try {
      const summary = await importExcel(file, mode);
      setImportOpen(false);
      toast.success(t("importReady", { ns: PAGE.App, count: summary.uniqueCourseCount }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("parseError", { ns: PAGE.App }));
    }
  };

  const handleSubmit = (input: ManualCourseInput) => {
    const parsed = parseManualCourseCode(input.courseCode);
    if (!parsed) {
      toast.error(t("formErrorCode", { ns: PAGE.App }));
      return;
    }
    const editing = useModalStore.getState().courseModal.editing ?? null;
    const range = parseOptionalTimeRange(input.startTime, input.endTime);
    const meetings =
      input.days.length > 0 && range !== "empty" && range !== "invalid"
        ? [
            {
              id: editing?.meetings[0]?.id ?? createId(),
              days: input.days,
              startTime: range.startTime,
              endTime: range.endTime,
              building: input.building?.trim() || undefined,
              room: input.room?.trim() || undefined,
            },
          ]
        : [];
    try {
      if (editing) {
        updateCourse(editing.id, {
          subject: parsed.subject,
          courseNumber: parsed.courseNumber,
          section: input.section.trim(),
          title: input.title.trim() || parsed.title || "",
          term: input.term,
          instructionalFormat: normalizeFormat(input.instructionalFormat),
          courseType: input.courseType,
          instructor: input.instructor?.trim() || undefined,
          color: input.color,
          courseKey: courseKeyOf(parsed.subject, parsed.courseNumber),
          meetings,
        });
      } else {
        addManualCourse(input);
      }
      hideModal(ModalTypeEnum.Course);
    } catch {
      toast.error(t("formErrorCode", { ns: PAGE.App }));
    }
  };

  const exportPng = async () => {
    if (!exportRef.current) {
      toast.error(t("emptyTitle", { ns: PAGE.App }));
      return;
    }
    await exportNodeToPng(exportRef.current, `${slugify(settings.title)}.png`, {
      aspectRatio: resolveExportAspectRatio(settings),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden lg:grid lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        <div className="grid min-w-0 flex-1 grid-cols-2 rounded-xl border bg-card p-1 shadow-sm">
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              mobilePane === "courses" ? "bg-foreground text-background" : "text-muted-foreground",
            )}
            onClick={() => setMobilePane("courses")}
          >
            {t("courseList")}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              mobilePane === "timetable" ? "bg-foreground text-background" : "text-muted-foreground",
            )}
            onClick={() => setMobilePane("timetable")}
          >
            {t("mobileTimetable")}
          </button>
        </div>
        <ImportExcelButton compact className="shrink-0" onClick={() => setImportOpen(true)} />
        <HoverIconButton size="sm" className="shrink-0" icon={UserPlusIcon} aria-label={t("common.addCourse", { ns: LANG_NS })} onClick={openCreate}>
          <span className="sr-only">{t("common.addCourse", { ns: LANG_NS })}</span>
        </HoverIconButton>
      </div>

      <aside
        className={cn(
          "min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
          mobilePane === "courses" ? "flex flex-1" : "hidden",
          "lg:flex lg:h-full lg:min-h-0",
        )}
      >
        <div className="shrink-0 space-y-3 p-4 pb-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("courseList")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("catalogCounts", { total: courses.length, on: onTimetableCount })}
            </p>
          </div>
          <div className="hidden gap-2 lg:flex">
            <ImportExcelButton className="min-w-0 flex-1" onClick={() => setImportOpen(true)} />
            <HoverIconButton size="sm" className="min-w-0 flex-1" icon={UserPlusIcon} onClick={openCreate}>
              {t("common.addCourse", { ns: LANG_NS })}
            </HoverIconButton>
          </div>
          {importSummary ? (
            <p className="truncate text-xs text-muted-foreground" title={importSummary.filename}>
              {importSummary.filename} · {t("detected", { courses: importSummary.uniqueCourseCount })}
            </p>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <CourseList
            courses={courses}
            focusId={focusCourseId}
            onEdit={openEdit}
            onDelete={deleteCourse}
            onToggleTimetable={setOnTimetable}
            onColorChange={setCourseColor}
          />
        </div>
      </aside>

      <section
        className={cn(
          "min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:gap-4",
          mobilePane === "timetable" ? "flex flex-1" : "hidden",
          "lg:flex lg:min-h-0",
        )}
      >
        <TitlePicker settings={settings} selectedTerm={selectedTerm} onSelectPreset={onSelectPreset} />
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 md:gap-2">
          <Logo compact className="mr-1 hidden min-[420px]:flex" />
          <HoverIconButton variant="outline" size="sm" icon={SlidersHorizontalIcon} aria-label={t("customize")} onClick={() => setCustomizeOpen(true)}>
            <span className="max-md:sr-only">{t("customize")}</span>
          </HoverIconButton>
          <HoverIconButton variant="outline" size="sm" icon={EyeIcon} aria-label={t("preview")} onClick={() => setPreviewOpen(true)} disabled={visible.length === 0}>
            <span className="max-md:sr-only">{t("preview")}</span>
          </HoverIconButton>
          <HoverIconButton
            variant={settings.collapseEmptyTime ? "default" : "outline"}
            size="sm"
            icon={settings.collapseEmptyTime ? ExpandIcon : LayoutBottombarCollapseIcon}
            aria-label={settings.collapseEmptyTime ? t("collapseToggleUnfold") : t("collapseToggleFold")}
            onClick={() => setSettings({ collapseEmptyTime: !settings.collapseEmptyTime })}
          >
            <span className="max-md:sr-only">{settings.collapseEmptyTime ? t("collapseToggleUnfold") : t("collapseToggleFold")}</span>
          </HoverIconButton>
          <HoverIconButton
            variant={fitToWidth ? "default" : "outline"}
            size="sm"
            className="lg:hidden"
            icon={fitToWidth ? MagnifierIcon : FocusIcon}
            aria-label={fitToWidth ? t("fitToggleScroll") : t("fitToggleShrink")}
            onClick={toggleFitToWidth}
          >
            <span className="max-md:sr-only">{fitToWidth ? t("fitToggleScroll") : t("fitToggleShrink")}</span>
          </HoverIconButton>
          <HoverIconButton variant="outline" size="sm" icon={RefreshIcon} aria-label={t("header.reset", { ns: LANG_NS })} onClick={() => setResetOpen(true)}>
            <span className="max-md:sr-only">{t("header.reset", { ns: LANG_NS })}</span>
          </HoverIconButton>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
            <PreferencesPopover />
            <HoverIconButton size="sm" icon={DownloadIcon} aria-label={t("header.exportPng", { ns: LANG_NS })} onClick={() => void exportPng()} disabled={visible.length === 0}>
              <span className="max-md:sr-only">{t("header.exportPng", { ns: LANG_NS })}</span>
            </HoverIconButton>
            <ExportOptionsPopover />
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <FitWidthFrame enabled={fitToWidth} className="pt-1">
            <Timetable
              courses={visible}
              settings={settings}
              onBlockClick={openEdit}
              onSlotClick={openCreateFromSlot}
              exportRef={visible.length > 0 ? exportRef : undefined}
              onTitleCommit={commitTitle}
              headerEdit={
                <RegionEdit title={t("editHeader", { ns: PAGE.App })} contentClassName="max-h-[70vh] overflow-x-hidden overflow-y-auto">
                  <ToggleRow label={t("showBrand", { ns: PAGE.App })} checked={settings.showBrand} onChange={(showBrand) => setSettings({ showBrand })} />
                  <ToggleRow label={t("showCredits", { ns: PAGE.App })} checked={settings.showCredits} onChange={(showCredits) => setSettings({ showCredits })} />
                  <ColorField label={t("colorHeaderBg", { ns: PAGE.App })} value={settings.headerBg} onChange={(headerBg) => setSettings({ headerBg })} />
                  <ColorField label={t("colorHeaderText", { ns: PAGE.App })} value={settings.headerText} onChange={(headerText) => setSettings({ headerText })} />
                  <ColorField label={t("colorBrand", { ns: PAGE.App })} value={settings.kickerColor} onChange={(kickerColor) => setSettings({ kickerColor })} />
                  <SizeField label={t("sizeTitle", { ns: PAGE.App })} value={settings.titleFontSize} min={14} max={40} onChange={(titleFontSize) => setSettings({ titleFontSize })} />
                  <SizeField label={t("sizeSubtitle", { ns: PAGE.App })} value={settings.subtitleFontSize} min={10} max={22} onChange={(subtitleFontSize) => setSettings({ subtitleFontSize })} />
                </RegionEdit>
              }
            />
          </FitWidthFrame>
        </div>
      </section>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("importExcel", { ns: PAGE.App })}</DialogTitle>
            <DialogDescription>{t("uploadBody", { ns: PAGE.App })}</DialogDescription>
          </DialogHeader>
          <WorkdayExportHint />
          <ExcelUploader onFile={handleFile} />
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.25rem)] min-h-0 flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader className="flex-row items-start justify-between gap-2 pr-8">
            <div className="min-w-0 space-y-2">
              <DialogTitle>{t("preview", { ns: PAGE.App })}</DialogTitle>
              <DialogDescription>{t("previewBody", { ns: PAGE.App })}</DialogDescription>
            </div>
            <HoverIconButton
              variant={fitToWidth ? "default" : "outline"}
              size="sm"
              className="lg:hidden shrink-0"
              icon={fitToWidth ? MagnifierIcon : FocusIcon}
              aria-label={fitToWidth ? t("fitToggleScroll") : t("fitToggleShrink")}
              onClick={toggleFitToWidth}
            >
              <span className="sr-only">{fitToWidth ? t("fitToggleScroll") : t("fitToggleShrink")}</span>
            </HoverIconButton>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <FitWidthFrame enabled={fitToWidth} className="px-1 pb-2">
              <Timetable courses={visible} settings={settings} interactive={false} />
            </FitWidthFrame>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingFile)} onOpenChange={(open) => !open && setPendingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("replaceTitle", { ns: PAGE.App })}</AlertDialogTitle>
            <AlertDialogDescription>{t("replaceBody", { ns: PAGE.App })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", { ns: LANG_NS })}</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingFile) void runImport(pendingFile, ImportMode.Merge);
                setPendingFile(null);
              }}
            >
              {t("merge", { ns: PAGE.App })}
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (pendingFile) void runImport(pendingFile, ImportMode.Replace);
                setPendingFile(null);
              }}
            >
              {t("replace", { ns: PAGE.App })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle", { ns: PAGE.App })}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetBody", { ns: PAGE.App })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", { ns: LANG_NS })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                reset();
                setResetOpen(false);
              }}
            >
              {t("header.reset", { ns: LANG_NS })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("customize", { ns: PAGE.App })}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <AppearanceEditor
              settings={settings}
              onChange={setSettings}
              onTheme={applyTheme}
              onColorPreset={applyColorPreset}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function slugify(title: string): string {
  const slug = title
    .trim()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "timetablecraft";
}
