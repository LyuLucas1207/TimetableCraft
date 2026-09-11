export const APP_NAME = "Timetable Craft";
export const APP_DOMAIN = "timetablecraft.com";
export const APP_URL = (import.meta.env.VITE_SITE_URL || "https://timetablecraft.com").replace(/\/$/, "");
export const CONTACT_EMAIL = "lyuchongkai@gmail.com";

export function buildMailto(subject: string, body?: string) {
  const query = [`subject=${encodeURIComponent(subject)}`];
  if (body) query.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${CONTACT_EMAIL}?${query.join("&")}`;
}

export const CONTACT_MAILTO = buildMailto("Timetable Craft");
