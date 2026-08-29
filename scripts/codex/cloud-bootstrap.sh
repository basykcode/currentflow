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

if [[ "$node_version" != "$expected_node" ]]; then
  echo "Codex Cloud Node mismatch: expected $expected_node, received $node_version." >&2
  echo "Set Node $expected_node in the Current Flow Cloud environment's package versions." >&2
  exit 2
fi

# Reject protected local evidence and real environment files before any dependency network access.
node scripts/codex/cloud-boundary.mjs

if [[ "$(npm --version)" != "$expected_npm" ]]; then
  npm install --global "npm@$expected_npm"
  hash -r
fi
if [[ "$(npm --version)" != "$expected_npm" ]]; then
  echo "Codex Cloud npm mismatch: expected $expected_npm, received $(npm --version)." >&2
  exit 2
fi

npm ci

python_user_bin="$(python3 -m site --user-base)/bin"
export PATH="$python_user_bin:$PATH"
shell_path_line="export PATH=\"$python_user_bin:\$PATH\""
touch "$HOME/.bashrc"
if ! grep -Fqx "$shell_path_line" "$HOME/.bashrc"; then
  printf '\n%s\n' "$shell_path_line" >> "$HOME/.bashrc"
fi

uv_version=""
if command -v uv >/dev/null 2>&1; then
  uv_version="$(uv --version | awk '{print $2}')"
fi
if [[ "$uv_version" != "$expected_uv" ]]; then
  python3 -m pip install --user --upgrade --force-reinstall "uv==$expected_uv"
  hash -r
fi
if ! command -v uv >/dev/null 2>&1 || [[ "$(uv --version | awk '{print $2}')" != "$expected_uv" ]]; then
  echo "Codex Cloud uv mismatch: expected $expected_uv." >&2
  exit 2
fi

uv python install "$expected_python"
uv --directory services/alchemy-api sync --locked --all-groups --python "$expected_python"
uv --directory services/alchemy-api run --python "$expected_python" python -c \
  "import platform; actual=platform.python_version(); expected='$expected_python'; assert actual == expected, (actual, expected)"

npm run toolchain:check
npm run codex:doctor
echo "Current Flow Codex Cloud $operation completed."
