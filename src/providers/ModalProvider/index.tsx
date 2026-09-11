import type { ReactNode } from "react";

import { Course, MeetingTime } from "./components";

export default function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Course />
      <MeetingTime />
    </>
  );
}
