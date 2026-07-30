import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  handleSessionStart,
  inspectWorkspace,
  leaseForWorkspace,
  readRegistry,
} from './workspace-state.mjs'

function git(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result.stdout.trim()
}

function temporaryRepository({ linked, dirty = false }) {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), 'current-flow-workspace-test-'))
  const worktree = path.join(container, 'checkout')
  fs.mkdirSync(worktree)

  if (linked) {
    const gitDirectory = path.join(container, 'shared-git')
    git(container, ['init', `--separate-git-dir=${gitDirectory}`, worktree])
  } else {
    git(container, ['init', worktree])
  }

  git(worktree, ['config', 'user.email', 'workspace-test@current-flow.invalid'])
  git(worktree, ['config', 'user.name', 'Current Flow Workspace Test'])
  fs.writeFileSync(path.join(worktree, 'README.md'), 'fixture\n')
  git(worktree, ['add', 'README.md'])
  git(worktree, ['commit', '-m', 'test fixture'])

  if (linked) {
    git(worktree, ['switch', '--detach'])
  }
  if (dirty) {
    fs.writeFileSync(path.join(worktree, 'dirty.txt'), 'unclaimed\n')
  }

  return { container, worktree }
}

function removeTemporaryRepository(container) {
  const resolved = path.resolve(container)
  const expectedParent = path.resolve(os.tmpdir())
  assert.equal(path.dirname(resolved), expectedParent)
  assert.match(path.basename(resolved), /^current-flow-workspace-test-/)
  fs.rmSync(resolved, { recursive: true, force: true })
}

test('SessionStart fails closed in the primary checkout', () => {
  const fixture = temporaryRepository({ linked: false })
  try {
    const result = handleSessionStart({
      session_id: 'primary-test-session',
      cwd: fixture.worktree,
    })
    assert.equal(result.continue, false)
    assert.match(result.stopReason, /primary checkout/)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})

test('SessionStart claims, branches, resumes, and exclusively leases a linked checkout', () => {
  const fixture = temporaryRepository({ linked: true })
  try {
    const sessionId = '019fb0c4-4069-7f93-86c5-13685a57786d'
    const claimed = handleSessionStart({ session_id: sessionId, cwd: fixture.worktree })
    assert.equal(claimed.continue, true)
    assert.equal(git(fixture.worktree, ['branch', '--show-current']), 'codex/chat-019fb0c44069')

    const inspected = inspectWorkspace(fixture.worktree)
    const registry = readRegistry(inspected.commonGitDir)
    const lease = leaseForWorkspace(inspected, registry)
    assert.equal(lease.sessionId, sessionId)
    assert.equal(lease.branch, 'codex/chat-019fb0c44069')

    fs.writeFileSync(path.join(fixture.worktree, 'owned-change.txt'), 'in progress\n')
    const resumed = handleSessionStart({ session_id: sessionId, cwd: fixture.worktree })
    assert.equal(resumed.continue, true)

    const conflict = handleSessionStart({
      session_id: 'different-session',
      cwd: fixture.worktree,
    })
    assert.equal(conflict.continue, false)
    assert.match(conflict.stopReason, /leased to another Codex chat/)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})

test('SessionStart rejects an unclaimed dirty linked checkout', () => {
  const fixture = temporaryRepository({ linked: true, dirty: true })
  try {
    const result = handleSessionStart({
      session_id: 'dirty-test-session',
      cwd: fixture.worktree,
    })
    assert.equal(result.continue, false)
    assert.match(result.stopReason, /already dirty/)
    assert.equal(git(fixture.worktree, ['branch', '--show-current']), '')
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})
