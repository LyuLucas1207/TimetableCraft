#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

set -a
# shellcheck source=/dev/null
[ -f .env.prod.local ] && . ./.env.prod.local
set +a

CONTAINER_NAME="${TIMETABLECRAFT_WEB_CONTAINER:-TimetableCraft-WEB-Prod-Local}"

if sudo -E docker rm -f "$CONTAINER_NAME" 2>/dev/null; then
  echo "Removed / 已删除: $CONTAINER_NAME"
else
  echo "No such container / 无此容器: $CONTAINER_NAME"
fi
