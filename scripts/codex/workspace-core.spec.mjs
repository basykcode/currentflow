import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allocateSlot,
  branchNameForSession,
  createEmptyRegistry,
  evaluateClaim,
  normalizeWorktreePath,
  parseRegistry,
  runtimeForLease,
  sessionToken,
} from './workspace-core.mjs'

test('session-derived branches are deterministic, sanitized, and collision-suffixable', () => {
  assert.equal(sessionToken('019fb0c4-4069-7f93-86c5-13685a57786d'), '019fb0c44069')
  assert.equal(
    branchNameForSession('019fb0c4-4069-7f93-86c5-13685a57786d'),
    'codex/chat-019fb0c44069',
  )
  assert.equal(
    branchNameForSession('019fb0c4-4069-7f93-86c5-13685a57786d', 2),
    'codex/chat-019fb0c44069-2',
  )
  assert.match(sessionToken('short'), /^[a-f0-9]{12}$/)
})

test('worktree paths compare case-insensitively on Windows', () => {
  assert.equal(
    normalizeWorktreePath('C:\\Project\\Worktree', 'win32'),
    normalizeWorktreePath('c:\\project\\worktree\\', 'win32'),
  )
})

test('runtime slots are unique and produce isolated ports and Compose names', () => {
  const registry = createEmptyRegistry()
  registry.leases.a = { slot: 0 }
  registry.leases.b = { slot: 2 }
  assert.equal(allocateSlot(registry), 1)

  const first = runtimeForLease({ slot: 0, sessionId: 'session-one' })
  const second = runtimeForLease({ slot: 1, sessionId: 'session-two' })
  assert.notEqual(first.vitePort, second.vitePort)
  assert.notEqual(first.apiPort, second.apiPort)
  assert.notEqual(first.composeProjectName, second.composeProjectName)
})

test('claim evaluation identifies the primary checkout as a coordinator', () => {
  assert.equal(
    evaluateClaim({
      isPrimary: true,
      isDirty: false,
      branch: 'feature/a',
      lease: null,
      sessionId: 'one',
    }).action,
    'coordinate-primary',
  )
})

test('claim evaluation blocks shared or contaminated workspaces', () => {
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: true,
      branch: null,
      lease: null,
      sessionId: 'one',
    }).action,
    'block-unclaimed-dirty',
  )
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: false,
      branch: 'feature/a',
      lease: { sessionId: 'other' },
      sessionId: 'one',
    }).action,
    'block-conflict',
  )
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: false,
      branch: 'master',
      lease: null,
      sessionId: 'one',
    }).action,
    'block-protected-branch',
  )
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: true,
      branch: 'feature/switched',
      lease: { sessionId: 'one', branch: 'feature/original' },
      sessionId: 'one',
    }).action,
    'block-branch-mismatch',
  )
})

test('claim evaluation creates a branch for a clean managed worktree and resumes its owner', () => {
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: false,
      branch: null,
      lease: null,
      sessionId: 'one',
    }).action,
    'create-branch',
  )
  assert.equal(
    evaluateClaim({
      isPrimary: false,
      isDirty: true,
      branch: 'codex/chat-one',
      lease: { sessionId: 'one', branch: 'codex/chat-one' },
      sessionId: 'one',
    }).action,
    'resume',
  )
})

test('registry parser fails closed on unknown shapes or versions', () => {
  assert.deepEqual(parseRegistry(createEmptyRegistry()), createEmptyRegistry())
  assert.throws(() => parseRegistry({ version: 2, leases: {} }), /expected version 1/)
  assert.throws(() => parseRegistry({ version: 1, leases: [] }), /malformed/)
})
