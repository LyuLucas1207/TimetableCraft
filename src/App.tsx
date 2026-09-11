import { Navigate, Route, Routes } from "react-router";

import { Main, Tool } from "@/layouts";
import { ROUTES } from "@/navigations";
import { AboutPage, FAQPage, GuidePage, HomePage, ScheduleMakerPage, ToolsPage } from "@/pages";

export default function App() {
  return (
    <Routes>
      <Route element={<Main />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.TOOLS} element={<ToolsPage />} />
        <Route path={ROUTES.GUIDE} element={<GuidePage />} />
        <Route path={ROUTES.FAQ} element={<FAQPage />} />
        <Route path={ROUTES.CONTACT} element={<AboutPage />} />
      </Route>

      <Route element={<Tool />}>
        <Route path={ROUTES.TOOL_SCHEDULE_MAKER} element={<ScheduleMakerPage />} />
      </Route>

      <Route path="/app" element={<Navigate to={ROUTES.TOOL_SCHEDULE_MAKER} replace />} />
      <Route path="/about" element={<Navigate to={ROUTES.CONTACT} replace />} />
      <Route path="/features" element={<Navigate to={ROUTES.CONTACT} replace />} />
      <Route path="/privacy" element={<Navigate to={ROUTES.CONTACT} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
