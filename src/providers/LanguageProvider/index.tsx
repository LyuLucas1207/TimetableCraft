import type { ReactNode } from "react";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import i18n from "./i18n";

function DocumentLang({ children }: { children: ReactNode }) {
  const { i18n: instance } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = instance.resolvedLanguage ?? "en";
  }, [instance.resolvedLanguage]);
  return children;
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <DocumentLang>{children}</DocumentLang>
    </I18nextProvider>
  );
}
