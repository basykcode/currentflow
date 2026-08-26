#!/bin/sh
set -eu

: "${NEO4J_URI:?NEO4J_URI is required}"
: "${NEO4J_USERNAME:?NEO4J_USERNAME is required}"
: "${NEO4J_PASSWORD:?NEO4J_PASSWORD is required}"
: "${NEO4J_DATABASE:?NEO4J_DATABASE is required}"

if [ "${ALCHEMY_ENV:-development}" = "production" ] && [ "${ALCHEMY_SEED_DEMO:-0}" = "1" ]; then
  echo "Production pre-deploy refuses to seed demo data." >&2
  exit 1
fi

echo "Running checksum-protected Neo4j migrations."
alchemy db migrate

if [ "${ALCHEMY_ENSURE_FOUNDATION:-0}" = "1" ]; then
  echo "Reconciling the approved production knowledge foundation."
  alchemy foundation ensure --retire-demo
fi

echo "Pre-deploy database work completed."
