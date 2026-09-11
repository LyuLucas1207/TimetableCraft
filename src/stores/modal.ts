import { create } from "zustand";

import type { Course, WeekDay } from "@/types/course";
import type { ManualCourseInput } from "@/stores/schedule";

export enum ModalTypeEnum {
  Course = "course",
  MeetingTime = "meetingTime",
}

export interface MeetingTimeValue {
  days: WeekDay[];
  startTime: string;
  endTime: string;
}

export interface CourseModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  initial?: Partial<ManualCourseInput>;
  autoOpenMeeting?: boolean;
  editing?: Course | null;
  onSubmit?: (input: ManualCourseInput) => void;
}

export interface MeetingTimeModalProps {
  isOpen: boolean;
  days: WeekDay[];
  startTime: string;
  endTime: string;
  onApply?: (next: MeetingTimeValue) => void;
  onCancel?: () => void;
}

type ModalShowProps = CourseModalProps | MeetingTimeModalProps;

interface ModalState {
  modalType: ModalTypeEnum | undefined;
  courseModal: CourseModalProps;
  meetingTimeModal: MeetingTimeModalProps;
  parentDismissGuardUntil: number;
}

interface ModalActions {
  showModal: (modalType: ModalTypeEnum, props: ModalShowProps) => void;
  hideModal: (modalType?: ModalTypeEnum) => void;
}

const defaultCourseModalProps: CourseModalProps = {
  isOpen: false,
  title: "",
  submitLabel: "",
  initial: undefined,
  autoOpenMeeting: false,
  editing: null,
  onSubmit: undefined,
};

const defaultMeetingTimeModalProps: MeetingTimeModalProps = {
  isOpen: false,
  days: [],
  startTime: "",
  endTime: "",
  onApply: undefined,
  onCancel: undefined,
};

const STACKABLE_MODAL_TYPES: ReadonlySet<ModalTypeEnum> = new Set([ModalTypeEnum.MeetingTime]);
const PARENT_DISMISS_GUARD_MS = 200;

function resolveActiveModalType(state: Pick<ModalState, "courseModal" | "meetingTimeModal">): ModalTypeEnum | undefined {
  if (state.meetingTimeModal.isOpen) return ModalTypeEnum.MeetingTime;
  if (state.courseModal.isOpen) return ModalTypeEnum.Course;
  return undefined;
}

function omitIsOpen<T extends { isOpen?: boolean }>(props: T): Omit<T, "isOpen"> {
  const rest = { ...props };
  delete rest.isOpen;
  return rest as Omit<T, "isOpen">;
}

export const useModalStore = create<ModalState & ModalActions>((set, get) => ({
  modalType: undefined,
  courseModal: defaultCourseModalProps,
  meetingTimeModal: defaultMeetingTimeModalProps,
  parentDismissGuardUntil: 0,

  showModal: (modalType, props) => {
    switch (modalType) {
      case ModalTypeEnum.Course: {
        const restProps = omitIsOpen(props as CourseModalProps);
        set({
          modalType,
          meetingTimeModal: defaultMeetingTimeModalProps,
          courseModal: {
            isOpen: true,
            ...restProps,
          },
        });
        break;
      }
      case ModalTypeEnum.MeetingTime: {
        const restProps = omitIsOpen(props as MeetingTimeModalProps);
        set({
          modalType,
          meetingTimeModal: {
            isOpen: true,
            ...restProps,
          },
        });
        break;
      }
    }
  },

  hideModal: (modalType) => {
    if (modalType === undefined) {
      set({
        modalType: undefined,
        courseModal: defaultCourseModalProps,
        meetingTimeModal: defaultMeetingTimeModalProps,
        parentDismissGuardUntil: 0,
      });
      return;
    }

    const patch: Partial<ModalState> = {};
    switch (modalType) {
      case ModalTypeEnum.Course:
        patch.courseModal = defaultCourseModalProps;
        patch.meetingTimeModal = defaultMeetingTimeModalProps;
        break;
      case ModalTypeEnum.MeetingTime:
        patch.meetingTimeModal = defaultMeetingTimeModalProps;
        break;
    }

    if (STACKABLE_MODAL_TYPES.has(modalType)) {
      patch.parentDismissGuardUntil = performance.now() + PARENT_DISMISS_GUARD_MS;
    }
    patch.modalType = resolveActiveModalType({ ...get(), ...patch });
    set(patch);
  },
}));

export function shouldSuppressDialogDismiss(): boolean {
  const state = useModalStore.getState();
  if (performance.now() < state.parentDismissGuardUntil) return true;
  return state.meetingTimeModal.isOpen;
}

const showModal = useModalStore.getState().showModal;
const hideModal = useModalStore.getState().hideModal;

export { showModal, hideModal };

export interface ShowCourseModalProps {
  title: string;
  submitLabel: string;
  initial?: Partial<ManualCourseInput>;
  autoOpenMeeting?: boolean;
  editing?: Course | null;
  onSubmit: (input: ManualCourseInput) => void;
}

export const showCourseModal = (props: ShowCourseModalProps) => {
  showModal(ModalTypeEnum.Course, {
    isOpen: true,
    title: props.title,
    submitLabel: props.submitLabel,
    initial: props.initial,
    autoOpenMeeting: props.autoOpenMeeting,
    editing: props.editing,
    onSubmit: props.onSubmit,
  });
};

export interface ShowMeetingTimeModalProps {
  days: WeekDay[];
  startTime: string;
  endTime: string;
  onApply: (next: MeetingTimeValue) => void;
  onCancel?: () => void;
}

export const showMeetingTimeModal = (props: ShowMeetingTimeModalProps) => {
  showModal(ModalTypeEnum.MeetingTime, {
    isOpen: true,
    days: props.days,
    startTime: props.startTime,
    endTime: props.endTime,
    onApply: props.onApply,
    onCancel: props.onCancel,
  });
};
