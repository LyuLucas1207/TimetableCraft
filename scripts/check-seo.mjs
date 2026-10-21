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
for (const path of routes) {
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

// Every planner tool needs its own keyword-bearing title and description, and the head terms must be on the money pages.
const planner = json("src/assets/language/en/pages/Planner.json");
for (const id of ["weekly", "study", "exam", "work", "daily", "routine", "custom"]) {
  const { seoTitle, seoDescription, maker } = planner.tools[id];
  if (typeof seoTitle !== "string" || seoTitle.length < 30 || seoTitle.length > 62) throw new Error(`planner ${id} seoTitle length ${seoTitle?.length}`);
  if (typeof seoDescription !== "string" || seoDescription.length < 120 || seoDescription.length > 165) throw new Error(`planner ${id} seoDescription length ${seoDescription?.length}`);
  if (!/(timetable|schedule) maker|planner/i.test(`${seoTitle} ${maker}`)) throw new Error(`planner ${id} lacks a maker keyword`);
}
for (const [file, key] of [["Home", "seoTitle"], ["Tools", "seoTitle"], ["Tools", "scheduleMakerSeoTitle"], ["Ubc", "seoTitle"]]) {
  const title = json(`src/assets/language/en/pages/${file}.json`)[key];
  if (!/timetable maker/i.test(title)) throw new Error(`${file}.${key} should contain "timetable maker": ${title}`);
}
const titles = new Set();
for (const id of Object.keys(planner.tools)) {
  const title = planner.tools[id].seoTitle;
  if (titles.has(title)) throw new Error(`duplicate title ${title}`);
  titles.add(title);
}
for (const path of routes) {
  if (!new RegExp(`<loc>https://timetablecraft.com${path === "/" ? "/" : path}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`).test(sitemap)) throw new Error(`sitemap.xml needs lastmod for ${path}`);
}

console.log("SEO checks passed.");
