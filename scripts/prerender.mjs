/**
 * 预渲染脚本：用 Playwright 渲染静态路由，写入 HTML 快照供 Googlebot 抓取。
 * 任一路由失败即退出，不跳过、不写半套快照。
 *
 * 环境变量:
 *   PRERENDER_BASE_URL  线上模式站点地址
 *   PRERENDER_OUT       输出目录（默认 dist/）
 *   PRERENDER_SKIP=1    跳过预渲染
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const PORT = 4173 + Math.floor(Math.random() * 1000);
const BASE_URL = process.env.PRERENDER_BASE_URL || "";
const OUT_DIR = process.env.PRERENDER_OUT ? resolve(process.env.PRERENDER_OUT) : DIST;
const INDEXABLE = JSON.parse(readFileSync(new URL("../src/config/seo-routes.json", import.meta.url), "utf8"));
const ROUTES = [...INDEXABLE, "/404"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

if (process.env.PRERENDER_SKIP === "1") {
  console.log("[prerender] PRERENDER_SKIP=1, skipped");
  process.exit(0);
}
if (!BASE_URL && !existsSync(join(DIST, "index.html"))) {
  console.error("[prerender] dist/index.html not found. Run vite build first.");
  process.exit(1);
}

const shellHtml = BASE_URL ? null : readFileSync(join(DIST, "index.html"));

function serveStatic(req, res) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const filePath = join(DIST, decodeURIComponent(url.pathname));

  if (!existsSync(filePath) || extname(filePath) === "") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellHtml);
    return;
  }
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
}

async function main() {
  let server = null;
  let base = BASE_URL.replace(/\/$/, "");
  if (!BASE_URL) {
    server = createServer(serveStatic);
    await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
    base = `http://127.0.0.1:${PORT}`;
    console.log(`[prerender] static server on ${base}`);
  } else {
    console.log(`[prerender] live mode against ${base}, out -> ${OUT_DIR}`);
  }

  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
  const context = await browser.newContext({ locale: "en-CA", reducedMotion: "reduce" });
  const results = [];

  try {
    for (const path of ROUTES) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      try {
        const response = await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 30000 });
        const status = response?.status() ?? 0;
        if (path === "/404") {
          if (status !== 404 && status !== 200) throw new Error(`HTTP ${status}`);
        } else if (!response?.ok()) {
          throw new Error(`HTTP ${status}`);
        }
        await page.waitForSelector("h1", { state: "attached", timeout: 15000 });
        await page.waitForSelector('link[rel="canonical"]', { state: "attached", timeout: 10000 });
        await page.waitForSelector('meta[name="description"]', { state: "attached", timeout: 10000 });
        const checked = await page.evaluate(({ path, indexable }) => {
          const one = selector => {
            const nodes = document.querySelectorAll(selector);
            if (nodes.length !== 1) throw new Error(`${selector}: expected 1, got ${nodes.length}`);
            return nodes[0];
          };
          const h1 = one("h1").textContent.trim();
          if (!h1) throw new Error("Empty h1");
          const title = one("title").textContent.trim();
          if (!title) throw new Error("Empty title");
          const description = one('meta[name="description"]').content.trim();
          if (!description) throw new Error("Empty description");
          const canonical = one('link[rel="canonical"]').href;
          if (new URL(canonical).pathname !== path) throw new Error(`Wrong canonical: ${canonical}`);
          const robots = one('meta[name="robots"]').content;
          if (robots.includes("noindex") === indexable) throw new Error(`Wrong robots: ${robots}`);
          return { canonical, title, h1 };
        }, { path, indexable: INDEXABLE.includes(path) });
        if (errors.length) throw new Error(errors.join("; "));
        const html = await page.content();
        if (!html.includes("/assets/") && path !== "/404") {
          throw new Error("Snapshot missing /assets/ refs");
        }
        results.push({ path, html, ...checked });
        console.log(`[prerender] ok  ${path}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server?.close();
  }

  for (const { path, html } of results) {
    const dir = path === "/" ? OUT_DIR : join(OUT_DIR, path.slice(1));
    mkdirSync(dir, { recursive: true });
    const snapshot = `<!DOCTYPE html>\n${html.replace(/^<!DOCTYPE html>/i, "").trim()}\n`;
    writeFileSync(join(dir, "index.html"), snapshot);
    if (path === "/404") writeFileSync(join(OUT_DIR, "404.html"), snapshot);
  }
  console.log(`[prerender] done: ${results.length}/${ROUTES.length} pages`);
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
