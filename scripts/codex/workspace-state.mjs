import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
  allocateSlot,
  branchNameForSession,
  createEmptyRegistry,
  evaluateClaim,
  normalizeWorktreePath,
  parseRegistry,
  runtimeForLease,
} from './workspace-core.mjs'

const LOCK_RETRY_COUNT = 100
const LOCK_RETRY_MS = 50
const STALE_LOCK_MS = 30_000

function wait(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

export function runGit(cwd, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0 && !allowFailure) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`
    throw new Error(`git ${args.join(' ')} failed: ${detail}`)
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

function resolveGitPath(repoRoot, value) {
  return path.resolve(repoRoot, value)
}

export function inspectWorkspace(cwd = process.cwd()) {
  const repoRoot = runGit(cwd, ['rev-parse', '--show-toplevel']).stdout
  const commonGitDir = resolveGitPath(
    repoRoot,
    runGit(repoRoot, ['rev-parse', '--git-common-dir']).stdout,
  )
  const branchResult = runGit(repoRoot, ['symbolic-ref', '--quiet', '--short', 'HEAD'], {
    allowFailure: true,
  })
  const status = runGit(repoRoot, ['status', '--porcelain=v1', '--untracked-files=all']).stdout
  const gitMarker = fs.statSync(path.join(repoRoot, '.git'))

  return {
    repoRoot,
    commonGitDir,
    isPrimary: gitMarker.isDirectory(),
    branch: branchResult.ok ? branchResult.stdout : null,
    isDirty: status.length > 0,
    status,
  }
}

export function registryPaths(commonGitDir) {
  const directory = path.join(commonGitDir, 'codex')
  return {
    directory,
    registry: path.join(directory, 'current-flow-chat-leases.json'),
    lock: path.join(directory, 'current-flow-chat-leases.lock'),
  }
}

export function readRegistry(commonGitDir) {
  const paths = registryPaths(commonGitDir)
  if (!fs.existsSync(paths.registry)) {
    return createEmptyRegistry()
  }

  const parsed = JSON.parse(fs.readFileSync(paths.registry, 'utf8'))
  return parseRegistry(parsed)
}

function writeRegistry(commonGitDir, registry) {
  const paths = registryPaths(commonGitDir)
  fs.mkdirSync(paths.directory, { recursive: true })
  const temporary = `${paths.registry}.${process.pid}.${randomUUID()}.tmp`
  fs.writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  fs.renameSync(temporary, paths.registry)
}

function removeStaleLock(lockPath) {
  try {
    const age = Date.now() - fs.statSync(lockPath).mtimeMs
    if (age > STALE_LOCK_MS) {
      fs.rmSync(lockPath)
      return true
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true
    }
    throw error
  }

  return false
}

export function withRegistryLock(commonGitDir, operation) {
  const paths = registryPaths(commonGitDir)
  fs.mkdirSync(paths.directory, { recursive: true })

  let handle
  for (let attempt = 0; attempt < LOCK_RETRY_COUNT; attempt += 1) {
    try {
      handle = fs.openSync(paths.lock, 'wx', 0o600)
      break
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }
      if (!removeStaleLock(paths.lock)) {
        wait(LOCK_RETRY_MS)
      }
    }
  }

  if (handle === undefined) {
    throw new Error('Timed out waiting for the Current Flow workspace registry lock.')
  }

  try {
    const registry = readRegistry(commonGitDir)
    const result = operation(registry)
    if (result?.changed) {
      writeRegistry(commonGitDir, registry)
    }
    return result?.value
  } finally {
    fs.closeSync(handle)
    fs.rmSync(paths.lock, { force: true })
  }
}

function uniqueBranchName(repoRoot, sessionId) {
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const branch = branchNameForSession(sessionId, suffix)
    const found = runGit(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
      allowFailure: true,
    })
    if (!found.ok) {
      return branch
    }
  }

  throw new Error('Could not allocate a unique chat branch name.')
}

function hookOutput({ continueRun = true, message, context }) {
  return {
    continue: continueRun,
    ...(continueRun ? {} : { stopReason: message }),
    systemMessage: message,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context ?? message,
    },
  }
}

export function handleSessionStart(input, cwd = input.cwd ?? process.cwd()) {
  const inspected = inspectWorkspace(cwd)

  if (inspected.isPrimary) {
    const decision = evaluateClaim({
      isPrimary: true,
      isDirty: inspected.isDirty,
      branch: inspected.branch,
      lease: null,
      sessionId: input.session_id,
    })
    return hookOutput({
      message: decision.reason,
      context: [
        'COORDINATION-ONLY: never create, edit, delete, move, install, build, test, generate, or otherwise mutate project files, Git state, or project runtimes in this primary checkout.',
        'Read-only inspection and app-level task coordination are allowed.',
        'For every implementation request, automatically create a new task for the saved Current Flow Git project with environment=worktree and starting branch master; forward the full current user request and necessary repository context.',
        'Do not ask the user to restate, copy, or paste the request, and do not send them to a Worktree button or require a permanent worktree.',
        'Return the created-task UI directive after dispatch.',
      ].join(' '),
    })
  }

  if (typeof input.session_id !== 'string' || input.session_id.length === 0) {
    return hookOutput({
      continueRun: false,
      message:
        'Current Flow could not identify this Codex chat, so it cannot assign an isolated workspace.',
    })
  }

  return withRegistryLock(inspected.commonGitDir, (registry) => {
    const key = normalizeWorktreePath(inspected.repoRoot)
    const existingLease = registry.leases[key]
    const decision = evaluateClaim({
      isPrimary: false,
      isDirty: inspected.isDirty,
      branch: inspected.branch,
      lease: existingLease,
      sessionId: input.session_id,
    })

    if (decision.action.startsWith('block-')) {
      return {
        changed: false,
        value: hookOutput({
          continueRun: false,
          message: `${decision.reason} Use a fresh Codex-managed Worktree based on clean master.`,
        }),
      }
    }

    const now = new Date().toISOString()
    if (decision.action === 'resume') {
      existingLease.branch = inspected.branch
      existingLease.lastSeenAt = now
      const runtime = runtimeForLease(existingLease)
      return {
        changed: true,
        value: hookOutput({
          message: `Current Flow workspace lease resumed on ${existingLease.branch}.`,
          context: workspaceContext(existingLease, runtime),
        }),
      }
    }

    const slot = allocateSlot(registry)
    let branch = inspected.branch
    if (decision.action === 'create-branch') {
      branch = uniqueBranchName(inspected.repoRoot, input.session_id)
      runGit(inspected.repoRoot, ['switch', '-c', branch])
    }

    const lease = {
      sessionId: input.session_id,
      worktreePath: inspected.repoRoot,
      branch,
      slot,
      createdAt: now,
      lastSeenAt: now,
    }
    registry.leases[key] = lease
    const runtime = runtimeForLease(lease)

    return {
      changed: true,
      value: hookOutput({
        message: `Current Flow isolated this chat on ${branch}.`,
        context: workspaceContext(lease, runtime),
      }),
    }
  })
}

function workspaceContext(lease, runtime) {
  return [
    `This Codex chat exclusively owns worktree ${lease.worktreePath} and branch ${lease.branch}.`,
    'Do not switch branches, use git stash for task state, hand this implementation to Local, or share this worktree with another chat.',
    'Do not rewrite docs/continuity/PROJECT_STATE.md from a feature chat; integration owns that file.',
    `Use npm run workspace:dev for Vite on port ${runtime.vitePort}.`,
    `Use npm run workspace:alchemy -- up for isolated Compose project ${runtime.composeProjectName}.`,
    'Run npm run workspace:doctor before making tracked changes.',
  ].join(' ')
}

export function leaseForWorkspace(inspected, registry = readRegistry(inspected.commonGitDir)) {
  return registry.leases[normalizeWorktreePath(inspected.repoRoot)] ?? null
}

export function releaseCurrentLease(inspected) {
  return withRegistryLock(inspected.commonGitDir, (registry) => {
    const key = normalizeWorktreePath(inspected.repoRoot)
    const lease = registry.leases[key]
    if (!lease) {
      return { changed: false, value: null }
    }
    delete registry.leases[key]
    return { changed: true, value: lease }
  })
}

export function pruneMissingLeases(commonGitDir, activeWorktreePaths) {
  const active = new Set(activeWorktreePaths.map((value) => normalizeWorktreePath(value)))
  return withRegistryLock(commonGitDir, (registry) => {
    const removed = []
    for (const [key, lease] of Object.entries(registry.leases)) {
      if (!active.has(key) || !fs.existsSync(lease.worktreePath)) {
        removed.push(lease)
        delete registry.leases[key]
      }
    }
    return { changed: removed.length > 0, value: removed }
  })
}
