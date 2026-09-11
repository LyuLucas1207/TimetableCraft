import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { SITE } from "@/config";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
}

export default function Seo({ title, description, path = "/" }: SeoProps) {
  const url = `${SITE.url}${path}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
    description,
    url,
    image: `${SITE.url}/og.png`,
  });

  useEffect(() => {
    const existing = document.getElementById("jsonld-app") as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.id = "jsonld-app";
    script.type = "application/ld+json";
    script.textContent = jsonLd;
    if (!existing) document.head.appendChild(script);
    return () => {
      script.textContent = jsonLd;
    };
  }, [jsonLd]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SITE.keywords} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:image" content={`${SITE.url}/og.png`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:image" content={`${SITE.url}/og.png`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
