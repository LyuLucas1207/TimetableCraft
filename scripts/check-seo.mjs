/** Fail the build if public SEO files or English titles/descriptions drift out of range. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");
const json = (rel) => JSON.parse(read(rel));

const routes = json("src/config/seo-routes.json");
const required = ["/", "/tools", "/tools/schedule-maker", "/ubc-timetable-maker", "/guide", "/faq", "/contact"];
for (const path of required) {
  if (!routes.includes(path)) throw new Error(`seo-routes.json missing ${path}`);
}

const sitemap = read("public/sitemap.xml");
for (const path of required) {
  const loc = `https://timetablecraft.com${path === "/" ? "/" : path}`;
  if (!sitemap.includes(`<loc>${loc}</loc>`)) throw new Error(`sitemap.xml missing ${loc}`);
}

const robots = read("public/robots.txt");
for (const bot of ["GPTBot", "PerplexityBot", "ClaudeBot", "Sitemap:"]) {
  if (!robots.includes(bot)) throw new Error(`robots.txt missing ${bot}`);
}

const indexHtml = read("index.html");
for (const needle of ['rel="manifest"', "apple-touch-icon"]) {
  if (!indexHtml.includes(needle)) throw new Error(`index.html missing ${needle}`);
}
if (indexHtml.includes('rel="canonical"') || indexHtml.includes("application/ld+json")) {
  throw new Error("index.html must not ship homepage canonical/JSON-LD; Helmet + prerender own per-route tags");
}

const checks = [
  ["src/assets/language/en/pages/Home.json", "seoTitle", "seoDescription"],
  ["src/assets/language/en/pages/Tools.json", "seoTitle", "seoDescription"],
  ["src/assets/language/en/pages/Tools.json", "scheduleMakerSeoTitle", "scheduleMakerSeoDescription"],
  ["src/assets/language/en/pages/Ubc.json", "seoTitle", "seoDescription"],
  ["src/assets/language/en/pages/Guide.json", "seoTitle", "seoDescription"],
  ["src/assets/language/en/pages/FAQ.json", "seoTitle", "seoDescription"],
  ["src/assets/language/en/pages/About.json", "seoTitle", "seoDescription"],
];

for (const [file, titleKey, descKey] of checks) {
  const data = json(file);
  const title = data[titleKey];
  const description = data[descKey];
  if (typeof title !== "string" || title.length < 30 || title.length > 62) {
    throw new Error(`${file} ${titleKey} length ${title?.length}: ${title}`);
  }
  if (typeof description !== "string" || description.length < 120 || description.length > 165) {
    throw new Error(`${file} ${descKey} length ${description?.length}: ${description}`);
  }
  if (!/timetable|schedule|course table/i.test(`${title} ${description}`)) {
    throw new Error(`${file} is missing a target keyword`);
  }
}

console.log("SEO checks passed.");
