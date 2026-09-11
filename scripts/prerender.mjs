/**
 * 预渲染脚本：用 Playwright 渲染静态路由，写入 HTML 快照供 Googlebot 抓取。
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

const ROUTES = ["/", "/tools", "/tools/schedule-maker", "/guide", "/faq", "/contact", "/404"];

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

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({ locale: "en-CA" });
  const page = await context.newPage();

  let ok = 0;
  for (const route of ROUTES) {
    const path = route;
    const url = `${base}${path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForSelector("#root > *", { timeout: 10000 });
      await page.waitForTimeout(500);
      const html = await page.content();

      const outDir = path === "/" ? OUT_DIR : join(OUT_DIR, path.slice(1));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "index.html"), `<!DOCTYPE html>\n${html.replace(/^<!DOCTYPE html>/i, "").trim()}\n`);
      ok += 1;
      console.log(`[prerender] ok  ${path}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[prerender] fail ${path}: ${message}`);
    }
  }

  await browser.close();
  server?.close();

  const rootIndex = join(OUT_DIR, "index.html");
  if (existsSync(rootIndex)) {
    const rootHtml = readFileSync(rootIndex, "utf8");
    if (!rootHtml.includes("/assets/")) {
      console.warn("[prerender] root snapshot missing asset refs" + (shellHtml ? ", restoring original shell" : ""));
      if (shellHtml) writeFileSync(rootIndex, shellHtml);
    }
  }

  const total = ROUTES.length;
  console.log(`[prerender] done: ${ok}/${total} pages`);
  if (ok === 0) process.exit(1);
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
