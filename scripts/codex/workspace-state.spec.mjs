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

test('SessionStart continues in the primary checkout with coordination-only context', () => {
  const fixture = temporaryRepository({ linked: false, dirty: true })
  try {
    const branchBefore = git(fixture.worktree, ['branch', '--show-current'])
    const statusBefore = git(fixture.worktree, ['status', '--porcelain=v1'])
    const result = handleSessionStart({
      session_id: 'primary-test-session',
      cwd: fixture.worktree,
    })
    assert.equal(result.continue, true)
    assert.equal('stopReason' in result, false)
    assert.match(result.systemMessage, /read-only coordination/)
    assert.match(result.hookSpecificOutput.additionalContext, /COORDINATION-ONLY/)
    assert.match(result.hookSpecificOutput.additionalContext, /environment=worktree/)
    assert.match(result.hookSpecificOutput.additionalContext, /starting branch master/)
    assert.match(result.hookSpecificOutput.additionalContext, /full current user request/)
    assert.equal(git(fixture.worktree, ['branch', '--show-current']), branchBefore)
    assert.equal(git(fixture.worktree, ['status', '--porcelain=v1']), statusBefore)
    assert.equal(fs.existsSync(path.join(fixture.worktree, '.git', 'codex')), false)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})

test('SessionStart recognizes an explicit isolated Codex Cloud worker without a local lease', () => {
  const fixture = temporaryRepository({ linked: false, dirty: true })
  try {
    const branchBefore = git(fixture.worktree, ['branch', '--show-current'])
    const statusBefore = git(fixture.worktree, ['status', '--porcelain=v1'])
    const result = handleSessionStart(
      { session_id: 'cloud-test-session', cwd: fixture.worktree },
      fixture.worktree,
      { CURRENT_FLOW_CODEX_EXECUTION: 'cloud' },
    )
    assert.equal(result.continue, true)
    assert.match(result.systemMessage, /isolated Codex Cloud worker/)
    assert.match(result.hookSpecificOutput.additionalContext, /CLOUD-WORKER/)
    assert.match(result.hookSpecificOutput.additionalContext, /npm run codex:doctor/)
    assert.equal(git(fixture.worktree, ['branch', '--show-current']), branchBefore)
    assert.equal(git(fixture.worktree, ['status', '--porcelain=v1']), statusBefore)
    assert.equal(fs.existsSync(path.join(fixture.worktree, '.git', 'codex')), false)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})

test('SessionStart refuses a Cloud marker in a checkout owned by the local registry', () => {
  const fixture = temporaryRepository({ linked: false })
  try {
    const inspected = inspectWorkspace(fixture.worktree)
    const registryDirectory = path.join(inspected.commonGitDir, 'codex')
    fs.mkdirSync(registryDirectory, { recursive: true })
    fs.writeFileSync(
      path.join(registryDirectory, 'current-flow-chat-leases.json'),
      '{"version":1,"leases":{}}\n',
    )
    const result = handleSessionStart(
      { session_id: 'false-cloud-session', cwd: fixture.worktree },
      fixture.worktree,
      { CURRENT_FLOW_CODEX_EXECUTION: 'cloud' },
    )
    assert.equal(result.continue, false)
    assert.match(result.stopReason, /cannot override this checkout/)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})

test('SessionStart fails closed for an unknown execution mode', () => {
  const fixture = temporaryRepository({ linked: false })
  try {
    const result = handleSessionStart(
      { session_id: 'invalid-mode-session', cwd: fixture.worktree },
      fixture.worktree,
      { CURRENT_FLOW_CODEX_EXECUTION: 'remote' },
    )
    assert.equal(result.continue, false)
    assert.match(result.stopReason, /must be either local or cloud/)
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

test('SessionStart rejects a branch mismatch in a leased linked checkout', () => {
  const fixture = temporaryRepository({ linked: true })
  try {
    const sessionId = 'branch-mismatch-session'
    const claimed = handleSessionStart({ session_id: sessionId, cwd: fixture.worktree })
    assert.equal(claimed.continue, true)

    git(fixture.worktree, ['switch', '-c', 'feature/unexpected-switch'])
    const result = handleSessionStart({ session_id: sessionId, cwd: fixture.worktree })
    assert.equal(result.continue, false)
    assert.match(result.stopReason, /worktree now has feature\/unexpected-switch checked out/)
  } finally {
    removeTemporaryRepository(fixture.container)
  }
})
