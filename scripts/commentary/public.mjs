#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  SCHOOL_IDS,
  contentRoot,
  internalRoot,
  readAllContext,
  reportsRoot,
  sha256,
  sourceChunkPath,
  writeJson,
  writeText,
} from './lib.mjs'

const draftsRoot = path.join(contentRoot, 'drafts', 'hexagrams')
const generatedRoot = path.join(contentRoot, 'generated', 'hexagrams')
const contentVersion = '2026.07.30-v1'
const promptVersion = 'school-synthesis-v1'

const splitSentences = (text) =>
  text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/gu)
    .filter(Boolean)

const wordCount = (text) => text.trim().split(/\s+/gu).filter(Boolean).length

const normalizeTokens = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .trim()
    .split(/\s+/gu)
    .filter(Boolean)

const shingles = (text, size) => {
  const tokens = normalizeTokens(text)
  const values = new Set()
  for (let index = 0; index <= tokens.length - size; index += 1) {
    values.add(tokens.slice(index, index + size).join(' '))
  }
  return values
}

const contaminationVocabulary = {
  daoist: ['neidan', 'firing process', 'precelestial', 'postcelestial'],
  buddhist: ['emptiness', 'non-self', 'dependent arising'],
  confucian: ['junzi', 'ritual propriety', 'rectification'],
  psychological: ['archetype', 'projection', 'unconscious defense'],
  'human-design': [
    'gate',
    'g center',
    'sacral center',
    'root center',
    'spleen center',
    'solar plexus center',
    'ego center',
    'throat center',
    'head center',
    'ajna center',
    'circuit',
    'channel',
  ],
  'gene-keys': ['shadow', 'gift', 'siddhi'],
}

const styleIssues = (record, sentences) => {
  const issues = []
  const essenceWords = wordCount(record.essence)
  const summaryWords = wordCount(record.summary)
  if (essenceWords < 12 || essenceWords > 24) {
    issues.push(`Essence word count ${essenceWords} is outside 12-24.`)
  }
  if (summaryWords < 90 || summaryWords > 140) {
    issues.push(`Summary word count ${summaryWords} is outside 90-140.`)
  }
  if (sentences.length < 4 || sentences.length > 6) {
    issues.push(`Summary sentence count ${sentences.length} is outside 4-6.`)
  }
  const prohibited = [
    /\byou must\b/iu,
    /\byou should\b/iu,
    /\bthis will happen\b/iu,
    /\bguaranteed (?:outcome|result)\b/iu,
    /\bdestined\b/iu,
    /\bthe universe wants\b/iu,
    /\braise your vibration\b/iu,
  ]
  if (prohibited.some((pattern) => pattern.test(record.summary))) {
    issues.push('Summary contains predictive, prescriptive, or certainty language.')
  }
  if (
    record.schoolId === 'psychological' &&
    /\b(?:trauma|narcissism|attachment disorder|personality disorder|psychosis|depression|anxiety disorder)\b/iu.test(
      record.summary,
    )
  ) {
    issues.push('Psychological summary contains prohibited diagnostic vocabulary.')
  }
  return issues
}

const contaminationIssues = (record) => {
  const issues = []
  const text = `${record.essence} ${record.summary}`.toLowerCase()
  for (const [schoolId, terms] of Object.entries(contaminationVocabulary)) {
    if (schoolId === record.schoolId) continue
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
      if (new RegExp(`\\b${escaped}\\b`, 'iu').test(text)) {
        issues.push(`Inspect possible ${schoolId} vocabulary outside its registered school: ${term}`)
      }
    }
  }
  return issues
}

const overlapIssues = async (record, sourceMap) => {
  const summaryShingles = shingles(record.summary, 8)
  const warnings = []
  for (const sourceInput of record.sources) {
    const source = sourceMap.get(sourceInput.sourceId)
    if (!source) continue
    const sourceText = await readFile(
      sourceChunkPath(source, record.hexagramNumber),
      'utf8',
    )
    const sourceShingles = shingles(sourceText, 8)
    const exactOverlapCount = [...summaryShingles].filter((value) =>
      sourceShingles.has(value),
    ).length
    if (exactOverlapCount > 0) {
      warnings.push({
        sourceId: source.sourceId,
        kind: 'exact-eight-word-overlap',
        matchCount: exactOverlapCount,
      })
    }
  }
  return warnings
}

const loadPacket = async (hexagramNumber, schoolId) =>
  JSON.parse(
    await readFile(
      path.join(
        internalRoot,
        'packets',
        `hex_${String(hexagramNumber).padStart(2, '0')}`,
        `${schoolId}.json`,
      ),
      'utf8',
    ),
  )

const safeAttribution = (source) => ({
  title: source.title,
  contributors: [
    source.author,
    source.translator ? `${source.translator} (translator)` : null,
  ].filter(Boolean),
})

const buildRecord = async (draft, hexagramNumber, context) => {
  const packet = await loadPacket(hexagramNumber, draft.schoolId)
  const hexagramNumberString = String(hexagramNumber).padStart(2, '0')
  if (packet.evidenceMode === 'insufficient' || draft.insufficientReason) {
    return {
      schemaVersion: '1.0.0',
      contentVersion,
      hexagramNumber,
      schoolId: draft.schoolId,
      essence: '',
      summary: '',
      evidenceMode: 'insufficient',
      sourcesUsed: [],
      sentenceSupport: [],
      coverage: {
        registeredSourceCount: packet.coverage.registeredSources,
        contributingSourceCount: 0,
        directSourceCount: 0,
        chunkCount: 0,
      },
      rights: {
        publicationEligibility: 'blocked',
        quotationIncluded: false,
      },
      review: {
        status: 'blocked',
        issues: [draft.insufficientReason ?? 'No eligible evidence packet is available.'],
      },
      generation: {
        generatorKind: 'codex-assisted',
        promptVersion,
        generatedAtIso: '2026-07-30T00:00:00Z',
        sourceDigest: sha256(`${hexagramNumberString}:${draft.schoolId}:insufficient`),
      },
    }
  }

  const sentences = splitSentences(draft.summary)
  if (draft.sentenceSources.length !== sentences.length) {
    throw new Error(
      `Hexagram ${hexagramNumber} ${draft.schoolId}: sentence source map length does not match`,
    )
  }
  const digestBySource = new Map(
    packet.sourceDigests.map((digest) => [digest.sourceId, digest]),
  )
  const sourceIds = new Set(draft.sources.map((source) => source.sourceId))
  for (const sentenceSources of draft.sentenceSources) {
    for (const sourceId of sentenceSources) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(
          `Hexagram ${hexagramNumber} ${draft.schoolId}: unsupported source ${sourceId}`,
        )
      }
      if (digestBySource.get(sourceId)?.evidenceMode === 'insufficient') {
        throw new Error(
          `Hexagram ${hexagramNumber} ${draft.schoolId}: source ${sourceId} is insufficient`,
        )
      }
    }
  }

  const sourcesUsed = draft.sources.map((sourceInput) => {
    const source = context.sourceById.get(sourceInput.sourceId)
    const digest = digestBySource.get(sourceInput.sourceId)
    if (!source || !digest || digest.evidenceMode === 'insufficient') {
      throw new Error(
        `Hexagram ${hexagramNumber} ${draft.schoolId}: unusable source ${sourceInput.sourceId}`,
      )
    }
    return {
      sourceId: source.sourceId,
      ...safeAttribution(source),
      contribution: sourceInput.contribution,
      evidenceMode: digest.evidenceMode,
      locatorCount: digest.usedChunkIds.length,
      chunkIds: digest.usedChunkIds,
    }
  })
  const sentenceSupport = draft.sentenceSources.map((sentenceSources, sentenceIndex) => ({
    sentenceIndex,
    supportingChunkIds: sentenceSources.flatMap(
      (sourceId) => digestBySource.get(sourceId)?.usedChunkIds ?? [],
    ),
  }))
  const overlapWarnings = await overlapIssues(
    { ...draft, hexagramNumber },
    context.sourceById,
  )
  const warnings = [
    ...styleIssues(draft, sentences),
    ...contaminationIssues(draft),
    ...overlapWarnings.map(
      (warning) =>
        `Copyright-similarity warning for ${warning.sourceId}: ${warning.matchCount} exact eight-word overlap(s).`,
    ),
  ]
  const allChunkIds = sourcesUsed.flatMap((source) => source.chunkIds).sort()
  return {
    schemaVersion: '1.0.0',
    contentVersion,
    hexagramNumber,
    schoolId: draft.schoolId,
    essence: draft.essence,
    summary: draft.summary,
    ...(draft.sourceTensionNote
      ? { sourceTensionNote: draft.sourceTensionNote }
      : {}),
    evidenceMode: packet.evidenceMode,
    sourcesUsed,
    sentenceSupport,
    coverage: {
      registeredSourceCount: packet.coverage.registeredSources,
      contributingSourceCount: packet.coverage.contributingSources,
      directSourceCount: packet.coverage.directSources,
      chunkCount: packet.coverage.chunkCount,
    },
    rights: {
      publicationEligibility: packet.publicationEligibility,
      quotationIncluded: false,
    },
    review: {
      status: warnings.length > 0 ? 'needs-revision' : 'qa-passed',
      issues: warnings,
    },
    generation: {
      generatorKind: 'codex-assisted',
      promptVersion,
      generatedAtIso: '2026-07-30T00:00:00Z',
      sourceDigest: sha256(allChunkIds.join('\n')),
    },
  }
}

export const buildPublic = async () => {
  const context = await readAllContext()
  const draftFiles = (await readdir(draftsRoot))
    .filter((name) => /^\d{2}\.json$/u.test(name))
    .sort()
  const outputs = []
  for (const draftFile of draftFiles) {
    const draft = JSON.parse(await readFile(path.join(draftsRoot, draftFile), 'utf8'))
    if (
      draft.records.length !== SCHOOL_IDS.length ||
      new Set(draft.records.map((record) => record.schoolId)).size !== SCHOOL_IDS.length
    ) {
      throw new Error(`${draftFile}: expected one record for each of the six schools`)
    }
    const summaries = []
    for (const schoolId of SCHOOL_IDS) {
      const record = draft.records.find((candidate) => candidate.schoolId === schoolId)
      if (!record) throw new Error(`${draftFile}: missing ${schoolId}`)
      summaries.push(await buildRecord(record, draft.hexagramNumber, context))
    }
    const output = {
      schemaVersion: '1.0.0',
      contentVersion,
      hexagramNumber: draft.hexagramNumber,
      summaries,
    }
    await writeJson(path.join(generatedRoot, draftFile), output)
    outputs.push(output)
  }
  return outputs
}

export const validatePublic = async ({ requireComplete = false } = {}) => {
  const files = (await readdir(generatedRoot))
    .filter((name) => /^\d{2}\.json$/u.test(name))
    .sort()
  if (requireComplete && files.length !== 64) {
    throw new Error(`Expected 64 generated hexagram files; found ${files.length}`)
  }
  const issues = []
  let summaries = 0
  let unavailable = 0
  let needsRevision = 0
  for (const file of files) {
    const payload = JSON.parse(await readFile(path.join(generatedRoot, file), 'utf8'))
    if (payload.summaries.length !== SCHOOL_IDS.length) {
      issues.push(`${file}: does not contain six school records`)
      continue
    }
    const ids = payload.summaries.map((summary) => summary.schoolId)
    if (new Set(ids).size !== SCHOOL_IDS.length) {
      issues.push(`${file}: duplicate school record`)
    }
    for (const summary of payload.summaries) {
      if (summary.evidenceMode === 'insufficient') {
        unavailable += 1
        if (summary.essence || summary.summary) {
          issues.push(`${file}/${summary.schoolId}: insufficient record contains prose`)
        }
        continue
      }
      summaries += 1
      if (summary.review.status === 'needs-revision') needsRevision += 1
      const sentences = splitSentences(summary.summary)
      if (summary.sentenceSupport.length !== sentences.length) {
        issues.push(`${file}/${summary.schoolId}: incomplete sentence support`)
      }
      if (summary.sentenceSupport.some((item) => item.supportingChunkIds.length === 0)) {
        issues.push(`${file}/${summary.schoolId}: unsupported sentence`)
      }
      if (summary.rights.quotationIncluded) {
        issues.push(`${file}/${summary.schoolId}: quotation flag must be false`)
      }
    }
  }
  if (issues.length > 0) {
    throw new Error(`Public commentary validation failed:\n${issues.join('\n')}`)
  }
  return {
    generatedHexagrams: files.length,
    summaryRecords: summaries,
    unavailableRecords: unavailable,
    needsRevisionRecords: needsRevision,
  }
}

export const writeReview = async () => {
  const context = await readAllContext()
  const files = (await readdir(generatedRoot))
    .filter((name) => /^\d{2}\.json$/u.test(name))
    .sort()
  const records = []
  for (const file of files) {
    const payload = JSON.parse(await readFile(path.join(generatedRoot, file), 'utf8'))
    const hexagram = context.hexagrams.find(
      (candidate) => candidate.number === payload.hexagramNumber,
    )
    for (const summary of payload.summaries) {
      records.push({
        hexagramNumber: payload.hexagramNumber,
        hexagramName: hexagram?.nameEnglish ?? 'Unknown',
        schoolId: summary.schoolId,
        essence: summary.essence,
        summary: summary.summary,
        evidenceMode: summary.evidenceMode,
        contributingSources: summary.sourcesUsed.map((source) => ({
          title: source.title,
          contribution: source.contribution,
        })),
        sentenceSupportComplete:
          summary.evidenceMode === 'insufficient'
            ? true
            : summary.sentenceSupport.every(
                (support) => support.supportingChunkIds.length > 0,
              ),
        sourceTensionNote: summary.sourceTensionNote ?? null,
        rightsEligibility: summary.rights.publicationEligibility,
        overlapWarnings: summary.review.issues.filter((issue) =>
          issue.startsWith('Copyright-similarity'),
        ),
        contaminationWarnings: summary.review.issues.filter((issue) =>
          issue.startsWith('Inspect possible'),
        ),
        styleWarnings: summary.review.issues.filter(
          (issue) =>
            !issue.startsWith('Copyright-similarity') &&
            !issue.startsWith('Inspect possible'),
        ),
        reviewStatus: summary.review.status,
      })
    }
  }
  const report = {
    schemaVersion: '1.0.0',
    contentVersion,
    summary: {
      records: records.length,
      qaPassed: records.filter((record) => record.reviewStatus === 'qa-passed').length,
      needsRevision: records.filter((record) => record.reviewStatus === 'needs-revision')
        .length,
      blocked: records.filter((record) => record.reviewStatus === 'blocked').length,
    },
    records,
  }
  await writeJson(path.join(reportsRoot, 'review.json'), report)
  const markdownRecords = records
    .map(
      (record) => `## ${record.hexagramNumber}. ${record.hexagramName} — ${record.schoolId}

- Evidence: \`${record.evidenceMode}\`
- Sources: ${record.contributingSources.map((source) => `${source.title} (${source.contribution})`).join('; ') || 'none'}
- Sentence support complete: ${record.sentenceSupportComplete ? 'yes' : 'no'}
- Rights: \`${record.rightsEligibility}\`
- Review: \`${record.reviewStatus}\`
- Warnings: ${[...record.overlapWarnings, ...record.contaminationWarnings, ...record.styleWarnings].join(' ') || 'none'}

**Essence:** ${record.essence || 'Unavailable'}

${record.summary || 'No synthesis is generated because eligible evidence is unavailable.'}

${record.sourceTensionNote ? `**Source tension:** ${record.sourceTensionNote}` : ''}
`,
    )
    .join('\n')
  await writeText(
    path.join(reportsRoot, 'review.md'),
    `# Hexagram school synthesis review

This report contains public draft prose and attribution metadata only. It does not include protected
source passages.

${markdownRecords}`,
  )
  const quarantinedChunks = context.chunkRecords
    .filter((record) => !record.ingestion_eligible)
    .map((record) => ({
      sourceId: record.source_id,
      hexagramNumber: record.hexagram,
      issues: record.issues,
    }))
  const blockedCells = records
    .filter((record) => record.reviewStatus === 'blocked')
    .map((record) => ({
      hexagramNumber: record.hexagramNumber,
      hexagramName: record.hexagramName,
      schoolId: record.schoolId,
      reason:
        record.styleWarnings[0] ??
        record.contaminationWarnings[0] ??
        record.overlapWarnings[0] ??
        'No eligible evidence is available.',
    }))
  await writeJson(path.join(reportsRoot, 'unresolved.json'), {
    schemaVersion: '1.0.0',
    summary: {
      quarantinedChunks: quarantinedChunks.length,
      blockedCells: blockedCells.length,
      missingTransitionSources: 1,
    },
    quarantinedChunks,
    blockedCells,
    missingInputs: [
      {
        input: 'Jiaoshi Yilin transition corpus',
        status: 'not-registered',
        effect: 'Transition-commentary synthesis is excluded.',
      },
    ],
  })
  const quarantineRows = quarantinedChunks
    .map(
      (record) =>
        `| \`${record.sourceId}\` | ${record.hexagramNumber} | ${record.issues.join(' ')} |`,
    )
    .join('\n')
  const blockedRows = blockedCells
    .map(
      (record) =>
        `| ${record.hexagramNumber} · ${record.hexagramName} | ${record.schoolId} | ${record.reason} |`,
    )
    .join('\n')
  await writeText(
    path.join(reportsRoot, 'MANUAL_INPUT_REQUIRED.md'),
    `# Manual input required

Automated generation is complete. These items require corrected source material or an explicit
editorial decision; they are not synthesized by inference.

## Quarantined source records

| Source | Hexagram | Reason |
| --- | ---: | --- |
${quarantineRows}

## Blocked school cells

| Hexagram | School | Reason |
| --- | --- | --- |
${blockedRows}

## Missing optional corpus

No Jiaoshi Yilin transition corpus is registered. Transition commentary remains excluded.
`,
  )
  return report.summary
}

const command = process.argv[2] ?? 'validate'
switch (command) {
  case 'build':
    console.log(JSON.stringify({ hexagrams: (await buildPublic()).length }, null, 2))
    break
  case 'validate':
    console.log(JSON.stringify(await validatePublic(), null, 2))
    break
  case 'validate-complete':
    console.log(JSON.stringify(await validatePublic({ requireComplete: true }), null, 2))
    break
  case 'review':
    console.log(JSON.stringify(await writeReview(), null, 2))
    break
  default:
    throw new Error(`Unknown public commentary command: ${command}`)
}
