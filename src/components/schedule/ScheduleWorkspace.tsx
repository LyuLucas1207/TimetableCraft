import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { DownloadIcon, ExpandIcon, EyeIcon, FileDescriptionIcon, LayoutBottombarCollapseIcon, RefreshIcon, SlidersHorizontalIcon, UserPlusIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import Logo from "@/components/Logo";
import PreferencesPopover from "@/components/PreferencesPopover";
import CourseList from "@/components/courses/CourseList";
import ExcelUploader from "@/components/import/ExcelUploader";
import ExportOptionsPopover from "@/components/schedule/ExportOptionsPopover";
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
import { ColorPreset, CourseType, EXPORT_ASPECT_RATIO, ImportMode, TitlePreset, termFromTitlePreset, type Course, type WeekDay } from "@/types/course";
import { createId } from "@/utils/ids";
import { exportNodeToPng } from "@/utils/exportImage";
import { parseOptionalTimeRange } from "@/utils/time";

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
      aspectRatio: EXPORT_ASPECT_RATIO[settings.exportAspect],
    });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(12rem,42%)_minmax(0,1fr)] gap-4 overflow-hidden lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
      <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="shrink-0 space-y-3 p-4 pb-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("courseList")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("catalogCounts", { total: courses.length, on: onTimetableCount })}
            </p>
          </div>
          <div className="flex gap-2">
            <HoverIconButton variant="outline" size="sm" className="min-w-0 flex-1" icon={FileDescriptionIcon} onClick={() => setImportOpen(true)}>
              {t("importExcel")}
            </HoverIconButton>
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

      <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        <TitlePicker settings={settings} selectedTerm={selectedTerm} onSelectPreset={onSelectPreset} />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Logo />
          <HoverIconButton variant="outline" size="sm" icon={SlidersHorizontalIcon} onClick={() => setCustomizeOpen(true)}>
            {t("customize")}
          </HoverIconButton>
          <HoverIconButton variant="outline" size="sm" icon={EyeIcon} onClick={() => setPreviewOpen(true)} disabled={visible.length === 0}>
            {t("preview")}
          </HoverIconButton>
          <HoverIconButton
            variant={settings.collapseEmptyTime ? "default" : "outline"}
            size="sm"
            icon={settings.collapseEmptyTime ? ExpandIcon : LayoutBottombarCollapseIcon}
            onClick={() => setSettings({ collapseEmptyTime: !settings.collapseEmptyTime })}
          >
            {settings.collapseEmptyTime ? t("collapseToggleUnfold") : t("collapseToggleFold")}
          </HoverIconButton>
          <HoverIconButton variant="outline" size="sm" icon={RefreshIcon} onClick={() => setResetOpen(true)}>
            {t("header.reset", { ns: LANG_NS })}
          </HoverIconButton>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <PreferencesPopover />
            <HoverIconButton size="sm" icon={DownloadIcon} onClick={() => void exportPng()} disabled={visible.length === 0}>
              {t("header.exportPng", { ns: LANG_NS })}
            </HoverIconButton>
            <ExportOptionsPopover />
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto overscroll-contain pt-1">
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
          </div>
        </div>
      </section>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("importExcel", { ns: PAGE.App })}</DialogTitle>
            <DialogDescription>{t("uploadBody", { ns: PAGE.App })}</DialogDescription>
          </DialogHeader>
          <ExcelUploader onFile={handleFile} />
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("preview", { ns: PAGE.App })}</DialogTitle>
            <DialogDescription>{t("previewBody", { ns: PAGE.App })}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto px-1 pb-2">
            <Timetable courses={visible} settings={settings} interactive={false} />
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
