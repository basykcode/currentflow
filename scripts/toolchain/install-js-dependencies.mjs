import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function lockedInstallScripts(lockPackages) {
  return Object.entries(lockPackages)
    .filter(([, details]) => details.hasInstallScript)
    .map(([lockPath, details]) => ({
      lockPath,
      specifier: `${lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length)}@${details.version}`,
    }))
    .sort((left, right) => left.specifier.localeCompare(right.specifier))
}

export function validateInstallScriptPolicy(allowScripts, lockPackages) {
  const approvedPackages = Object.entries(allowScripts)
    .filter(([, approved]) => approved)
    .map(([packageSpecifier]) => packageSpecifier)
    .sort()

  if (approvedPackages.length !== Object.keys(allowScripts).length) {
    throw new Error('Every allowScripts entry must be explicitly true.')
  }

  const lockedPackages = lockedInstallScripts(lockPackages).map(({ specifier }) => specifier)
  if (JSON.stringify(lockedPackages) !== JSON.stringify(approvedPackages)) {
    throw new Error(
      `Install-script policy mismatch: approved ${approvedPackages.join(', ')}; locked ${lockedPackages.join(', ')}.`,
    )
  }

  return approvedPackages
}

export function buildInstallSteps(approvedPackages) {
  return [
    ['ci', '--ignore-scripts'],
    ['rebuild', '--ignore-scripts=false', '--foreground-scripts', ...approvedPackages],
  ]
}

export function validateRuntimeInvocation({
  npmExecutable,
  actualNodeVersion,
  expectedNodeVersion,
  actualNpmVersion,
  expectedNpmVersion,
}) {
  if (!npmExecutable?.endsWith('npm-cli.js')) {
    throw new Error('Run this installer through the exact pinned npm executable.')
  }
  if (actualNodeVersion !== expectedNodeVersion) {
    throw new Error(
      `Node version mismatch: expected ${expectedNodeVersion}, received ${actualNodeVersion}.`,
    )
  }
  if (actualNpmVersion !== expectedNpmVersion) {
    throw new Error(
      `npm version mismatch: expected ${expectedNpmVersion}, received ${actualNpmVersion}.`,
    )
  }
}

function run() {
  const npmExecutable = process.env.npm_execpath
  const packageJson = JSON.parse(readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'))
  const npmPackageJson = JSON.parse(
    readFileSync(path.resolve(path.dirname(npmExecutable ?? ''), '..', 'package.json'), 'utf8'),
  )
  validateRuntimeInvocation({
    npmExecutable,
    actualNodeVersion: process.versions.node,
    expectedNodeVersion: packageJson.engines.node,
    actualNpmVersion: npmPackageJson.version,
    expectedNpmVersion: packageJson.engines.npm,
  })
  const packageLock = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package-lock.json'), 'utf8'),
  )
  const approvedPackages = validateInstallScriptPolicy(
    packageJson.allowScripts,
    packageLock.packages,
  )

  const [installArguments] = buildInstallSteps(approvedPackages)
  const installResult = spawnSync(process.execPath, [npmExecutable, ...installArguments], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: 'inherit',
  })
  if (installResult.status !== 0) process.exit(installResult.status ?? 1)

  const installedApprovedPackages = lockedInstallScripts(packageLock.packages)
    .filter(({ lockPath }) => existsSync(path.join(repositoryRoot, lockPath, 'package.json')))
    .map(({ specifier }) => specifier)
  if (installedApprovedPackages.length === 0) {
    throw new Error('No approved install-script packages were installed; refusing a broad rebuild.')
  }
  const [, rebuildArguments] = buildInstallSteps(installedApprovedPackages)
  const rebuildResult = spawnSync(process.execPath, [npmExecutable, ...rebuildArguments], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: 'inherit',
  })
  if (rebuildResult.status !== 0) process.exit(rebuildResult.status ?? 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
