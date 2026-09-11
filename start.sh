#!/usr/bin/env bash
# 构建并启动 Web 容器（全程前台输出，不做静默）
set -euo pipefail

echo "==> loading menv (if present)"
export MENV_RUST="${MENV_RUST:-gnu}"
if [ -f /volume1/Environments/use-menv.sh ]; then
  # shellcheck source=/dev/null
  . /volume1/Environments/use-menv.sh || true
elif [ -f /home/ubuntu/Environments/use-menv.sh ]; then
  # shellcheck source=/dev/null
  . /home/ubuntu/Environments/use-menv.sh || true
fi

cd "$(dirname "$0")"
echo "==> cwd: $(pwd)"

echo "==> loading .env.prod.local (if present)"
set -a
# shellcheck source=/dev/null
[ -f .env.prod.local ] && . ./.env.prod.local
set +a

IMAGE_NAME="${TIMETABLECRAFT_WEB_IMAGE:-timetablecraft-web:prod-local}"
CONTAINER_NAME="${TIMETABLECRAFT_WEB_CONTAINER:-TimetableCraft-WEB-Prod-Local}"
HOST_PORT="${TIMETABLECRAFT_WEB_PORT:-10009}"
RESTART="${TIMETABLECRAFT_WEB_RESTART:-unless-stopped}"

# ASUSTOR 等精简 Linux 宿主机缺 libatk 等库，预渲染在 Playwright 官方镜像内执行
# 镜像 tag 必须与 package.json 里 playwright 版本一致，否则 chromium 二进制会对不上
echo "==> resolve Playwright version from package.json"
PLAYWRIGHT_VERSION="$(node -p "require('./package.json').devDependencies.playwright.replace(/^[^\d]*/, '')" || true)"
PLAYWRIGHT_VERSION="${PLAYWRIGHT_VERSION:-1.61.1}"
PRERENDER_IMAGE="${PRERENDER_IMAGE:-mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble}"
echo "    playwright=${PLAYWRIGHT_VERSION}"
echo "    image=${PRERENDER_IMAGE}"
echo "    web_image=${IMAGE_NAME}"
echo "    container=${CONTAINER_NAME}"
echo "    port=${HOST_PORT}"

echo "==> docker build -t ${IMAGE_NAME}"
sudo -E docker build -t "$IMAGE_NAME" "$@" .

echo "==> remove existing container (if any): ${CONTAINER_NAME}"
sudo -E docker rm -f "$CONTAINER_NAME" || true

echo "==> docker run ${CONTAINER_NAME} on :${HOST_PORT}"
sudo -E docker run -d --name "$CONTAINER_NAME" --restart="$RESTART" \
  -p "${HOST_PORT}:80" "$IMAGE_NAME"
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

  local base_url="http://localhost:${HOST_PORT}"
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
      -v "$(pwd)/node_modules:/app/node_modules:ro" \
      -v "$(pwd)/${out_dir}:/app/${out_dir}" \
      -w /app \
      -e PRERENDER_BASE_URL="http://host.docker.internal:${HOST_PORT}" \
      -e PRERENDER_OUT="/app/${out_dir}" \
      -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
      "$PRERENDER_IMAGE" \
      node scripts/prerender.mjs
  fi
}

if [ "${PRERENDER_SKIP:-0}" != "1" ]; then
  echo "==> wait for http://localhost:${HOST_PORT}/ before SEO prerender"
  ready=0
  for i in $(seq 1 30); do
    echo "    attempt ${i}/30 ..."
    if curl -f --max-time 2 \
      -w "    HTTP %{http_code}  bytes=%{size_download}  time=%{time_total}s\n" \
      -o ".prerender-health.html" \
      "http://localhost:${HOST_PORT}/"; then
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
  if run_prerender; then
    echo "==> docker cp prerender snapshots into ${CONTAINER_NAME}"
    sudo -E docker cp ".prerender-out/." "$CONTAINER_NAME":/usr/share/nginx/html/
    echo "==> prerender snapshots written into container"
  else
    echo "WARN: prerender failed; site runs as SPA only (bots without JS may see empty shell)" >&2
  fi
  echo "==> cleanup .prerender-out"
  rm -rf ".prerender-out"
else
  echo "==> PRERENDER_SKIP=1, skipping prerender"
fi

echo "==> done"
echo "Timetable Craft → http://localhost:${HOST_PORT}"
