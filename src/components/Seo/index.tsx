import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { SITE } from "@/config";
import { APP_NAME } from "@/constants";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_LOCALE,
  absoluteUrl,
  graphJsonLd,
  type JsonLd,
} from "@/utils/seo";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  jsonLd?: JsonLd | JsonLd[];
}

export default function Seo({ title, description, path = "/", keywords = SITE.keywords, jsonLd }: SeoProps) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en").split("-")[0];
  const locale = OG_LOCALE[lang] ?? OG_LOCALE.en;
  const url = absoluteUrl(path);
  const extras = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const structured = graphJsonLd(extras);

  return (
    <Helmet prioritizeSeoTags>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={APP_NAME} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="theme-color" content="#0f2744" />
      <link rel="canonical" href={url} />
      <link rel="image_src" href={OG_IMAGE_URL} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="en_CA" />
      <meta property="og:locale:alternate" content="zh_CN" />
      <meta property="og:locale:alternate" content="fr_CA" />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:secure_url" content={OG_IMAGE_URL} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={`${APP_NAME} — UBC Workday Excel to weekly timetable`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />
      <meta name="twitter:image:alt" content={`${APP_NAME} timetable preview`} />

      <script type="application/ld+json">{JSON.stringify(structured)}</script>
    </Helmet>
  );
}
