#!/bin/sh
set -eu

service_port="${PORT:-${ALCHEMY_API_PORT:-8000}}"
web_concurrency="${WEB_CONCURRENCY:-1}"

printf '{"event":"api_start","port":"%s","workers":"%s","commit":"%s"}\n' \
  "$service_port" \
  "$web_concurrency" \
  "${RENDER_GIT_COMMIT:-unavailable}"

exec uvicorn current_alchemy.app:create_app \
  --factory \
  --host "${ALCHEMY_API_HOST:-0.0.0.0}" \
  --port "$service_port" \
  --workers "$web_concurrency" \
  --timeout-graceful-shutdown "${ALCHEMY_GRACEFUL_SHUTDOWN_SECONDS:-30}"
