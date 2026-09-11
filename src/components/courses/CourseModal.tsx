import { PAGE } from "@/assets/language";
import CourseForm from "@/components/courses/CourseForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ManualCourseInput } from "@/stores/schedule";
import { useTranslation } from "react-i18next";

interface CourseModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  initial?: Partial<ManualCourseInput>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ManualCourseInput) => void;
}

export default function CourseModal({ open, title, submitLabel, initial, onOpenChange, onSubmit }: CourseModalProps) {
  const { t } = useTranslation(PAGE.App);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("buildTitle")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <CourseForm
            key={`${initial?.courseCode ?? "new"}-${initial?.section ?? ""}`}
            initial={initial}
            submitLabel={submitLabel}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
