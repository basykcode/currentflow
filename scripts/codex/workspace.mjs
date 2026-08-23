import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'

import { normalizeWorktreePath, runtimeForLease, sessionToken } from './workspace-core.mjs'
import {
  inspectWorkspace,
  leaseForWorkspace,
  pruneMissingLeases,
  readRegistry,
  releaseCurrentLease,
  runGit,
} from './workspace-state.mjs'

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exitCode = 2
}

function printRuntime(lease) {
  const runtime = runtimeForLease(lease)
  process.stdout.write(
    [
      `branch=${lease.branch}`,
      `session=${sessionToken(lease.sessionId)}`,
      `slot=${lease.slot}`,
      `vite=http://127.0.0.1:${runtime.vitePort}`,
      `api=http://127.0.0.1:${runtime.apiPort}`,
      `neo4j=http://127.0.0.1:${runtime.neo4jHttpPort}`,
      `bolt=bolt://127.0.0.1:${runtime.neo4jBoltPort}`,
      `compose=${runtime.composeProjectName}`,
    ].join('\n') + '\n',
  )
}

function requireLease({ allowDirty = true } = {}) {
  const inspected = inspectWorkspace()
  if (inspected.isPrimary) {
    throw new Error(
      'The primary checkout is read-only and coordination-only. Dispatch implementation work to an app-managed worktree task.',
    )
  }

  const lease = leaseForWorkspace(inspected)
  if (!lease) {
    throw new Error(
      'This worktree has no Codex chat lease. Reopen it through its owning Codex chat.',
    )
  }
  if (inspected.branch !== lease.branch) {
    throw new Error(
      `Branch mismatch: the lease owns ${lease.branch}, but this worktree has ${inspected.branch ?? 'detached HEAD'}.`,
    )
  }
  if (!allowDirty && inspected.isDirty) {
    throw new Error('Refusing while the worktree has uncommitted or untracked files.')
  }

  return { inspected, lease, runtime: runtimeForLease(lease) }
}

async function portIsAvailable(port) {
  return await new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.once('error', () => resolve(false))
    server.listen({ host: '127.0.0.1', port }, () => {
      server.close(() => resolve(true))
    })
  })
}

async function runChild(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    shell: false,
    stdio: 'inherit',
    windowsHide: false,
  })

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ended from signal ${signal}.`))
      } else {
        resolve(code ?? 1)
      }
    })
  })
  process.exitCode = exitCode
}

function parseWorktreePaths(porcelain) {
  return porcelain
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length))
}

async function main() {
  const [command = 'doctor', ...args] = process.argv.slice(2)

  if (command === 'status') {
    const inspected = inspectWorkspace()
    const registry = readRegistry(inspected.commonGitDir)
    const activePaths = new Set(
      parseWorktreePaths(
        runGit(inspected.repoRoot, ['worktree', 'list', '--porcelain']).stdout,
      ).map((value) => normalizeWorktreePath(value)),
    )

    const leases = Object.entries(registry.leases)
    if (leases.length === 0) {
      process.stdout.write('No Current Flow Codex workspace leases are registered.\n')
      return
    }

    for (const [key, lease] of leases) {
      const state = activePaths.has(key) && fs.existsSync(lease.worktreePath) ? 'active' : 'stale'
      process.stdout.write(
        `${state}\t${lease.branch}\t${sessionToken(lease.sessionId)}\tslot ${lease.slot}\t${lease.worktreePath}\n`,
      )
    }
    return
  }

  if (command === 'prune') {
    if (!args.includes('--confirm')) {
      throw new Error('Pruning leases requires --confirm. It never deletes branches or worktrees.')
    }
    const inspected = inspectWorkspace()
    const worktrees = parseWorktreePaths(
      runGit(inspected.repoRoot, ['worktree', 'list', '--porcelain']).stdout,
    )
    const removed = pruneMissingLeases(inspected.commonGitDir, worktrees)
    process.stdout.write(
      `Removed ${removed.length} stale lease(s); no branch or worktree was deleted.\n`,
    )
    return
  }

  if (command === 'release') {
    if (!args.includes('--confirm')) {
      throw new Error('Releasing the current lease requires --confirm.')
    }
    const { inspected } = requireLease({ allowDirty: false })
    const released = releaseCurrentLease(inspected)
    process.stdout.write(
      released
        ? `Released ${released.branch}; no branch or worktree was deleted.\n`
        : 'This worktree had no lease.\n',
    )
    return
  }

  if (command === 'doctor' || command === 'env') {
    const { lease } = requireLease()
    printRuntime(lease)
    if (command === 'doctor') {
      process.stdout.write('Workspace isolation: OK\n')
    }
    return
  }

  if (command === 'dev') {
    const { inspected, runtime } = requireLease()
    if (!(await portIsAvailable(runtime.vitePort))) {
      throw new Error(
        `Vite port ${runtime.vitePort} is already in use. Stop this chat's existing server before starting another.`,
      )
    }
    const npmCommand =
      process.platform === 'win32' && process.env.npm_execpath
        ? {
            command: process.execPath,
            leadingArgs: [process.env.npm_execpath],
          }
        : {
            command: 'npm',
            leadingArgs: [],
          }
    await runChild(
      npmCommand.command,
      [
        ...npmCommand.leadingArgs,
        'run',
        'dev',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        String(runtime.vitePort),
        '--strictPort',
      ],
      {
        cwd: inspected.repoRoot,
        env: {
          ...process.env,
          VITE_ALCHEMY_API_BASE_URL: `http://127.0.0.1:${runtime.apiPort}`,
        },
      },
    )
    return
  }

  if (command === 'alchemy') {
    const action = args[0]
    const composeActions = new Set(['up', 'down', 'logs', 'ps'])
    const npmActions = new Map([
      ['migrate', 'alchemy:migrate'],
      ['seed', 'alchemy:seed'],
      ['check', 'alchemy:check'],
      ['openapi', 'alchemy:openapi'],
    ])
    const supported = new Set([...composeActions, ...npmActions.keys()])
    if (!supported.has(action)) {
      throw new Error('Usage: workspace.mjs alchemy <up|down|logs|ps|migrate|seed|check|openapi>')
    }

    const { inspected, runtime } = requireLease()
    const isolatedEnvironment = {
      ...process.env,
      COMPOSE_PROJECT_NAME: runtime.composeProjectName,
      CURRENT_FLOW_API_PORT: String(runtime.apiPort),
      CURRENT_FLOW_NEO4J_HTTP_PORT: String(runtime.neo4jHttpPort),
      CURRENT_FLOW_NEO4J_BOLT_PORT: String(runtime.neo4jBoltPort),
      ALCHEMY_ALLOWED_ORIGINS: `["http://127.0.0.1:${runtime.vitePort}","http://localhost:${runtime.vitePort}"]`,
      NEO4J_URI: `bolt://127.0.0.1:${runtime.neo4jBoltPort}`,
    }

    if (composeActions.has(action)) {
      const composeArgs = {
        up: ['compose', 'up', '-d', '--build', 'neo4j', 'alchemy-api'],
        down: ['compose', 'down'],
        logs: ['compose', 'logs', '-f', 'alchemy-api', 'neo4j'],
        ps: ['compose', 'ps'],
      }[action]
      await runChild('docker', composeArgs, {
        cwd: inspected.repoRoot,
        env: isolatedEnvironment,
      })
    } else {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      await runChild(npm, ['run', npmActions.get(action)], {
        cwd: inspected.repoRoot,
        env: isolatedEnvironment,
      })
    }
    return
  }

  throw new Error('Usage: workspace.mjs <doctor|status|env|dev|alchemy|release|prune>')
}

try {
  await main()
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
