/** Render public routes before shipping. Any incomplete page fails the build. */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { chromium } from "playwright";

const dist = resolve("dist");
const out = resolve(process.env.PRERENDER_OUT || "dist");
const paths = JSON.parse(readFileSync(new URL("../src/config/seo-routes.json", import.meta.url), "utf8"));
const shell = readFileSync(join(dist, "index.html"));
const types = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
let browser;
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = resolve(dist, `.${pathname}`);
  if (!file.startsWith(`${dist}/`) && file !== dist) { res.writeHead(404).end(); return; }
  if (paths.includes(pathname) || pathname === "/404") {
    res.writeHead(200, { "content-type": "text/html" }).end(shell); return;
  }
  try { res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});
try {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.PRERENDER_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
  const context = await browser.newContext({ locale: "en-CA", colorScheme: "light", reducedMotion: "reduce" });
  const results = [];
  for (const path of [...paths, "/404"]) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForSelector('meta[property="og:url"]', { state: "attached" });
    await page.waitForSelector("h1", { state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(({ path, indexable }) => {
      const one = selector => {
        const nodes = document.querySelectorAll(selector);
        if (nodes.length !== 1) throw new Error(`${selector}: expected 1, got ${nodes.length}`);
        return nodes[0];
      };
      const canonical = one('link[rel="canonical"]').href;
      if (new URL(canonical).pathname !== path) throw new Error(`Wrong canonical: ${canonical}`);
      if (new URL(canonical).origin !== "https://timetablecraft.com") throw new Error(`Non-production canonical: ${canonical}`);
      if (one('meta[property="og:url"]').content !== canonical) throw new Error("OG URL mismatch");
      one("title"); one("h1"); one('meta[name="description"]');
      for (const name of ["robots", "googlebot", "bingbot"]) {
        if (one(`meta[name="${name}"]`).content.includes("noindex") === indexable) throw new Error(`Wrong ${name} indexing policy`);
      }
      const graph = JSON.parse(one('script[type="application/ld+json"]').textContent);
      if (!graph["@graph"]?.length) throw new Error("Missing structured data graph");
      if (document.documentElement.lang !== "en") throw new Error("Expected stable English default");
      if (!document.querySelector('#root main')?.textContent.trim()) throw new Error("Empty main content");
      return { canonical, title: document.title };
    }, { path, indexable: paths.includes(path) });
    if (errors.length) throw new Error(`${path}: ${errors.join("; ")}`);
    results.push({ path, html: await page.content(), ...result });
    await page.close();
    console.log(`[prerender] verified ${path}`);
  }
  // Do not leave a partial set of new snapshots when validation fails.
  for (const { path, html } of results) {
    const dir = path === "/" ? out : join(out, path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html + "\n");
    if (path === "/404") writeFileSync(join(out, "404.html"), html + "\n");
  }
  const urls = results.filter(item => paths.includes(item.path)).map(item => `  <url><loc>${item.canonical}</loc></url>`).join("\n");
  writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  if (!existsSync(join(out, "robots.txt"))) throw new Error("Missing robots.txt");
  console.log(`[prerender] complete: ${results.length} pages and sitemap`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
