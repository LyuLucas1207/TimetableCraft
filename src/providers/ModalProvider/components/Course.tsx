import { PAGE } from "@/assets/language";
import CourseForm from "@/components/courses/CourseForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hideModal, ModalTypeEnum, shouldSuppressDialogDismiss, useModalStore } from "@/stores/modal";
import { useTranslation } from "react-i18next";

export default function Course() {
  const { t } = useTranslation(PAGE.App);
  const isOpen = useModalStore((s) => s.courseModal.isOpen);
  const title = useModalStore((s) => s.courseModal.title);
  const submitLabel = useModalStore((s) => s.courseModal.submitLabel);
  const initial = useModalStore((s) => s.courseModal.initial);
  const autoOpenMeeting = useModalStore((s) => s.courseModal.autoOpenMeeting);

  const close = () => {
    if (shouldSuppressDialogDismiss()) return;
    hideModal(ModalTypeEnum.Course);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[85dvh] w-[calc(100%-1.25rem)] overflow-y-auto p-3 sm:max-w-lg sm:p-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("buildTitle")}</DialogDescription>
        </DialogHeader>
        {isOpen ? (
          <CourseForm
            key={`${initial?.courseCode ?? "new"}-${initial?.section ?? ""}-${(initial?.days ?? []).join("-")}-${initial?.startTime ?? ""}`}
            initial={initial}
            submitLabel={submitLabel}
            autoOpenMeeting={autoOpenMeeting}
            onCancel={close}
            onSubmit={(input) => {
              useModalStore.getState().courseModal.onSubmit?.(input);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
