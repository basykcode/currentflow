import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function text(relativePath) {
  return (await readFile(path.join(repositoryRoot, relativePath), 'utf8')).trim()
}

const manifest = JSON.parse(await text('config/toolchain.json'))
const versions = Object.fromEntries(manifest.tools.map((item) => [item.tool, item.version]))
const packageJson = JSON.parse(await text('package.json'))
const packageLock = JSON.parse(await text('package-lock.json'))
const lockedRoot = packageLock.packages['']

assert.equal(await text('.nvmrc'), versions['Node.js'])
assert.equal(await text('.node-version'), versions['Node.js'])
assert.equal(process.versions.node, versions['Node.js'])
assert.equal(packageJson.engines.node, versions['Node.js'])
assert.equal(packageJson.engines.npm, versions.npm)
assert.equal(packageJson.packageManager, `npm@${versions.npm}`)
assert.deepEqual(packageJson.volta, {
  node: versions['Node.js'],
  npm: versions.npm,
})
assert.equal(packageJson.devDependencies.typescript, versions.TypeScript)
assert.equal(packageJson.devDependencies.vite, versions.Vite)
assert.equal(packageJson.devDependencies.wrangler, versions['Cloudflare Wrangler'])
assert.deepEqual(lockedRoot.dependencies, packageJson.dependencies)
assert.deepEqual(lockedRoot.devDependencies, packageJson.devDependencies)
assert.deepEqual(lockedRoot.engines, packageJson.engines)

const npmExecutable = process.env.npm_execpath
if (npmExecutable?.endsWith('npm-cli.js')) {
  const npmPackage = JSON.parse(
    await readFile(path.resolve(path.dirname(npmExecutable), '../package.json'), 'utf8'),
  )
  assert.equal(npmPackage.version, versions.npm)
}

const directSpecifiers = [
  ...Object.values(packageJson.dependencies),
  ...Object.values(packageJson.devDependencies),
]
assert.ok(
  directSpecifiers.every((specifier) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(specifier)),
  'Every direct JavaScript dependency must use an exact version.',
)

assert.equal(await text('services/alchemy-api/.python-version'), versions.Python)
assert.match(
  await text('services/alchemy-api/Dockerfile'),
  new RegExp(`FROM python:${versions.Python.replaceAll('.', '\\.')}\\-slim-bookworm`),
)
assert.ok(
  (await text('services/alchemy-api/pyproject.toml')).includes(
    `requires-python = ">=${versions.Python},<3.13"`,
  ),
)
assert.match(
  await text('services/alchemy-api/Dockerfile'),
  new RegExp(`ghcr\\.io/astral-sh/uv:${versions.uv.replaceAll('.', '\\.')}`),
)
assert.match(
  await text('compose.yaml'),
  new RegExp(`neo4j:${versions['Neo4j Community'].replaceAll('.', '\\.')}`),
)
assert.match(
  await text('services/alchemy-api/pyproject.toml'),
  new RegExp(`neo4j==${versions['Neo4j Python driver'].replaceAll('.', '\\.')}`),
)

console.log('Toolchain declarations are synchronized.')
