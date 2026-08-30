import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { codexExecutionMode } from './execution-mode.mjs'

export const PROTECTED_LOCAL_ROOTS = [
  'data/hexagram-commentary/chunked',
  'content/yijing/internal',
  'data/hexagram-transitions/local',
  'services/alchemy-api/data/raw',
  'var/alchemy-data',
]

const ALLOWED_ENV_FILES = new Set([
  '.env.example',
  '.env.production',
  'services/alchemy-api/.env.example',
])
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  '.venv',
  '.vite',
  '.wrangler',
  '__pycache__',
  'coverage',
  'dist',
  'node_modules',
])

const normalizeRelativePath = (value) => value.split(path.sep).join('/')

function isProtectedPath(relativePath) {
  return PROTECTED_LOCAL_ROOTS.some(
    (root) => relativePath === root || relativePath.startsWith(`${root}/`),
  )
}

function isEnvironmentPath(relativePath) {
  const basename = path.posix.basename(relativePath)
  return basename === '.env' || basename.startsWith('.env.') || basename === '.envrc'
}

function isEnvironmentFile(relativePath) {
  return !ALLOWED_ENV_FILES.has(relativePath) && isEnvironmentPath(relativePath)
}

function trackedFiles(repoRoot) {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  })
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`
    throw new Error(`git ls-files failed: ${detail}`)
  }
  return result.stdout.split('\0').filter(Boolean).map(normalizeRelativePath)
}

function localEnvironmentFiles(repoRoot) {
  const found = []
  const visit = (directory, relativeDirectory = '') => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relativePath = normalizeRelativePath(path.join(relativeDirectory, entry.name))
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name) && !isProtectedPath(relativePath)) {
          visit(path.join(directory, entry.name), relativePath)
        }
      } else if (
        (entry.isFile() && isEnvironmentFile(relativePath)) ||
        (entry.isSymbolicLink() && isEnvironmentPath(relativePath))
      ) {
        found.push(relativePath)
      }
    }
  }
  visit(repoRoot)
  return found
}

export function inspectCloudBoundary(repoRoot, { cloud = false } = {}) {
  const violations = []
  for (const relativePath of trackedFiles(repoRoot)) {
    if (isProtectedPath(relativePath)) {
      violations.push(`protected evidence is tracked: ${relativePath}`)
    }
    if (isEnvironmentFile(relativePath)) {
      violations.push(`private environment file is tracked: ${relativePath}`)
    }
    if (
      ALLOWED_ENV_FILES.has(relativePath) &&
      fs.lstatSync(path.join(repoRoot, relativePath)).isSymbolicLink()
    ) {
      violations.push(`public environment allowlist entry is a symlink: ${relativePath}`)
    }
  }

  if (cloud) {
    for (const root of PROTECTED_LOCAL_ROOTS) {
      if (fs.existsSync(path.join(repoRoot, root))) {
        violations.push(`protected local root exists in Codex Cloud: ${root}`)
      }
    }
    for (const relativePath of localEnvironmentFiles(repoRoot)) {
      violations.push(`private environment file exists in Codex Cloud: ${relativePath}`)
    }
  }

  return { ok: violations.length === 0, violations }
}

export function assertCloudBoundary(repoRoot, options) {
  const result = inspectCloudBoundary(repoRoot, options)
  if (!result.ok) {
    throw new Error(`Codex Cloud boundary violation:\n- ${result.violations.join('\n- ')}`)
  }
  return result
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const cloud = codexExecutionMode() === 'cloud'
  assertCloudBoundary(repoRoot, { cloud })
  process.stdout.write(
    cloud
      ? 'Codex Cloud evidence boundary: OK\n'
      : 'Tracked evidence and environment boundary: OK\n',
  )
}
