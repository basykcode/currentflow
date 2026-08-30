import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { inspectCloudBoundary } from './cloud-boundary.mjs'

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0, result.stderr || result.stdout)
}

function fixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'current-flow-cloud-boundary-'))
  git(repoRoot, ['init'])
  return repoRoot
}

function removeFixture(repoRoot) {
  assert.equal(path.dirname(repoRoot), path.resolve(os.tmpdir()))
  assert.match(path.basename(repoRoot), /^current-flow-cloud-boundary-/)
  fs.rmSync(repoRoot, { recursive: true, force: true })
}

test('allows tracked public environment examples and metadata', () => {
  const repoRoot = fixture()
  try {
    fs.writeFileSync(path.join(repoRoot, '.env.production'), 'PUBLIC_VALUE=example\n')
    fs.writeFileSync(path.join(repoRoot, 'README.md'), 'fixture\n')
    git(repoRoot, ['add', '.env.production', 'README.md'])
    assert.deepEqual(inspectCloudBoundary(repoRoot), { ok: true, violations: [] })
  } finally {
    removeFixture(repoRoot)
  }
})

test('rejects protected evidence or private environment files in Git', () => {
  const repoRoot = fixture()
  try {
    const evidence = path.join(repoRoot, 'content/yijing/internal')
    fs.mkdirSync(evidence, { recursive: true })
    fs.writeFileSync(path.join(evidence, 'source.txt'), 'private evidence\n')
    fs.writeFileSync(path.join(repoRoot, '.env.staging'), 'SECRET=not-for-git\n')
    git(repoRoot, ['add', '-f', 'content/yijing/internal/source.txt', '.env.staging'])
    const result = inspectCloudBoundary(repoRoot)
    assert.equal(result.ok, false)
    assert.match(result.violations.join('\n'), /protected evidence is tracked/)
    assert.match(result.violations.join('\n'), /private environment file is tracked/)
  } finally {
    removeFixture(repoRoot)
  }
})

test('rejects a symlink masquerading as an allowed public environment file', () => {
  const repoRoot = fixture()
  try {
    fs.writeFileSync(path.join(repoRoot, 'local-secret.txt'), 'SECRET=local-only\n')
    fs.symlinkSync('local-secret.txt', path.join(repoRoot, '.env.production'))
    git(repoRoot, ['add', '.env.production'])
    const result = inspectCloudBoundary(repoRoot)
    assert.equal(result.ok, false)
    assert.match(result.violations.join('\n'), /allowlist entry is a symlink/)
  } finally {
    removeFixture(repoRoot)
  }
})

test('rejects untracked local-only evidence and environment files in Cloud mode', () => {
  const repoRoot = fixture()
  try {
    fs.mkdirSync(path.join(repoRoot, 'data/hexagram-transitions/local'), { recursive: true })
    fs.writeFileSync(path.join(repoRoot, '.env.local'), 'SECRET=local-only\n')
    fs.mkdirSync(path.join(repoRoot, 'tmp'), { recursive: true })
    fs.writeFileSync(path.join(repoRoot, 'tmp/.envrc'), 'export SECRET=local-only\n')
    const result = inspectCloudBoundary(repoRoot, { cloud: true })
    assert.equal(result.ok, false)
    assert.match(result.violations.join('\n'), /protected local root exists in Codex Cloud/)
    assert.match(result.violations.join('\n'), /private environment file exists in Codex Cloud/)
    assert.match(result.violations.join('\n'), /tmp\/\.envrc/)
  } finally {
    removeFixture(repoRoot)
  }
})
