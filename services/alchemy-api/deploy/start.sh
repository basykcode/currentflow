#!/bin/sh
set -eu

service_port="${PORT:-${ALCHEMY_API_PORT:-8000}}"

alchemy db migrate

if [ "${ALCHEMY_SEED_DEMO:-0}" = "1" ]; then
  alchemy data seed-demo
fi

exec uvicorn current_alchemy.app:create_app \
  --factory \
  --host "${ALCHEMY_API_HOST:-0.0.0.0}" \
  --port "$service_port"
