import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DRAFT_DIR = path.join(ROOT, 'content/yijing/drafts/transitions')
const GENERATED_DIR = path.join(ROOT, 'content/yijing/generated/transitions')
const REPORT_DIR = path.join(ROOT, 'content/yijing/reports')
const INDEX_PATH = path.join(ROOT, 'data/hexagram-transitions/transition-index.jsonl')
const MANIFEST_PATH = path.join(ROOT, 'data/hexagram-transitions/manifest.json')
const INTERNAL_EVIDENCE_PATH = path.join(
  ROOT,
  'content/yijing/internal/transitions/jiaoshi-yilin-line-transitions.json',
)

const SCHEMA_VERSION = '1.0.0'
const CONTENT_VERSION = '2026.07.30-forest-line-transitions-v1'
const SOURCE_ID = 'transition_1_jiaoshi_yilin_gait'
const EXPECTED_BATCH_STARTS = [1, 9, 17, 25, 33, 41, 49, 57]
const PROHIBITED_PATTERNS = [
  [/\byou\b/i, 'second-person address'],
  [/\byour\b/i, 'second-person address'],
  [/\bmust\b/i, 'prescriptive language'],
  [/\bshould\b/i, 'prescriptive language'],
  [/\bguarantee(?:d|s)?\b/i, 'certainty claim'],
  [/\bdestin(?:y|ed)\b/i, 'destiny claim'],
  [/\bthe universe\b/i, 'spiritual-authority language'],
  [/\bdiagnos(?:e|is|ed|tic)\b/i, 'diagnostic language'],
]

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'))

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex')

const words = (value) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) ?? []

const exactOverlap = (summary, sourceText, length = 8) => {
  const summaryWords = words(summary)
  const sourceWords = words(sourceText)
  if (summaryWords.length < length || sourceWords.length < length) return null
  const sourceWindows = new Set()
  for (let index = 0; index <= sourceWords.length - length; index += 1) {
    sourceWindows.add(sourceWords.slice(index, index + length).join(' '))
  }
  for (let index = 0; index <= summaryWords.length - length; index += 1) {
    const candidate = summaryWords.slice(index, index + length).join(' ')
    if (sourceWindows.has(candidate)) return candidate
  }
  return null
}

const loadIndex = async () => {
  const lines = (await readFile(INDEX_PATH, 'utf8')).split(/\r?\n/).filter(Boolean)
  const records = lines.map((line) => JSON.parse(line))
  if (records.length !== 384) {
    throw new Error(`Expected 384 transition index records; found ${records.length}.`)
  }
  return new Map(records.map((record) => [record.transition_id, record]))
}

const loadDrafts = async () => {
  const files = (await readdir(DRAFT_DIR))
    .filter((file) => /^batch-(01|09|17|25|33|41|49|57)\.json$/.test(file))
    .sort()
  if (files.length !== EXPECTED_BATCH_STARTS.length) {
    throw new Error(
      `Expected ${EXPECTED_BATCH_STARTS.length} transition draft batches; found ${files.length}.`,
    )
  }

  const drafts = []
  for (const file of files) {
    const batch = await readJson(path.join(DRAFT_DIR, file))
    if (
      batch.schemaVersion !== SCHEMA_VERSION ||
      batch.contentVersion !== CONTENT_VERSION ||
      !EXPECTED_BATCH_STARTS.includes(batch.batchStart) ||
      !Array.isArray(batch.transitions) ||
      batch.transitions.length !== 48
    ) {
      throw new Error(`Malformed transition draft batch ${file}.`)
    }
    drafts.push(...batch.transitions)
  }
  if (drafts.length !== 384) {
    throw new Error(`Expected 384 transition drafts; found ${drafts.length}.`)
  }
  return drafts
}

const scaffoldDrafts = async () => {
  const index = await loadIndex()
  const records = [...index.values()].sort(
    (left, right) =>
      left.source_hexagram - right.source_hexagram || left.changing_line - right.changing_line,
  )
  await mkdir(DRAFT_DIR, { recursive: true })

  for (const batchStart of EXPECTED_BATCH_STARTS) {
    const filePath = path.join(DRAFT_DIR, `batch-${String(batchStart).padStart(2, '0')}.json`)
    let previous = new Map()
    try {
      const existing = await readJson(filePath)
      previous = new Map(
        existing.transitions.map((transition) => [transition.transitionId, transition]),
      )
    } catch {
      // The first scaffold has no prior editorial text to preserve.
    }

    const transitions = records
      .filter(
        (record) => record.source_hexagram >= batchStart && record.source_hexagram < batchStart + 8,
      )
      .map((record) => {
        const existing = previous.get(record.transition_id)
        return {
          transitionId: record.transition_id,
          sourceHexagramNumber: record.source_hexagram,
          targetHexagramNumber: record.target_hexagram,
          changingLine: record.changing_line,
          sourcePassageSha256: record.source_passage_sha256,
          theme: existing?.theme ?? '',
          summary: existing?.summary ?? '',
        }
      })
    await writeJson(filePath, {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      batchStart,
      transitions,
    })
  }
  console.log('Scaffolded eight Forest transition draft batches.')
}

const loadInternalEvidence = async () => {
  try {
    const payload = await readJson(INTERNAL_EVIDENCE_PATH)
    return new Map(
      payload.selectedLineTransitions.map((record) => [
        record.transitionId,
        record.verseParagraphs.join(' '),
      ]),
    )
  } catch {
    return null
  }
}

const validateDraft = (draft, indexRecord, sourceText) => {
  const issues = []
  if (!indexRecord) {
    return [`No provenance index record exists for ${draft.transitionId}.`]
  }
  if (
    draft.sourceHexagramNumber !== indexRecord.source_hexagram ||
    draft.targetHexagramNumber !== indexRecord.target_hexagram ||
    draft.changingLine !== indexRecord.changing_line ||
    draft.sourcePassageSha256 !== indexRecord.source_passage_sha256
  ) {
    issues.push('Draft identity or source hash does not match the transition index.')
  }

  const themeWordCount = words(draft.theme).length
  if (themeWordCount < 2 || themeWordCount > 7) {
    issues.push(`Theme has ${themeWordCount} words; expected 2–7.`)
  }

  const summaryWordCount = words(draft.summary).length
  if (summaryWordCount < 18 || summaryWordCount > 58) {
    issues.push(`Summary has ${summaryWordCount} words; expected 18–58.`)
  }
  for (const [pattern, label] of PROHIBITED_PATTERNS) {
    if (pattern.test(draft.summary)) {
      issues.push(`Summary contains ${label}.`)
    }
  }

  if (sourceText) {
    const overlap = exactOverlap(draft.summary, sourceText)
    if (overlap) {
      issues.push(`Summary repeats an exact eight-word source sequence: "${overlap}".`)
    }
  }
  return issues
}

const build = async () => {
  const [manifest, index, drafts, internalEvidence] = await Promise.all([
    readJson(MANIFEST_PATH),
    loadIndex(),
    loadDrafts(),
    loadInternalEvidence(),
  ])
  const source = manifest.source
  if (source.source_id !== SOURCE_ID) {
    throw new Error('Unexpected Forest transition source identity.')
  }

  const seenIds = new Set()
  const seenRoutes = new Set()
  const records = []
  const reviewRows = []

  for (const draft of drafts) {
    if (seenIds.has(draft.transitionId)) {
      throw new Error(`Duplicate transition draft ${draft.transitionId}.`)
    }
    seenIds.add(draft.transitionId)
    const routeKey = `${draft.sourceHexagramNumber}-${draft.targetHexagramNumber}`
    if (seenRoutes.has(routeKey)) {
      throw new Error(`Duplicate transition route ${routeKey}.`)
    }
    seenRoutes.add(routeKey)

    const indexRecord = index.get(draft.transitionId)
    const issues = validateDraft(draft, indexRecord, internalEvidence?.get(draft.transitionId))
    reviewRows.push({
      transitionId: draft.transitionId,
      sourceHexagramNumber: draft.sourceHexagramNumber,
      targetHexagramNumber: draft.targetHexagramNumber,
      changingLine: draft.changingLine,
      status: issues.length === 0 ? 'qa-passed' : 'needs-revision',
      issues,
    })

    if (!indexRecord) continue
    records.push({
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      transitionId: draft.transitionId,
      sourceHexagramNumber: draft.sourceHexagramNumber,
      targetHexagramNumber: draft.targetHexagramNumber,
      changingLine: draft.changingLine,
      theme: draft.theme,
      summary: draft.summary,
      evidenceMode: 'single-source-direct',
      source: {
        sourceId: SOURCE_ID,
        title: source.title,
        titleChinese: source.title_chinese,
        translator: source.translator,
        sourceLocator: indexRecord.source_locator,
        resolvedLocator: indexRecord.resolved_locator,
        crossReferenceChain: indexRecord.cross_reference_chain,
        sourcePassageSha256: indexRecord.source_passage_sha256,
      },
      rights: {
        publicationEligibility: 'draft-only',
        quotationIncluded: false,
      },
      review: {
        status: issues.length === 0 ? 'qa-passed' : 'needs-revision',
        issues,
      },
    })
  }

  const needsRevision = reviewRows.filter((record) => record.status === 'needs-revision')
  if (records.length !== 384 || needsRevision.length > 0) {
    await writeReports(reviewRows, records)
    throw new Error(
      `Transition build blocked: ${records.length}/384 records and ${needsRevision.length} need revision.`,
    )
  }

  await mkdir(GENERATED_DIR, { recursive: true })
  for (let sourceHexagramNumber = 1; sourceHexagramNumber <= 64; sourceHexagramNumber += 1) {
    const transitions = records
      .filter((record) => record.sourceHexagramNumber === sourceHexagramNumber)
      .sort((left, right) => left.changingLine - right.changingLine)
    await writeJson(
      path.join(GENERATED_DIR, `${String(sourceHexagramNumber).padStart(2, '0')}.json`),
      {
        schemaVersion: SCHEMA_VERSION,
        contentVersion: CONTENT_VERSION,
        sourceHexagramNumber,
        transitions,
      },
    )
  }
  await writeReports(reviewRows, records)
  console.log(
    `Built 64 Forest transition bundles with ${records.length} source-grounded summaries.`,
  )
}

const writeReports = async (reviewRows, records) => {
  const passed = reviewRows.filter((record) => record.status === 'qa-passed').length
  const needsRevision = reviewRows.length - passed
  const report = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    sourceId: SOURCE_ID,
    counts: {
      transitionDrafts: reviewRows.length,
      publicRecords: records.length,
      qaPassed: passed,
      needsRevision,
      humanApproved: 0,
      crossReferenced: records.filter((record) => record.source.crossReferenceChain.length > 0)
        .length,
    },
    records: reviewRows,
    reportHash: sha256(JSON.stringify(reviewRows)),
  }
  await writeJson(path.join(REPORT_DIR, 'transition-review.json'), report)
  const lines = [
    '# Forest transition review',
    '',
    `- Drafts: ${reviewRows.length}`,
    `- QA passed: ${passed}`,
    `- Needs revision: ${needsRevision}`,
    '- Human approved: 0',
    '- Publication status: draft-only',
    '',
    'Automated QA verifies identity, source hashes, rights fields, style, and',
    'exact eight-word source overlap when local evidence is present. It is not',
    'human editorial approval.',
    '',
  ]
  if (needsRevision > 0) {
    lines.push('## Needs revision', '')
    for (const record of reviewRows.filter((candidate) => candidate.status === 'needs-revision')) {
      lines.push(`- \`${record.transitionId}\`: ${record.issues.join('; ')}`)
    }
    lines.push('')
  }
  await writeFile(path.join(REPORT_DIR, 'transition-review.md'), `${lines.join('\n')}\n`, 'utf8')
}

const validateComplete = async () => {
  const files = (await readdir(GENERATED_DIR)).filter((file) => /^\d{2}\.json$/.test(file)).sort()
  if (files.length !== 64) {
    throw new Error(`Expected 64 public transition bundles; found ${files.length}.`)
  }

  let transitionCount = 0
  const ids = new Set()
  for (let sourceHexagramNumber = 1; sourceHexagramNumber <= 64; sourceHexagramNumber += 1) {
    const file = `${String(sourceHexagramNumber).padStart(2, '0')}.json`
    const payload = await readJson(path.join(GENERATED_DIR, file))
    if (
      payload.schemaVersion !== SCHEMA_VERSION ||
      payload.contentVersion !== CONTENT_VERSION ||
      payload.sourceHexagramNumber !== sourceHexagramNumber ||
      !Array.isArray(payload.transitions) ||
      payload.transitions.length !== 6
    ) {
      throw new Error(`Malformed public transition bundle ${file}.`)
    }
    const lines = new Set()
    const targets = new Set()
    for (const transition of payload.transitions) {
      if (
        transition.sourceHexagramNumber !== sourceHexagramNumber ||
        transition.source?.sourceId !== SOURCE_ID ||
        transition.evidenceMode !== 'single-source-direct' ||
        transition.rights?.quotationIncluded !== false ||
        transition.rights?.publicationEligibility !== 'draft-only' ||
        transition.review?.status !== 'qa-passed' ||
        transition.theme.length === 0 ||
        transition.summary.length === 0 ||
        'originalText' in transition ||
        'normalizedText' in transition ||
        'verseParagraphs' in transition
      ) {
        throw new Error(`Invalid public transition ${transition.transitionId}.`)
      }
      ids.add(transition.transitionId)
      lines.add(transition.changingLine)
      targets.add(transition.targetHexagramNumber)
      transitionCount += 1
    }
    if (lines.size !== 6 || targets.size !== 6) {
      throw new Error(`Bundle ${file} has duplicate lines or targets.`)
    }
  }
  if (transitionCount !== 384 || ids.size !== 384) {
    throw new Error(`Expected 384 unique public transitions; found ${transitionCount}/${ids.size}.`)
  }
  console.log('Validated 64 Forest bundles and 384 draft-only transition summaries.')
}

const command = process.argv[2]
switch (command) {
  case 'scaffold-drafts':
    await scaffoldDrafts()
    break
  case 'build':
    await build()
    break
  case 'validate-complete':
    await validateComplete()
    break
  default:
    throw new Error(
      'Usage: node scripts/transitions/public.mjs <scaffold-drafts|build|validate-complete>',
    )
}
