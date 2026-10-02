<p align="center">
  <img src="./public/apple-touch-icon.png" alt="Timetable Craft" width="160" />
</p>

# Timetable Craft

**EN** — Craft your time. A frontend-only toolkit for class timetables, weekly schedules, study, exams, work, daily planning and routines. Start with a template or add events yourself. University Excel import remains available in Class Timetable. Nothing is uploaded.

**中文** — 为课程、工作、学习与日常生活制作时间表的纯前端工具站。支持模板、手动事件和大学课程导入，数据保存在本地浏览器。

| | |
| --- | --- |
| Site / 站点 | [https://timetablecraft.com](https://timetablecraft.com) |
| Contact / 联系 | [lyuchongkai@gmail.com](mailto:lyuchongkai@gmail.com) |
| Languages / 语言 | English · 中文 · Français |
| Theme / 主题 | light / dark / system |
| Data / 数据 | `localStorage` only; separate keys per tool |
| Affiliation / 关系 | Independent student project. **Not affiliated with UBC or Workday.** / 独立学生项目，**与 UBC、Workday 无关。** |

Workday remains the source of record. Always confirm times and rooms there.

选课与时间以 Workday 为准，请到那里核对。

---

## Contents / 目录

- [What it does / 能做什么](#what-it-does--能做什么)
- [Pages / 页面](#pages--页面)
- [Repository layout / 目录结构](#repository-layout--目录结构)
- [Toolchain (menv) / 工具链](#toolchain-menv--工具链)
- [Local development / 本地开发](#local-development--本地开发)
- [Environment files / 环境文件](#environment-files--环境文件)
- [npm scripts](#npm-scripts)
- [Docker + nginx](#docker--nginx)
- [Public domain / 公网域名](#public-domain--公网域名)
- [Icons & brand / 图标与品牌](#icons--brand--图标与品牌)
- [Schedule Maker internals / 课表制作器原理](#schedule-maker-internals--课表制作器原理)
- [i18n & theme / 语言与主题](#i18n--theme--语言与主题)
- [Google SEO](#google-seo)
- [Privacy / 隐私](#privacy--隐私)

---

## What it does / 能做什么

- Import a Workday **View My Courses** `.xlsx` / `.xls` locally. Columns are matched by header name (`Course Listing`, `Section`, `Registration Status`, `Meeting Patterns`, `Instructor`, dates, …).
- 本地导入 Workday **View My Courses** 表格。按表头识别列，不把文件发到服务器。
- `Course[]` stays in the course editor; an adapter converts it into `ScheduleEvent[]`. Every tool uses `TimetableEngine` for layout and rendering.
- 课程与通用事件通过适配器衔接，全部工具共用渲染器。
- **Active** = solid block, **Waitlist** = dashed, **Dropped** = dotted. Nothing is placed until you check it.
- **在读**实线、**候补**虚线、**已退**点线。识别后不会自动上表，必须勾选。
- Terms: Winter Term 1 / 2, Summer Term 1 / 2 (`W1` `W2` `S1` `S2`).
- Appearance: brand, title, colors, grid, block style. PNG captures the timetable card only.
- 外观可改品牌、标题、颜色和格子。PNG 只截课表卡片，不含周围编辑区。
- Seven additional planners include editable starter templates, weekends, dated events, PNG / ICS export, and browser Print / Save as PDF.
- Study Planner can copy the current class timetable; copied blocks can be edited independently.
- Each planner has its own Zustand store and `timetablecraft:planner:<id>:v1` persistence key. A factory shares behavior without sharing state.
- PDF uses the browser print dialog. Overnight shifts should be split into separate days; Smart Fill and semester milestone views remain planned.

---

## Pages / 页面

| Path | Page | Indexable |
| --- | --- | --- |
| `/` | Landing / 首页 | yes |
| `/tools` | Tool index / 工具列表 | yes |
| `/tools/schedule-maker` | Class Timetable / 课表制作器 | yes |
| `/tools/weekly-schedule` | Weekly Schedule | yes |
| `/tools/study-planner` | Study Planner | yes |
| `/tools/exam-timetable` | Exam Timetable | yes |
| `/tools/work-schedule` | Work Schedule | yes |
| `/tools/daily-planner` | Daily Planner | yes |
| `/tools/routine-planner` | Routine Planner | yes |
| `/tools/custom-timetable` | Custom Timetable | yes |
| `/guide` | How to export Excel from Workday / 导出指南 | yes |
| `/faq` | FAQ / 常见问题 | yes |
| `/contact` | About + email / 介绍与联系 | yes |
| `/404` | Not found / 未找到 | **noindex** |

Legacy aliases (client redirect):

| From | To |
| --- | --- |
| `/app` | `/tools/schedule-maker` |
| `/about` `/features` `/privacy` | `/contact` |

Unknown URLs render `/404` with `noindex` (no silent redirect to home — that would be a Google soft-404).

未知地址渲染 `/404` 并 `noindex`，不会默默跳回首页（否则 Google 会当成 soft-404）。

---

## Repository layout / 目录结构

```
TimetableCraft-WEB/
├── Dockerfile                 # Node 22 build → nginx 1.27 static
├── start.sh                   # menv → docker build/run → Playwright prerender
├── stop.sh                    # docker rm container
├── .env.dev                   # Vite --mode dev        (port 10404)
├── .env.prod                  # Vite --mode prod        (canonical https://timetablecraft.com)
├── .env.prod.local            # Vite --mode prod.local  + docker names/port 10401
├── nginx/
│   ├── default.conf           # inside the container (SPA + cache)
│   └── timetablecraft.com.conf  # host / edge TLS reverse proxy sample
├── public/                    # copied as-is into dist/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── og.png
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   └── 404.html
├── scripts/prerender.mjs      # Playwright HTML snapshots for Googlebot
└── src/
    ├── pages/                 # Home, Tools, ScheduleMaker, Guide, FAQ, About, NotFound
    ├── components/            # Seo, timetable, courses, schedule workspace, shadcn ui
    ├── parser/                # Excel + meeting pattern + course listing
    ├── stores/schedule.ts     # zustand + localStorage
    ├── providers/             # router, i18n, theme
    ├── assets/language/       # en / zh / fr JSON
    └── utils/seo.ts           # canonical, OG, JSON-LD helpers
```

Stack / 技术栈: React 19, Vite 8, TypeScript, Tailwind 4, React Router 8, i18next, zustand, xlsx, html-to-image, react-helmet-async, Playwright (prerender only).

---

## Toolchain (menv) / 工具链

Host `node` / `npm` **must** come from `/volume1/Environments`. Do not use a distro or nvm Node.

宿主机的 `node` / `npm` **必须**来自 `/volume1/Environments`，不要用系统或 nvm 的 Node。

```bash
source /volume1/Environments/use-menv.sh
```

`use-menv.sh` loads Go / Rust / Node / Java / Atlas / Buf. This repo only needs Node; equivalent:

这个仓库只用到 Node，也可以只加载：

```bash
source /volume1/Environments/use-node.sh
```

Expected binary / 期望路径:

```
/volume1/Environments/.node/bin/node
```

`./start.sh` sources `use-menv.sh` itself (`MENV_RUST=gnu` so it does not prompt), prints `which node`, and **exits** if the path is not `Environments/.node/bin/node`.

`./start.sh` 会自己 source menv，并检查 node 路径；不对就退出。

Docker image build still uses `node:22-alpine` **inside the container**. menv is only for host-side `node` / `npm` (reading Playwright’s version from `package.json`, and `npm ci` before prerender).

镜像构建仍用容器内的 `node:22-alpine`。menv 只服务宿主机上的 `node`/`npm`。

---

## Local development / 本地开发

```bash
cd /volume1/Projects/TimetableCraft/TimetableCraft-WEB
source /volume1/Environments/use-menv.sh
npm ci
npm run dev
```

Vite reads `.env.dev` and listens on **http://localhost:10404** (`host: 0.0.0.0`).

To run against the same env Docker uses:

用和 Docker 相同的 `prod.local` 环境：

```bash
npm run dev:prod-local    # http://192.168.1.64:10401
```

To preview a production-canonical build (OG/canonical URLs point at timetablecraft.com):

预览正式域名元数据（canonical / OG 指向线上）：

```bash
npm run dev:prod          # http://localhost:10405
```

---

## Environment files / 环境文件

Vite `--mode X` loads `.env` then `.env.X`. Scripts pass `--mode` explicitly.

| File | Mode | `VITE_PORT` | `VITE_SITE_URL` | Also used by |
| --- | --- | --- | --- | --- |
| `.env.dev` | `dev` | `10404` | `http://localhost:10404` | `npm run dev` |
| `.env.prod` | `prod` | `10405` | `https://timetablecraft.com` | `npm run build` / `dev:prod` |
| `.env.prod.local` | `prod.local` | `10401` | `http://192.168.1.64:10401` | `build:prod-local`, `start.sh`, `stop.sh` |

`.env.prod.local` extra keys (docker):

| Key | Default |
| --- | --- |
| `TIMETABLECRAFT_WEB_IMAGE` | `timetablecraft-web:prod-local` |
| `TIMETABLECRAFT_WEB_CONTAINER` | `TimetableCraft-WEB-Prod-Local` |
| `TIMETABLECRAFT_WEB_PORT` | `10401` |
| `TIMETABLECRAFT_WEB_RESTART` | `always` |

`*.local` is gitignored; `!.env.prod.local` is force-included so the NAS deploy file is shared.

`src/constants/index.ts` sets `APP_URL` from `VITE_SITE_URL` (fallback `https://timetablecraft.com`). That URL is used for canonical, Open Graph, sitemap-facing JSON-LD, and share images.

---

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite `--mode dev` |
| `npm run dev:prod-local` | Vite `--mode prod.local` |
| `npm run dev:prod` | Vite `--mode prod` |
| `npm run build` | `tsc -b` + Vite `--mode prod` |
| `npm run build:prod-local` | `tsc -b` + Vite `--mode prod.local` (what Docker runs) |
| `npm run build:dev` | `tsc -b` + Vite `--mode dev` |
| `npm run prerender` | Playwright snapshots (needs a built `dist/` or `PRERENDER_BASE_URL`) |
| `npm run preview` | Vite preview `--mode prod.local` |
| `npm run lint` | oxlint |

---

## Docker + nginx

Same pattern as AquaWorks-WEB: multi-stage `Dockerfile`, container nginx, host reverse proxy, `start.sh` / `stop.sh`.

和 AquaWorks-WEB 同一套：多阶段镜像、容器内 nginx、宿主机反代、`start.sh` / `stop.sh`。

### Container / 容器

| | |
| --- | --- |
| Image | `timetablecraft-web:prod-local` |
| Container | `TimetableCraft-WEB-Prod-Local` |
| Publish | **10401 → 80** |
| Restart | `always` |
| Build | `npm run build:prod-local` inside `node:22-alpine` |
| Serve | `nginx:1.27-alpine` + `nginx/default.conf` |

`nginx/default.conf` (inside the container):

- SPA fallback: `try_files $uri $uri/index.html $uri/ /index.html` (so prerendered `/guide/index.html` wins when present)
- `/assets/` hashed bundles: 1 year, immutable
- `robots.txt` / `sitemap.xml` / icons / manifest: shorter public cache
- gzip for HTML/CSS/JS/JSON/XML/SVG/manifest

### Start / stop

```bash
chmod +x start.sh stop.sh
./start.sh                 # menv → docker build → run :10401 → prerender into the container
./stop.sh                  # docker rm -f TimetableCraft-WEB-Prod-Local
```

`start.sh` extra flags / 可选环境变量:

| Variable | Effect |
| --- | --- |
| `PRERENDER_SKIP=1` | Skip Playwright; SPA shell only |
| `PRERENDER_ON_HOST=1` | Try host Chromium first, fall back to Playwright Docker image |
| `PRERENDER_IMAGE` | Override `mcr.microsoft.com/playwright:v<installed playwright version>-noble` |
| `MENV_RUST` | Default `gnu` in `start.sh` so menv does not prompt |

Skip prerender:

```bash
PRERENDER_SKIP=1 ./start.sh
```

Pass extra `docker build` args through:

```bash
./start.sh --build-arg FOO=bar
```

After a successful start: **http://192.168.1.64:10401**

Prerender writes HTML snapshots for `/`, `/tools`, `/tools/schedule-maker`, `/guide`, `/faq`, `/contact`, `/404`, then `docker cp` them into `/usr/share/nginx/html/` so Googlebot can see real `<h1>` / JSON-LD without executing the SPA.

预渲染把上述路由的 HTML 快照拷进容器。Googlebot 不依赖执行 SPA 空壳。

ASUSTOR hosts often lack Playwright’s system libraries, so the default prerender path is the official Playwright Docker image, with `host.docker.internal` pointing at port 10401.

ASUSTOR 等精简宿主机通常缺 Chromium 依赖，所以默认在 Playwright 官方镜像里跑预渲染，通过 `NAS_IP:10401` 访问刚启动的站点。

---

## Public domain / 公网域名

Canonical host: **https://timetablecraft.com** (www should 301 to apex).

Sample edge config: `nginx/timetablecraft.com.conf`

1. Keep the container on `NAS_IP:10401`.
2. Install that server block on NAS / edge nginx (or the ASUSTOR reverse-proxy UI equivalent).
3. Uncomment `ssl_certificate` / `ssl_certificate_key` (Let’s Encrypt or ASUSTOR certs).
4. HTTP and `www` redirect to `https://timetablecraft.com`.

DNS: `A` / `AAAA` (or CNAME) for `timetablecraft.com` and `www` → this NAS / edge.

---

## Icons & brand / 图标与品牌

All public brand files are in `public/` and are wired in `index.html`, `site.webmanifest`, Open Graph, Twitter cards, and JSON-LD.

| File | Use |
| --- | --- |
| `public/favicon.ico` | Tab favicon |
| `public/apple-touch-icon.png` | Apple touch icon + Organization `logo` |
| `public/og.png` | `og:image` / `twitter:image` |
| `public/site.webmanifest` | PWA name, theme `#0f2744`, icons |
| `src/assets/logo_no_background.png` | In-app logo (header / home) |

Theme color: `#0f2744`.

---

## Schedule Maker internals / 课表制作器原理

1. `src/parser/excelParser.ts` reads the sheet in-browser with `xlsx`. Headers are matched by alias (case-insensitive).
2. `courseListingParser.ts` / `meetingPatternParser.ts` / `termParser.ts` turn rows into `Course` objects (`src/types/course.ts`).
3. Labs with a blank meeting pattern stay in the list as **unscheduled** so you can add a time.
4. `src/stores/schedule.ts` (zustand `persist`) writes `localStorage` key `timetablecraft:v1`. Legacy key `ubcexceltoschedule:v3` is still read.
5. Credits count unique **subject + number + term** (a lecture + discussion of the same course do not double).
6. PNG export (`html-to-image`) snapshots the timetable card only.

Excel is never rewritten and never posted.

Excel 不会被回写，也不会 POST 到任何服务器。

---

## i18n & theme / 语言与主题

- Copy: `src/assets/language/{en,zh,fr}/`
- Detector: `localStorage` key `timetablecraft:lng`, then `navigator`
- Theme: `localStorage` key `timetablecraft:theme` (`light` / `dark` / `system`); `index.html` applies a boot class before React hydrates to avoid a flash

Language is **not** in the URL today. Google therefore sees English (the prerender locale). URL prefixes `/zh` `/fr` + `hreflang` are a planned SEO follow-up (same idea as AquaWorks).

语言目前只存在 `localStorage`，预渲染是英文。把语言放进 URL（`/zh`、`/fr`）是后续 SEO 项。

---

## Google SEO

### Already in the repo / 仓库里已有

| Item | Where |
| --- | --- |
| Prerendered HTML for crawlers | `start.sh` + `scripts/prerender.mjs` |
| `robots.txt` (Allow Googlebot) | `public/robots.txt` |
| Sitemap | `https://timetablecraft.com/sitemap.xml` |
| Canonical, OG, Twitter, `googlebot` / `bingbot` | `index.html` + `src/components/Seo` |
| JSON-LD Organization / WebSite / SoftwareApplication | `src/utils/seo.ts` |
| FAQPage + HowTo + BreadcrumbList | FAQ / Guide pages |
| Soft-404 fix (`noindex` on `/404`) | `src/pages/NotFound` |
| Asset / crawler file caching | `nginx/default.conf` |

### Search Console checklist / 上线后要做

1. Add URL-prefix property `https://timetablecraft.com` **and** Domain property `timetablecraft.com`.
2. Verify with DNS TXT, **or** drop the Search Console HTML file into `public/` and redeploy.
3. Submit `https://timetablecraft.com/sitemap.xml`.
4. Request indexing for `/` and `/tools/schedule-maker`.
5. **URL Inspection**: confirm Google sees prerendered `<h1>` / JSON-LD, not an empty `#root`.
6. **Page indexing**: watch soft-404s, leftover redirects (`/app`, `/about`), crawled-but-not-indexed.
7. **Core Web Vitals** (mobile LCP / INP / CLS).
8. Optional: Rich Results Test on `/faq` (FAQPage) and `/guide` (HowTo).

### Later / 后续

- URL-based locales (`/zh`, `/fr`) + `hreflang`, so Chinese/French can be indexed.
- A dedicated 1200×630 `og.png` if social previews look cropped (current share image is the same brand art as the touch icon).
- Sitemap `lastmod` generated at build time.

---

## Privacy / 隐私

Parsing, layout, appearance, and PNG export all run in this tab. Closing the page does not send the Excel anywhere. Reset deletes the saved schedule from this browser only.

解析、排课、外观和 PNG 都在当前标签页完成。关掉页面也不会把 Excel 发出去。重置只删这个浏览器里的课表。

Not affiliated with the University of British Columbia or Workday.

与 UBC、Workday 无隶属关系。


## Planner development and verification

- Roadmap and scope: [docs/planner-roadmap.md](docs/planner-roadmap.md).
- Tool definitions/templates: `src/config/planners.ts`.
- Event model/adapter: `src/types/schedule.ts`, `src/utils/schedule.ts`.
- Shared renderer: `src/components/timetable/TimetableEngine.tsx`.
- Independent stores: `src/stores/planners.ts` (one store instance and key per tool).
- Shared planner editor: `src/components/planner/PlannerWorkspace.tsx`.

Run `npm run build`, `npm run lint`, and `npm run test:seo`.
For browser regression checks, start Vite on port 10020 and run
`npm run test:planners`. Override `TEST_BASE_URL` or `CHROME_PATH` as needed.
The tests use a fresh browser context, cover editing, persistence isolation,
weekends, exact dates, class copying, templates, PNG/ICS downloads, print-image
preparation, mobile layouts and translations. Screenshots go to `/tmp/timetablecraft-qa`.
