#!/usr/bin/env bash
# 构建并启动 Web 容器（全程前台输出，不做静默）
set -euo pipefail

echo "==> loading menv (if present)"
# AquaWorks: source with || true. use-menv.sh runs `rustc --version | head -1`;
# SIGPIPE (141) would abort this script under set -e. MENV_RUST skips the TTY menu.
export MENV_RUST="${MENV_RUST:-gnu}"
MENV_SH=""
if [ -f /volume1/Environments/use-menv.sh ]; then
  MENV_SH=/volume1/Environments/use-menv.sh
elif [ -f /home/ubuntu/Environments/use-menv.sh ]; then
  MENV_SH=/home/ubuntu/Environments/use-menv.sh
fi
if [ -n "$MENV_SH" ]; then
  set +e
  # shellcheck source=/dev/null
  . "$MENV_SH" || true
  set -e
else
  echo "WARN: use-menv.sh not found; using whatever node is on PATH" >&2
fi

cd "$(dirname "$0")"
echo "==> cwd: $(pwd)"
echo "==> menv: ${MENV_SH:-none}"
echo "==> node: $(command -v node || true)"
case "$(command -v node || true)" in
  */Environments/.node/bin/node) ;;
  *)
    echo "ERROR: node must come from menv (Environments/.node/bin/node)" >&2
    exit 1
    ;;
esac

echo "==> loading .env.prod.local (if present)"
set -a
# shellcheck source=/dev/null
[ -f .env.prod.local ] && . ./.env.prod.local
set +a

IMAGE_NAME="${TIMETABLECRAFT_WEB_IMAGE:-timetablecraft-web:prod-local}"
CONTAINER_NAME="${TIMETABLECRAFT_WEB_CONTAINER:-TimetableCraft-WEB-Prod-Local}"
NAS_IP="${NAS_IP:-192.168.1.64}"
HOST_PORT="${TIMETABLECRAFT_WEB_PORT:-10401}"
RESTART="${TIMETABLECRAFT_WEB_RESTART:-unless-stopped}"

# ASUSTOR 等精简 Linux 宿主机缺 libatk 等库，预渲染在 Playwright 官方镜像内执行
# 镜像 tag 必须与【实际安装的】playwright 一致（node_modules / lockfile），
# 不能用 package.json 里的 ^range 去拼镜像，否则 chromium 路径会对不上
resolve_playwright_version() {
  node -e '
    const fs = require("fs");
    const read = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
    const installed = read("node_modules/playwright/package.json");
    if (installed?.version) { process.stdout.write(installed.version); process.exit(0); }
    const lock = read("package-lock.json");
    const locked = lock?.packages?.["node_modules/playwright"]?.version;
    if (locked) { process.stdout.write(locked); process.exit(0); }
    const declared = String(read("package.json")?.devDependencies?.playwright ?? "").replace(/^[^\d]*/, "");
    process.stdout.write(declared.split(" ")[0] || "1.63.0");
  ' 2>/dev/null || true
}

echo "==> resolve Playwright version from installed package / lockfile"
PLAYWRIGHT_VERSION="$(resolve_playwright_version)"
PLAYWRIGHT_VERSION="${PLAYWRIGHT_VERSION:-1.63.0}"
PRERENDER_IMAGE_OVERRIDE="${PRERENDER_IMAGE:-}"
PRERENDER_IMAGE="${PRERENDER_IMAGE_OVERRIDE:-mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble}"
echo "    playwright=${PLAYWRIGHT_VERSION}"
echo "    image=${PRERENDER_IMAGE}"
echo "    web_image=${IMAGE_NAME}"
echo "    container=${CONTAINER_NAME}"
echo "    port=${HOST_PORT}"

echo "==> docker build -t ${IMAGE_NAME}"
sudo -E docker build -t "$IMAGE_NAME" "$@" .

echo "==> remove existing container (if any): ${CONTAINER_NAME}"
sudo -E docker rm -f "$CONTAINER_NAME" || true

echo "==> docker run ${CONTAINER_NAME} on ${NAS_IP}:${HOST_PORT}"
sudo -E docker run -d --name "$CONTAINER_NAME" --restart="$RESTART" \
  -p "${NAS_IP}:${HOST_PORT}:80" "$IMAGE_NAME"
sudo -E docker ps --filter "name=^/${CONTAINER_NAME}$"

run_prerender() {
  local out_dir=".prerender-out"
  echo "==> prepare prerender output dir: ${out_dir}"
  rm -rf "$out_dir"
  mkdir -p "$out_dir"

  if [ ! -d node_modules/playwright ]; then
    echo "==> npm ci (playwright missing in node_modules)"
    npm ci
  else
    echo "==> node_modules/playwright present, skip npm ci"
  fi

  PLAYWRIGHT_VERSION="$(resolve_playwright_version)"
  PLAYWRIGHT_VERSION="${PLAYWRIGHT_VERSION:-1.63.0}"
  PRERENDER_IMAGE="${PRERENDER_IMAGE_OVERRIDE:-mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble}"
  echo "    playwright=${PLAYWRIGHT_VERSION}"
  echo "    image=${PRERENDER_IMAGE}"

  local base_url="http://${NAS_IP}:${HOST_PORT}"
  local run_mode="host"

  if [ "${PRERENDER_ON_HOST:-0}" = "1" ]; then
    echo "==> host prerender mode (PRERENDER_ON_HOST=1)"
    echo "==> npx playwright install chromium"
    if ! npx playwright install chromium; then
      echo "WARN: host Chromium unavailable, falling back to Playwright container" >&2
      run_mode="docker"
    else
      echo "==> node scripts/prerender.mjs (host) BASE=${base_url}"
      if ! PRERENDER_BASE_URL="$base_url" PRERENDER_OUT="$out_dir" node scripts/prerender.mjs; then
        echo "WARN: host prerender failed, falling back to Playwright container" >&2
        run_mode="docker"
        rm -rf "$out_dir"
        mkdir -p "$out_dir"
      else
        return 0
      fi
    fi
  else
    echo "==> default prerender mode: docker"
    run_mode="docker"
  fi

  if [ "$run_mode" = "docker" ]; then
    echo "==> docker pull ${PRERENDER_IMAGE}"
    sudo docker pull "$PRERENDER_IMAGE"
    echo "==> docker run prerender ( -t so Node stdout is unbuffered )"
    # -t: allocate TTY so Node line-buffers and progress shows live
    sudo docker run --rm -t --ipc=host --init \
      --add-host=host.docker.internal:host-gateway \
      -v "$(pwd)/scripts:/app/scripts:ro" \
      -v "$(pwd)/src/config:/app/src/config:ro" \
      -v "$(pwd)/node_modules:/app/node_modules:ro" \
      -v "$(pwd)/${out_dir}:/app/${out_dir}" \
      -w /app \
      -e PRERENDER_BASE_URL="http://${NAS_IP}:${HOST_PORT}" \
      -e PRERENDER_OUT="/app/${out_dir}" \
      -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
      "$PRERENDER_IMAGE" \
      node scripts/prerender.mjs
  fi
}

if [ "${PRERENDER_SKIP:-0}" != "1" ]; then
  echo "==> wait for http://${NAS_IP}:${HOST_PORT}/ before SEO prerender"
  ready=0
  for i in $(seq 1 30); do
    echo "    attempt ${i}/30 ..."
    if curl -f --max-time 2 \
      -w "    HTTP %{http_code}  bytes=%{size_download}  time=%{time_total}s\n" \
      -o ".prerender-health.html" \
      "http://${NAS_IP}:${HOST_PORT}/"; then
      echo "==> site ready (response saved to .prerender-health.html)"
      ready=1
      break
    fi
    echo "    not ready yet"
    sleep 1
  done
  rm -f ".prerender-health.html"
  if [ "$ready" != "1" ]; then
    echo "WARN: site did not become ready within 30s; trying prerender anyway" >&2
  fi

  echo "==> run_prerender"
  run_prerender
  echo "==> docker cp prerender snapshots into ${CONTAINER_NAME}"
  sudo -E docker cp ".prerender-out/." "$CONTAINER_NAME":/usr/share/nginx/html/
  echo "==> prerender snapshots written into container"
  echo "==> cleanup .prerender-out"
  rm -rf ".prerender-out"
else
  echo "==> PRERENDER_SKIP=1, skipping prerender"
fi

echo "==> done"
echo "Timetable Craft → http://${NAS_IP}/timetablecraft.com/  (also http://${NAS_IP}:${HOST_PORT})"
