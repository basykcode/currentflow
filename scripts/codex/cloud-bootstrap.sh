#!/usr/bin/env bash
set -euo pipefail

operation="${1:-setup}"
if [[ "$operation" != "setup" && "$operation" != "maintenance" ]]; then
  echo "Usage: scripts/codex/cloud-bootstrap.sh <setup|maintenance>" >&2
  exit 2
fi

if [[ "${CURRENT_FLOW_CODEX_EXECUTION:-}" != "cloud" ]]; then
  echo "Set CURRENT_FLOW_CODEX_EXECUTION=cloud in the Codex Cloud environment." >&2
  exit 2
fi

node_version="$(node -p "process.versions.node")"
expected_node="$(node -e "const m=require('./config/toolchain.json'); console.log(m.tools.find((x)=>x.tool==='Node.js').version)")"
expected_npm="$(node -e "const m=require('./config/toolchain.json'); console.log(m.tools.find((x)=>x.tool==='npm').version)")"
expected_python="$(node -e "const m=require('./config/toolchain.json'); console.log(m.tools.find((x)=>x.tool==='Python').version)")"
expected_uv="$(node -e "const m=require('./config/toolchain.json'); console.log(m.tools.find((x)=>x.tool==='uv').version)")"

# Reject protected local evidence and real environment files before any dependency network access.
node scripts/codex/cloud-boundary.mjs

if [[ "$node_version" != "$expected_node" ]]; then
  echo "Codex Cloud Node mismatch: expected $expected_node, received $node_version." >&2
  echo "Select Node 22 in the Current Flow Cloud environment package versions." >&2
  exit 2
fi

if [[ "$(npm --version)" != "$expected_npm" ]]; then
  echo "Codex Cloud npm mismatch: expected $expected_npm, received $(npm --version)." >&2
  exit 2
fi

python_version="$(python3 -c 'import platform; print(platform.python_version())')"
if [[ "$python_version" != "$expected_python" ]]; then
  echo "Codex Cloud Python mismatch: expected $expected_python, received $python_version." >&2
  echo "Select Python 3.13 in the Current Flow Cloud environment package versions." >&2
  exit 2
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "Codex Cloud uv is unavailable." >&2
  exit 2
fi
uv_version="$(uv --version | awk '{print $2}')"
if [[ "$uv_version" != "$expected_uv" ]]; then
  echo "Codex Cloud uv mismatch: expected $expected_uv, received $uv_version." >&2
  exit 2
fi

npm ci
uv --directory services/alchemy-api sync --locked --all-groups --python "$expected_python"
uv --directory services/alchemy-api run --python "$expected_python" python -c \
  "import platform; actual=platform.python_version(); expected='$expected_python'; assert actual == expected, (actual, expected)"

npm run toolchain:check
npm run codex:doctor
echo "Current Flow Codex Cloud $operation completed."
