import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const checkedPath = path.join(repositoryRoot, 'src/features/alchemy/api/generated/schema.ts')
const generatedPath = path.join(path.dirname(checkedPath), `.schema-check-${process.pid}.ts`)

try {
  execFileSync(
    process.execPath,
    [
      path.join(repositoryRoot, 'node_modules/openapi-typescript/bin/cli.js'),
      path.join(repositoryRoot, 'contracts/alchemy-openapi.json'),
      '--output',
      generatedPath,
    ],
    { cwd: repositoryRoot, stdio: 'pipe' },
  )
  execFileSync(
    process.execPath,
    [path.join(repositoryRoot, 'node_modules/prettier/bin/prettier.cjs'), '--write', generatedPath],
    { cwd: repositoryRoot, stdio: 'pipe' },
  )
  if (!fs.readFileSync(checkedPath).equals(fs.readFileSync(generatedPath))) {
    throw new Error('Generated Alchemy API types are stale. Run: npm run alchemy:types')
  }
  process.stdout.write('Generated Alchemy API types are current.\n')
} finally {
  fs.rmSync(generatedPath, { force: true })
}
