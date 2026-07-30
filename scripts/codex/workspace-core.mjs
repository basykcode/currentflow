import { createHash } from 'node:crypto'
import path from 'node:path'

export const REGISTRY_VERSION = 1
export const MAX_WORKSPACE_SLOTS = 200

const PROTECTED_BRANCHES = new Set(['main', 'master'])

export function normalizeWorktreePath(value, platform = process.platform) {
  const normalized = path.resolve(value).replaceAll('\\', '/').replace(/\/+$/, '')
  return platform === 'win32' ? normalized.toLowerCase() : normalized
}

export function sessionToken(sessionId) {
  const normalized = String(sessionId ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  if (normalized.length >= 12) {
    return normalized.slice(0, 12)
  }

  return createHash('sha256')
    .update(String(sessionId ?? ''))
    .digest('hex')
    .slice(0, 12)
}

export function branchNameForSession(sessionId, suffix = 0) {
  const base = `codex/chat-${sessionToken(sessionId)}`
  return suffix === 0 ? base : `${base}-${suffix}`
}

export function createEmptyRegistry() {
  return {
    version: REGISTRY_VERSION,
    leases: {},
  }
}

export function parseRegistry(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    value.version !== REGISTRY_VERSION ||
    typeof value.leases !== 'object' ||
    value.leases === null ||
    Array.isArray(value.leases)
  ) {
    throw new Error(
      `Unsupported or malformed workspace registry; expected version ${REGISTRY_VERSION}.`,
    )
  }

  return value
}

export function allocateSlot(registry, maximum = MAX_WORKSPACE_SLOTS) {
  const used = new Set(
    Object.values(registry.leases)
      .map((lease) => lease?.slot)
      .filter((slot) => Number.isInteger(slot) && slot >= 0),
  )

  for (let slot = 0; slot < maximum; slot += 1) {
    if (!used.has(slot)) {
      return slot
    }
  }

  throw new Error(`No Current Flow workspace slots remain (maximum ${maximum}).`)
}

export function runtimeForLease(lease) {
  if (!Number.isInteger(lease?.slot) || lease.slot < 0 || lease.slot >= MAX_WORKSPACE_SLOTS) {
    throw new Error('The current workspace lease has an invalid runtime slot.')
  }

  return {
    vitePort: 5173 + lease.slot,
    neo4jHttpPort: 7474 + lease.slot,
    neo4jBoltPort: 7687 + lease.slot,
    apiPort: 8000 + lease.slot,
    composeProjectName: `current-flow-chat-${lease.slot}-${sessionToken(lease.sessionId).slice(0, 8)}`,
  }
}

export function evaluateClaim({ isPrimary, isDirty, branch, lease, sessionId }) {
  if (isPrimary) {
    return {
      action: 'block-primary',
      reason:
        'This is the primary checkout. Current Flow reserves it for human coordination; start this task as a Codex Worktree chat.',
    }
  }

  if (lease && lease.sessionId !== sessionId) {
    return {
      action: 'block-conflict',
      reason: `This worktree is leased to another Codex chat (${sessionToken(lease.sessionId)}).`,
    }
  }

  if (lease && lease.sessionId === sessionId) {
    if (branch === null) {
      return {
        action: 'block-detached-resume',
        reason: `This chat owns branch ${lease.branch}, but the worktree is now detached.`,
      }
    }
    if (branch !== lease.branch) {
      return {
        action: 'block-branch-mismatch',
        reason: `This chat owns branch ${lease.branch}, but the worktree now has ${branch} checked out.`,
      }
    }

    return { action: 'resume' }
  }

  if (isDirty) {
    return {
      action: 'block-unclaimed-dirty',
      reason:
        "This unclaimed worktree is already dirty. It may contain Local changes or another chat's work.",
    }
  }

  if (branch === null) {
    return { action: 'create-branch' }
  }

  if (PROTECTED_BRANCHES.has(branch)) {
    return {
      action: 'block-protected-branch',
      reason: `The unclaimed worktree has protected branch ${branch} checked out instead of a chat branch.`,
    }
  }

  return { action: 'claim-branch' }
}
