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
HOST_PORT="${TIMETABLECRAFT_WEB_PORT:-10009}"
RESTART="${TIMETABLECRAFT_WEB_RESTART:-unless-stopped}"

echo "==> docker build -t ${IMAGE_NAME}"
sudo -E docker build -t "$IMAGE_NAME" "$@" .

echo "==> remove existing container (if any): ${CONTAINER_NAME}"
sudo -E docker rm -f "$CONTAINER_NAME" || true

echo "==> docker run ${CONTAINER_NAME} on :${HOST_PORT}"
sudo -E docker run -d --name "$CONTAINER_NAME" --restart="$RESTART" \
  -p "${HOST_PORT}:80" "$IMAGE_NAME"
sudo -E docker ps --filter "name=^/${CONTAINER_NAME}$"

# HTML snapshots are already validated and included in the image.
echo "==> done"
echo "Timetable Craft → http://localhost:${HOST_PORT}"
