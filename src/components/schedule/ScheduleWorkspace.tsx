import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { DownloadIcon, EyeIcon, FileDescriptionIcon, RefreshIcon, SlidersHorizontalIcon, UserPlusIcon } from "@/animations";
import { LANG_NS, PAGE } from "@/assets/language";
import Logo from "@/components/Logo";
import PreferencesPopover from "@/components/PreferencesPopover";
import CourseList from "@/components/courses/CourseList";
import CourseModal from "@/components/courses/CourseModal";
import ExcelUploader from "@/components/import/ExcelUploader";
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
import { parseManualCourseCode, courseKeyOf, normalizeFormat } from "@/parser/courseListingParser";
import { selectTimetableCourses, useScheduleStore, type ManualCourseInput } from "@/stores/schedule";
import { ColorPreset, CourseType, ImportMode, TitlePreset, termFromTitlePreset, type Course } from "@/types/course";
import { createId } from "@/utils/ids";
import { exportNodeToPng } from "@/utils/exportImage";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [focusCourseId, setFocusCourseId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setFocusCourseId(course.id);
    setEditing(course);
    setModalOpen(true);
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
    if (editing) {
      const parsed = parseManualCourseCode(input.courseCode);
      if (!parsed) {
        toast.error(t("formErrorCode", { ns: PAGE.App }));
        return;
      }
      updateCourse(editing.id, {
        subject: parsed.subject,
        courseNumber: parsed.courseNumber,
        section: input.section.trim(),
        title: input.title.trim(),
        term: input.term,
        instructionalFormat: normalizeFormat(input.instructionalFormat),
        courseType: input.courseType,
        instructor: input.instructor?.trim() || undefined,
        color: input.color,
        courseKey: courseKeyOf(parsed.subject, parsed.courseNumber),
        meetings: [
          {
            id: editing.meetings[0]?.id ?? createId(),
            days: input.days,
            startTime: input.startTime,
            endTime: input.endTime,
            building: input.building,
            room: input.room,
          },
        ],
      });
    } else {
      addManualCourse(input);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const exportPng = async () => {
    if (!exportRef.current) {
      toast.error(t("emptyTitle", { ns: PAGE.App }));
      return;
    }
    await exportNodeToPng(exportRef.current, `${slugify(settings.title)}.png`);
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
          <HoverIconButton variant="outline" size="sm" icon={RefreshIcon} onClick={() => setResetOpen(true)}>
            {t("header.reset", { ns: LANG_NS })}
          </HoverIconButton>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <PreferencesPopover />
            <HoverIconButton size="sm" icon={DownloadIcon} onClick={() => void exportPng()} disabled={visible.length === 0}>
              {t("header.exportPng", { ns: LANG_NS })}
            </HoverIconButton>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto overscroll-contain pt-1">
            <Timetable
              courses={visible}
              settings={settings}
              onBlockClick={openEdit}
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

      <CourseModal
        open={modalOpen}
        title={editing ? t("common.edit", { ns: LANG_NS }) : t("common.addCourse", { ns: LANG_NS })}
        submitLabel={editing ? t("common.save", { ns: LANG_NS }) : t("common.addCourse", { ns: LANG_NS })}
        initial={
          editing
            ? {
                courseCode: `${editing.subject} ${editing.courseNumber}`,
                section: editing.section,
                title: editing.title,
                term: editing.term,
                instructionalFormat: editing.instructionalFormat,
                courseType: editing.courseType,
                days: editing.meetings[0]?.days ?? [],
                startTime: editing.meetings[0]?.startTime ?? "09:00",
                endTime: editing.meetings[0]?.endTime ?? "10:30",
                building: editing.meetings[0]?.building,
                room: editing.meetings[0]?.room,
                instructor: editing.instructor,
                color: editing.color,
              }
            : { term: selectedTerm, color: settings.colorPreset === ColorPreset.Pastel ? "#DBEAFE" : undefined }
        }
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />

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
