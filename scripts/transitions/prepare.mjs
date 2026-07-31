import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const parser = path.join(ROOT, 'scripts/transitions/prepare_forest.py')
const isWindows = process.platform === 'win32'

const candidates = [
  process.env.CURRENT_FLOW_PYTHON ? { command: process.env.CURRENT_FLOW_PYTHON, prefix: [] } : null,
  {
    command: path.join(
      ROOT,
      'services/alchemy-api',
      isWindows ? '.venv/Scripts/python.exe' : '.venv/bin/python',
    ),
    prefix: [],
  },
  {
    command: path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/python',
      isWindows ? 'python.exe' : 'bin/python',
    ),
    prefix: [],
  },
  isWindows ? { command: 'py', prefix: ['-3'] } : null,
  { command: isWindows ? 'python' : 'python3', prefix: [] },
].filter((candidate) => candidate !== null)

const isUsable = ({ command, prefix }) => {
  if (path.isAbsolute(command) && !existsSync(command)) return false
  const result = spawnSync(command, [...prefix, '--version'], {
    encoding: 'utf8',
    windowsHide: true,
  })
  return result.status === 0
}

const runtime = candidates.find(isUsable)
if (!runtime) {
  throw new Error(
    'Python 3 is required. Set CURRENT_FLOW_PYTHON to a Python executable with lxml installed.',
  )
}

const result = spawnSync(runtime.command, [...runtime.prefix, parser, ...process.argv.slice(2)], {
  cwd: ROOT,
  stdio: 'inherit',
  windowsHide: true,
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
