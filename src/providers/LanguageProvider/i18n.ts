import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { NAMESPACES, RESOURCES } from "@/assets/language";
import { AppLanguage, DEFAULT_LANGUAGE } from "@/config";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.values(AppLanguage),
    ns: [...NAMESPACES],
    defaultNS: "language",
    fallbackNS: "language",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "timetablecraft:lng",
      caches: ["localStorage"],
    },
  });

export default i18n;
