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
  for (const networkStep of ['npm install --global', 'npm ci', 'python3 -m pip install']) {
    assert.ok(boundary < position(networkStep), `${networkStep} must follow the Cloud boundary`)
  }
})

test('Cloud bootstrap locks dependencies and persists the exact uv path', () => {
  assert.match(script, /sync --locked --all-groups/)
  assert.doesNotMatch(script, /sync --frozen/)
  assert.match(script, /\.bashrc/)
  assert.match(script, /platform\.python_version\(\)/)
  assert.match(script, /npm --version/)
})
