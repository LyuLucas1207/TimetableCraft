import { SITE } from "@/config";
import { APP_NAME, APP_URL, CONTACT_EMAIL } from "@/constants";

export const OG_IMAGE_PATH = "/og.png";
export const OG_IMAGE_URL = `${APP_URL}${OG_IMAGE_PATH}`;
export const OG_IMAGE_WIDTH = 1254;
export const OG_IMAGE_HEIGHT = 1254;
export const LOGO_PATH = "/apple-touch-icon.png";
export const LOGO_URL = `${APP_URL}${LOGO_PATH}`;
export const FAVICON_PATH = "/favicon.ico";
export const FAVICON_URL = `${APP_URL}${FAVICON_PATH}`;
export const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export const OG_LOCALE: Record<string, string> = {
  en: "en_CA",
  zh: "zh_CN",
  fr: "fr_CA",
};

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${APP_URL}/`;
  return `${APP_URL}${normalized}`;
}

export function organizationJsonLd(): JsonLd {
  return {
    "@type": "Organization",
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    url: APP_URL,
    email: CONTACT_EMAIL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
    },
    image: OG_IMAGE_URL,
    description: SITE.description,
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    name: APP_NAME,
    alternateName: "TimetableCraft",
    url: APP_URL,
    description: SITE.description,
    inLanguage: ["en", "zh", "fr"],
    publisher: { "@id": `${APP_URL}/#organization` },
  };
}

export function softwareJsonLd(
  description: string,
  url: string,
  name = `${APP_NAME} Schedule Maker`,
  alternateName: string[] = ["TimetableCraft Schedule Maker"],
): JsonLd {
  return {
    "@type": "SoftwareApplication",
    "@id": `${url.replace(/#.*$/, "")}#app`,
    name,
    alternateName,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Timetable maker",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
    description,
    url,
    image: OG_IMAGE_URL,
    author: { "@id": `${APP_URL}/#organization` },
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript. Runs entirely in the browser.",
    featureList: [
      "Manual course entry",
      "Local UBC Workday Excel parsing",
      "Weekly timetable grid",
      "Waitlist and dropped section styling",
      "PNG export",
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(entries: { question: string; answer: string }[], url?: string): JsonLd {
  return {
    "@type": "FAQPage",
    ...(url ? { url } : {}),
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function howToJsonLd(
  name: string,
  description: string,
  steps: { name: string; text: string; image?: string }[],
  url?: string,
): JsonLd {
  return {
    "@type": "HowTo",
    name,
    description,
    ...(url ? { url } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image ? { image: step.image } : {}),
    })),
  };
}

export function contactJsonLd(name: string, description: string): JsonLd {
  return {
    "@type": "ContactPage",
    "@id": `${APP_URL}/contact#page`,
    url: absoluteUrl("/contact"),
    name,
    description,
    mainEntity: { "@id": `${APP_URL}/#organization` },
  };
}

export function collectionJsonLd(name: string, description: string, url: string): JsonLd {
  return {
    "@type": "CollectionPage",
    name,
    description,
    url,
  };
}

export function graphJsonLd(nodes: JsonLd[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), websiteJsonLd(), ...nodes],
  };
}
