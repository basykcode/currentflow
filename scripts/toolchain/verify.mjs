import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { assertPythonRange, assertRuntimeVersion, isExactSpecifier } from './verify-core.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function text(relativePath) {
  return (await readFile(path.join(repositoryRoot, relativePath), 'utf8')).trim()
}

const manifest = JSON.parse(await text('config/toolchain.json'))
const versions = Object.fromEntries(manifest.tools.map((item) => [item.tool, item.version]))
const packageJson = JSON.parse(await text('package.json'))
const packageLock = JSON.parse(await text('package-lock.json'))
const lockedRoot = packageLock.packages['']
const alchemyWorkflow = await text('.github/workflows/alchemy-api.yml')
const frontendWorkflow = await text('.github/workflows/frontend.yml')
const pyproject = await text('services/alchemy-api/pyproject.toml')
const pythonLock = await text('services/alchemy-api/uv.lock')
const dockerfile = await text('services/alchemy-api/Dockerfile')
const cloudGuide = await text('docs/CODEX_CLOUD.md')

assert.equal(await text('.nvmrc'), versions['Node.js'])
assert.equal(await text('.node-version'), versions['Node.js'])
assertRuntimeVersion('Node.js', process.versions.node, versions['Node.js'])
assert.equal(packageJson.engines.node, versions['Node.js'])
assert.equal(packageJson.engines.npm, versions.npm)
assert.equal(packageJson.packageManager, `npm@${versions.npm}`)
assert.deepEqual(packageJson.volta, {
  node: versions['Node.js'],
  npm: versions.npm,
})
assert.deepEqual(packageJson.allowScripts, {
  'esbuild@0.28.1': true,
  'esbuild@0.28.2': true,
  'fsevents@2.3.3': true,
  'workerd@1.20260825.1': true,
})
const lockedInstallScripts = Object.entries(packageLock.packages)
  .filter(([, details]) => details.hasInstallScript)
  .map(([lockPath, details]) => {
    const packageName = lockPath.slice(
      lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length,
    )
    return `${packageName}@${details.version}`
  })
  .sort()
assert.deepEqual(lockedInstallScripts, Object.keys(packageJson.allowScripts).sort())
assert.equal(packageJson.devDependencies['@tsconfig/node22'], '22.0.5')
assert.equal(packageJson.devDependencies['@types/node'], '22.20.1')
assert.match(await text('tsconfig.node.json'), /@tsconfig\/node22\/tsconfig\.json/)
assert.match(await text('workers/api-gateway/tsconfig.json'), /@tsconfig\/node22\/tsconfig\.json/)
assert.equal(packageJson.devDependencies.typescript, versions.TypeScript)
assert.equal(packageJson.devDependencies.vite, versions.Vite)
assert.equal(packageJson.devDependencies.wrangler, versions['Cloudflare Wrangler'])
assert.deepEqual(lockedRoot.dependencies, packageJson.dependencies)
assert.deepEqual(lockedRoot.devDependencies, packageJson.devDependencies)
assert.deepEqual(lockedRoot.engines, packageJson.engines)
assert.match(
  frontendWorkflow,
  new RegExp(`node-version: '${versions['Node.js'].replaceAll('.', '\\.')}'`),
)
assert.match(frontendWorkflow, new RegExp(`npm@${versions.npm.replaceAll('.', '\\.')}`))
assert.match(
  alchemyWorkflow,
  new RegExp(`node-version: '${versions['Node.js'].replaceAll('.', '\\.')}'`),
)
assert.match(alchemyWorkflow, new RegExp(`npm@${versions.npm.replaceAll('.', '\\.')}`))

const npmExecutable = process.env.npm_execpath
if (npmExecutable?.endsWith('npm-cli.js')) {
  const npmPackage = JSON.parse(
    await readFile(path.resolve(path.dirname(npmExecutable), '../package.json'), 'utf8'),
  )
  assertRuntimeVersion('npm', npmPackage.version, versions.npm)
}

const directSpecifiers = [
  ...Object.values(packageJson.dependencies),
  ...Object.values(packageJson.devDependencies),
]
assert.ok(
  directSpecifiers.every(isExactSpecifier),
  'Every direct JavaScript dependency must use an exact version.',
)

assert.equal(await text('services/alchemy-api/.python-version'), versions.Python)
assert.match(
  dockerfile,
  new RegExp(`FROM python:${versions.Python.replaceAll('.', '\\.')}\\-slim-bookworm`),
)
assertPythonRange(pyproject, versions.Python)
assert.match(dockerfile, new RegExp(`ghcr\\.io/astral-sh/uv:${versions.uv.replaceAll('.', '\\.')}`))
assert.match(dockerfile, /uv sync --locked --no-dev/)
const [pythonMajor, pythonMinor] = versions.Python.split('.').map(Number)
assert.match(
  pythonLock,
  new RegExp(
    `requires-python = ">=${versions.Python.replaceAll('.', '\\.')}, <${pythonMajor}\\.${pythonMinor + 1}"`,
  ),
)
assert.match(pyproject, new RegExp(`target-version = "py${pythonMajor}${pythonMinor}"`))
assert.match(pyproject, new RegExp(`python_version = "${pythonMajor}\\.${pythonMinor}"`))
assert.equal(
  [...alchemyWorkflow.matchAll(/python-version: '([^']+)'/g)].every(
    ([, version]) => version === versions.Python,
  ),
  true,
)
assert.equal([...alchemyWorkflow.matchAll(/python-version: /g)].length, 2)
assert.deepEqual(
  [...alchemyWorkflow.matchAll(/^\s+version: '([^']+)'$/gm)].map(([, version]) => version),
  [versions.uv, versions.uv],
)
assert.ok(cloudGuide.includes(`Node \`${versions['Node.js']}\``))
assert.ok(cloudGuide.includes(`Python \`${versions.Python}\``))

assert.equal(packageLock.lockfileVersion, 3)
assert.match(await text('.npmrc'), /(?:^|\n)engine-strict=true(?:\n|$)/)
assert.match(await text('.npmrc'), /(?:^|\n)ignore-scripts=true(?:\n|$)/)
assert.match(await text('.npmrc'), /(?:^|\n)save-exact=true(?:\n|$)/)
try {
  await access(path.join(repositoryRoot, 'pnpm-lock.yaml'))
  assert.fail('pnpm-lock.yaml must not coexist with the canonical npm lockfile.')
} catch (error) {
  if (error instanceof Error && !('code' in error && error.code === 'ENOENT')) throw error
}
assert.match(
  await text('compose.yaml'),
  new RegExp(`neo4j:${versions['Neo4j Community'].replaceAll('.', '\\.')}`),
)
assert.match(
  await text('services/alchemy-api/pyproject.toml'),
  new RegExp(`neo4j==${versions['Neo4j Python driver'].replaceAll('.', '\\.')}`),
)
assert.match(
  await text('.github/workflows/load-test.yml'),
  new RegExp(`grafana/k6:${versions.k6.replaceAll('.', '\\.')}`),
)

console.log('Toolchain declarations are synchronized.')
