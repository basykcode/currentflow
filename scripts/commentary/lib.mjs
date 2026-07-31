import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))

export const repositoryRoot = path.resolve(scriptDirectory, '..', '..')
export const contentRoot = path.join(repositoryRoot, 'content', 'yijing')
export const reportsRoot = path.join(contentRoot, 'reports')
export const internalRoot = path.join(contentRoot, 'internal')
export const rawCorpusRoot = path.join(repositoryRoot, 'data', 'hexagram-commentary')

export const SCHOOL_IDS = [
  'daoist',
  'buddhist',
  'confucian',
  'psychological',
  'human-design',
  'gene-keys',
]

export const SOURCE_ROLES = [
  'direct-commentary',
  'line-commentary',
  'image-commentary',
  'judgment-commentary',
  'framework',
  'transition-commentary',
  'secondary-analysis',
  'translation',
]

export const RIGHTS_STATUSES = [
  'public-domain',
  'licensed',
  'user-supplied-internal',
  'review-required',
  'blocked',
]

export const DISPLAY_POLICIES = [
  'summary-and-short-quotation',
  'summary-only',
  'internal-research-only',
  'blocked',
]

export const readJson = async (filePath) =>
  JSON.parse(await readFile(filePath, 'utf8'))

export const writeJson = async (filePath, payload) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

export const writeText = async (filePath, content) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
}

export const sha256 = (value) => createHash('sha256').update(value).digest('hex')

export const normalizeWhitespace = (value) =>
  value
    .normalize('NFC')
    .replace(/\r\n?/gu, '\n')
    .replace(/\u00ad/gu, '')
    .replace(/[ \t]+/gu, ' ')
    .replace(/ *\n */gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()

export const normalizeSchoolLabel = (label, schoolRegistry) => {
  const normalized = String(label).trim().toLowerCase()
  const schoolId = schoolRegistry.aliases[normalized]
  if (!schoolId || !SCHOOL_IDS.includes(schoolId)) {
    throw new Error(`Unknown commentary school label: ${label}`)
  }
  return schoolId
}

const requireUnique = (values, label) => {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  if (duplicates.length > 0) {
    throw new Error(`${label} must be unique; duplicates=${[...new Set(duplicates)].join(', ')}`)
  }
}

export const loadRegistries = async () => {
  const schoolRegistry = await readJson(path.join(contentRoot, 'school-registry.json'))
  const sourceManifest = await readJson(path.join(contentRoot, 'source-manifest.json'))
  const schools = schoolRegistry.schools ?? []
  const sources = sourceManifest.sources ?? []

  requireUnique(
    schools.map((school) => school.id),
    'School IDs',
  )
  requireUnique(
    schools.map((school) => school.defaultDisplayOrder),
    'School display orders',
  )
  requireUnique(
    sources.map((source) => source.sourceId),
    'Source IDs',
  )

  const actualSchoolIds = schools.map((school) => school.id)
  if (JSON.stringify(actualSchoolIds) !== JSON.stringify(SCHOOL_IDS)) {
    throw new Error(
      `School registry order must be exactly ${SCHOOL_IDS.join(', ')}; actual=${actualSchoolIds.join(', ')}`,
    )
  }

  for (const source of sources) {
    if (!SOURCE_ROLES.includes(source.sourceRole)) {
      throw new Error(`${source.sourceId}: unknown source role ${source.sourceRole}`)
    }
    if (!RIGHTS_STATUSES.includes(source.rightsStatus)) {
      throw new Error(`${source.sourceId}: missing or unknown rights status`)
    }
    if (!DISPLAY_POLICIES.includes(source.displayPolicy)) {
      throw new Error(`${source.sourceId}: missing or unknown display policy`)
    }
    if (normalizeSchoolLabel(source.schoolId, schoolRegistry) !== source.schoolId) {
      throw new Error(`${source.sourceId}: source manifest must use a canonical school ID`)
    }
    if (
      source.expectedHexagramCoverage?.first !== 1 ||
      source.expectedHexagramCoverage?.last !== 64
    ) {
      throw new Error(`${source.sourceId}: expected coverage must be King Wen 1-64`)
    }
  }

  for (const school of schools) {
    const sourceCount = sources.filter((source) => source.schoolId === school.id).length
    if (sourceCount !== school.sourceCount) {
      throw new Error(
        `${school.id}: registry sourceCount=${school.sourceCount}, manifest sourceCount=${sourceCount}`,
      )
    }
  }

  return { schoolRegistry, sourceManifest, schools, sources }
}

export const loadChunkIndex = async (sources) => {
  const indexPath = path.join(rawCorpusRoot, 'chunk-index.jsonl')
  const lines = (await readFile(indexPath, 'utf8')).split(/\r?\n/gu).filter(Boolean)
  const records = lines.map((line) => JSON.parse(line))
  const sourceIds = new Set(sources.map((source) => source.sourceId))
  const keys = []

  for (const record of records) {
    if (!sourceIds.has(record.source_id)) {
      throw new Error(`Chunk index references unknown source: ${record.source_id}`)
    }
    if (!Number.isInteger(record.hexagram) || record.hexagram < 1 || record.hexagram > 64) {
      throw new Error(`${record.source_id}: invalid hexagram ${record.hexagram}`)
    }
    if (!record.sha256 || !record.rights_status) {
      throw new Error(`${record.source_id}/${record.hexagram}: missing checksum or rights status`)
    }
    keys.push(`${record.source_id}:${record.hexagram}`)
  }
  requireUnique(keys, 'Chunk source/hexagram keys')
  return records
}

export const loadCanonicalHexagrams = async () => {
  const source = await readFile(
    path.join(repositoryRoot, 'src', 'domain', 'astrology', 'hexagrams.ts'),
    'utf8',
  )
  const definitionsStart = source.indexOf('const DEFINITIONS')
  const definitionsEnd = source.indexOf('const toHexagram')
  if (definitionsStart < 0 || definitionsEnd < 0) {
    throw new Error('Unable to locate the canonical hexagram definitions')
  }
  const definitions = source.slice(definitionsStart, definitionsEnd)
  const pattern =
    /number:\s*(\d+),\s*nameEnglish:\s*'([^']+)',\s*nameChinese:\s*'([^']+)',\s*namePinyin:\s*'([^']+)'/gu
  const hexagrams = [...definitions.matchAll(pattern)].map((match) => ({
    number: Number(match[1]),
    nameEnglish: match[2],
    nameChinese: match[3],
    namePinyin: match[4],
  }))
  if (hexagrams.length !== 64) {
    throw new Error(`Canonical registry must contain 64 definitions; found ${hexagrams.length}`)
  }
  requireUnique(
    hexagrams.map((hexagram) => hexagram.number),
    'Canonical hexagram numbers',
  )
  return hexagrams.sort((left, right) => left.number - right.number)
}

export const loadCanonicalGeneKeys = async () => {
  const source = await readFile(
    path.join(repositoryRoot, 'src', 'domain', 'astrology', 'geneKeys.ts'),
    'utf8',
  )
  const definitionsStart = source.indexOf('const DEFINITIONS')
  const definitionsEnd = source.indexOf('export const getGeneKeySpectrum')
  if (definitionsStart < 0 || definitionsEnd < 0) {
    throw new Error('Unable to locate the canonical Gene Key definitions')
  }
  const definitions = source.slice(definitionsStart, definitionsEnd)
  const spectra = [...definitions.matchAll(/\['([^']+)', '([^']+)', '([^']+)'\]/gu)].map(
    (match, index) => ({
      number: index + 1,
      shadow: match[1],
      gift: match[2],
      siddhi: match[3],
    }),
  )
  if (spectra.length !== 64) {
    throw new Error(`Canonical Gene Key registry must contain 64 definitions; found ${spectra.length}`)
  }
  return spectra
}

export const sourceChunkPath = (source, hexagramNumber) => {
  const rendered = source.sourcePath.replace(
    '{hexagram:02d}',
    String(hexagramNumber).padStart(2, '0'),
  )
  return path.join(repositoryRoot, ...rendered.split('/'))
}

export const chunkIdFor = (record) =>
  `${record.source_id}:hex-${String(record.hexagram).padStart(2, '0')}:${record.sha256.slice(0, 12)}`

export const detectSectionCoverage = (text) => {
  const normalized = normalizeWhitespace(text)
  return {
    judgment: /\b(?:OVERALL JUDGMENT|THE JUDGMENT|COMMENTARY ON THE JUDGMENTS|Judgment)\b/u.test(
      normalized,
    ),
    image: /\b(?:THE I?MAGE|IMAGE|COMMENTARY ON THE IMAGES)\b/u.test(normalized),
    line:
      /\b(?:First|Second|Third|Fourth|Fifth|Top)\s+(?:Yin|Yang)\b/iu.test(normalized) ||
      /\b(?:NINE|SIX) (?:AT THE BEGINNING|IN THE SECOND|IN THE THIRD|IN THE FOURTH|IN THE FIFTH|AT THE TOP)\b/iu.test(
        normalized,
      ) ||
      /\bCOMPONENTS\b/u.test(normalized),
  }
}

export const extractCoreSentences = (text) => {
  const normalized = normalizeWhitespace(text)
  const lineBoundary =
    /\n(?:COMPONENTS|(?:First|Second|Third|Fourth|Fifth|Top)\s+(?:Yin|Yang)|(?:NINE|SIX) (?:AT THE BEGINNING|IN THE SECOND|IN THE THIRD|IN THE FOURTH|IN THE FIFTH|AT THE TOP)|[1-6]\s+(?:yin|yang)[.:])/iu
  const match = lineBoundary.exec(normalized)
  const wholeHexagram = normalized.slice(0, match?.index ?? Math.min(normalized.length, 3200))
  return wholeHexagram
    .replace(/\n+/gu, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z“"'])/gu)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35)
    .slice(0, 8)
}

const STOP_WORDS = new Set(
  [
    'about',
    'above',
    'after',
    'again',
    'against',
    'also',
    'among',
    'because',
    'before',
    'being',
    'below',
    'between',
    'commentary',
    'could',
    'does',
    'from',
    'great',
    'have',
    'here',
    'hexagram',
    'image',
    'into',
    'means',
    'other',
    'should',
    'their',
    'there',
    'these',
    'they',
    'things',
    'this',
    'through',
    'thus',
    'under',
    'when',
    'where',
    'which',
    'while',
    'with',
    'would',
  ].map((word) => word.toLowerCase()),
)

export const extractVocabulary = (text, limit = 12) => {
  const frequencies = new Map()
  for (const token of normalizeWhitespace(text).toLowerCase().match(/[a-z][a-z'-]{4,}/gu) ?? []) {
    const word = token.replace(/^'+|'+$/gu, '')
    if (STOP_WORDS.has(word)) continue
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1)
  }
  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word]) => word)
}

export const readAllContext = async () => {
  const registries = await loadRegistries()
  const [chunkRecords, hexagrams, geneKeys] = await Promise.all([
    loadChunkIndex(registries.sources),
    loadCanonicalHexagrams(),
    loadCanonicalGeneKeys(),
  ])
  const sourceById = new Map(registries.sources.map((source) => [source.sourceId, source]))
  const schoolById = new Map(registries.schools.map((school) => [school.id, school]))
  const chunkByKey = new Map(
    chunkRecords.map((record) => [`${record.source_id}:${record.hexagram}`, record]),
  )
  return {
    ...registries,
    chunkRecords,
    hexagrams,
    geneKeys,
    sourceById,
    schoolById,
    chunkByKey,
  }
}
