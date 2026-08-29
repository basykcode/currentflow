import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')
const SOURCE_DIRECTORIES = [
  { sourceId: 'gene-keys', directory: 'gene_keys_1_rudd' },
  { sourceId: '64-ways', directory: 'gene_keys_2_rudd' },
]

const requiredEnvironment = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const expectedFiles = Array.from(
  { length: 64 },
  (_, index) => `hex_${String(index + 1).padStart(2, '0')}.txt`,
)

async function buildEntries() {
  const entries = []
  for (const source of SOURCE_DIRECTORIES) {
    const directory = resolve(ROOT, 'data/hexagram-commentary/chunked', source.directory)
    const actualFiles = (await readdir(directory)).filter((file) => file.endsWith('.txt')).sort()
    if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
      throw new Error(`${source.directory} must contain exactly hex_01.txt through hex_64.txt.`)
    }

    for (const file of actualFiles) {
      const value = await readFile(resolve(directory, file), 'utf8')
      if (!value.trim()) {
        throw new Error(`${source.directory}/${file} is empty.`)
      }
      entries.push({ key: `v1/${source.sourceId}/${file}`, value })
    }
  }
  return entries
}

async function main() {
  const entries = await buildEntries()
  const manifestHash = createHash('sha256')
    .update(entries.map((entry) => `${entry.key}\0${entry.value}`).join('\0'))
    .digest('hex')

  if (process.argv.includes('--dry-run')) {
    console.log(`Verified ${entries.length} private Gene Key chapters for Workers KV.`)
    console.log(`Upload manifest SHA-256: ${manifestHash}`)
    return
  }

  const accountId = requiredEnvironment('CLOUDFLARE_ACCOUNT_ID')
  const apiToken = requiredEnvironment('CLOUDFLARE_API_TOKEN')
  const namespaceId = requiredEnvironment('GENE_KEYS_KV_NAMESPACE_ID')

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entries),
    },
  )
  const body = await response.json()
  if (!response.ok || !body?.success) {
    throw new Error(`Cloudflare KV upload failed with HTTP ${response.status}.`)
  }

  console.log(`Uploaded ${entries.length} private Gene Key chapters to Workers KV.`)
  console.log(`Upload manifest SHA-256: ${manifestHash}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
