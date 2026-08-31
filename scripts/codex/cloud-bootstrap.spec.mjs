import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cloud-bootstrap.sh')
const script = await readFile(scriptPath, 'utf8')

function position(needle) {
  const index = script.indexOf(needle)
  assert.notEqual(index, -1, `bootstrap is missing ${needle}`)
  return index
}

test('Cloud evidence boundary runs before dependency network access', () => {
  const boundary = position('node scripts/codex/cloud-boundary.mjs')
  for (const networkStep of [
    'npm run dependencies:install',
    'uv --directory services/alchemy-api sync',
  ]) {
    assert.ok(boundary < position(networkStep), `${networkStep} must follow the Cloud boundary`)
  }
})

test('Cloud bootstrap verifies the native Node and npm versions without replacing them', () => {
  assert.doesNotMatch(script, /nvm install/)
  assert.doesNotMatch(script, /npm install --global/)
  assert.match(script, /Codex Cloud Node mismatch/)
  assert.match(script, /npm --version/)
  assert.match(script, /npm run dependencies:install/)
})

test('Cloud bootstrap verifies native Python and uv, then uses the locked dependencies', () => {
  assert.doesNotMatch(script, /uv python install/)
  assert.doesNotMatch(script, /pip install/)
  assert.match(script, /sync --locked --all-groups/)
  assert.doesNotMatch(script, /sync --frozen/)
  assert.match(script, /python_executable="\$\(command -v python3\)"/)
  assert.match(script, /--python "\$python_executable"/)
  assert.match(script, /--no-managed-python/)
  assert.match(script, /--no-python-downloads/)
  assert.match(script, /platform\.python_version\(\)/)
  assert.match(script, /uv --version/)
})
