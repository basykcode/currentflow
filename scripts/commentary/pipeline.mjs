#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  SCHOOL_IDS,
  chunkIdFor,
  detectSectionCoverage,
  extractCoreSentences,
  extractVocabulary,
  internalRoot,
  normalizeSchoolLabel,
  normalizeWhitespace,
  rawCorpusRoot,
  readAllContext,
  reportsRoot,
  sha256,
  sourceChunkPath,
  writeJson,
  writeText,
} from './lib.mjs'

const command = process.argv[2] ?? 'check'

const countBy = (values) =>
  Object.fromEntries(
    [...new Set(values)].sort().map((value) => [
      value,
      values.filter((candidate) => candidate === value).length,
    ]),
  )

const inventory = async () => {
  const context = await readAllContext()
  const normalizedLabels = []
  for (const record of context.chunkRecords) {
    const canonical = normalizeSchoolLabel(record.lens, context.schoolRegistry)
    normalizedLabels.push({ input: record.lens, output: canonical })
  }
  const uniqueNormalizations = [
    ...new Map(
      normalizedLabels.map((entry) => [`${entry.input}:${entry.output}`, entry]),
    ).values(),
  ].sort((left, right) => left.input.localeCompare(right.input))

  const checksumGroups = new Map()
  for (const record of context.chunkRecords) {
    const keys = checksumGroups.get(record.sha256) ?? []
    keys.push(`${record.source_id}:hex-${String(record.hexagram).padStart(2, '0')}`)
    checksumGroups.set(record.sha256, keys)
  }
  const duplicateChunks = [...checksumGroups.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([checksum, chunkKeys]) => ({ checksum, chunkKeys }))

  const ambiguousChunks = context.chunkRecords
    .filter((record) => !record.ingestion_eligible || record.issues.length > 0)
    .map((record) => ({
      sourceId: record.source_id,
      hexagramNumber: record.hexagram,
      chunkId: chunkIdFor(record),
      issues: record.issues,
    }))

  const payload = {
    schemaVersion: '1.0.0',
    generatedFrom: {
      sourceManifest: 'content/yijing/source-manifest.json',
      schoolRegistry: 'content/yijing/school-registry.json',
      chunkIndex: 'data/hexagram-commentary/chunk-index.jsonl',
    },
    corpus: {
      sourceDirectories: context.sources.length,
      rawChunkFiles: context.chunkRecords.length,
      ingestionEligibleChunks: context.chunkRecords.filter(
        (record) => record.ingestion_eligible,
      ).length,
      rejectedChunks: ambiguousChunks.length,
      fileFormat: 'UTF-8 plain text',
      namingConvention: 'hex_01.txt through hex_64.txt',
      sourceLocator: 'source-relative file path plus SHA-256',
      rawTextDistribution: 'local-only-git-ignored',
    },
    sourceCountsBySchool: countBy(context.sources.map((source) => source.schoolId)),
    rightsStatusCounts: countBy(context.sources.map((source) => source.rightsStatus)),
    displayPolicyCounts: countBy(context.sources.map((source) => source.displayPolicy)),
    sourceRoles: countBy(context.sources.map((source) => source.sourceRole)),
    languages: countBy(context.sources.map((source) => source.language)),
    labelNormalizations: uniqueNormalizations,
    unknownLabelsRejected: [],
    duplicateChunks,
    ambiguousChunks,
    transitionSources: [],
    yilinExcluded: true,
    notes: [
      'The raw corpus remains in its documented location and was not moved or renamed.',
      'Raw chunks are whole-hexagram files; section and line coverage are detected without rewriting the originals.',
      'The canonical hexagram identity registry remains src/domain/astrology/hexagrams.ts.',
    ],
  }
  await writeJson(path.join(reportsRoot, 'source-inventory.json'), payload)

  const schoolRows = SCHOOL_IDS.map((schoolId) => {
    const sources = context.sources.filter((source) => source.schoolId === schoolId)
    return `| ${schoolId} | ${sources.length} | ${sources.map((source) => `\`${source.sourceId}\``).join(', ')} |`
  }).join('\n')
  const issueRows = ambiguousChunks
    .map(
      (chunk) =>
        `| \`${chunk.sourceId}\` | ${chunk.hexagramNumber} | ${chunk.issues.join(' ')} |`,
    )
    .join('\n')
  const labelRows = uniqueNormalizations
    .map((entry) => `| \`${entry.input}\` | \`${entry.output}\` |`)
    .join('\n')
  await writeText(
    path.join(reportsRoot, 'source-inventory.md'),
    `# Yijing commentary source inventory

This report is generated before synthesis. It describes the existing local corpus without moving,
renaming, or publishing its protected source text.

## Corpus

- Source directories: ${payload.corpus.sourceDirectories}
- Raw chunks: ${payload.corpus.rawChunkFiles}
- Ingestion-eligible chunks: ${payload.corpus.ingestionEligibleChunks}
- Rejected or ambiguous chunks: ${payload.corpus.rejectedChunks}
- Format: ${payload.corpus.fileFormat}
- Naming: \`${payload.corpus.namingConvention}\`
- Raw distribution: ${payload.corpus.rawTextDistribution}
- Jiaoshi Yilin / 焦氏易林 sources found: none

## Sources by school

| Canonical school | Count | Registered sources |
| --- | ---: | --- |
${schoolRows}

## Label normalization

| Source label | Canonical school |
| --- | --- |
${labelRows}

Unknown labels rejected: none.

## Quarantined records

| Source | Hexagram file | Reason |
| --- | ---: | --- |
${issueRows}

## Duplicate check

Exact duplicate SHA-256 groups: ${duplicateChunks.length}. Similar or misidentified legacy records
remain quarantined through explicit quality findings rather than silently remapped.
`,
  )
  return payload
}

const normalize = async () => {
  const context = await readAllContext()
  const normalizedDirectory = path.join(internalRoot, 'normalized')
  await mkdir(normalizedDirectory, { recursive: true })
  const records = []
  const rejected = []

  for (const indexRecord of context.chunkRecords) {
    const source = context.sourceById.get(indexRecord.source_id)
    if (!source) throw new Error(`Unknown source ${indexRecord.source_id}`)
    const chunkId = chunkIdFor(indexRecord)
    if (!indexRecord.ingestion_eligible) {
      rejected.push({
        chunkId,
        sourceId: source.sourceId,
        hexagramNumber: indexRecord.hexagram,
        issues: indexRecord.issues,
      })
      continue
    }

    const sourceFile = sourceChunkPath(source, indexRecord.hexagram)
    const originalText = await readFile(sourceFile, 'utf8')
    if (!originalText.trim()) {
      throw new Error(`${source.sourceId}/${indexRecord.hexagram}: empty chunk`)
    }
    const actualChecksum = sha256(Buffer.from(originalText, 'utf8'))
    if (actualChecksum !== indexRecord.sha256) {
      throw new Error(`${source.sourceId}/${indexRecord.hexagram}: checksum mismatch`)
    }
    const normalizedText = normalizeWhitespace(originalText)
    const sectionLabel = normalizedText.split('\n').find(Boolean)
    records.push({
      schemaVersion: '1.0.0',
      chunkId,
      sourceId: source.sourceId,
      schoolId: source.schoolId,
      sourceRole: source.sourceRole,
      hexagramNumber: indexRecord.hexagram,
      sectionLabel,
      sourceLocator: `hex_${String(indexRecord.hexagram).padStart(2, '0')}`,
      language: source.language,
      originalText,
      normalizedText,
      directness: 'direct-hexagram',
      rightsStatus: source.rightsStatus,
      displayPolicy: source.displayPolicy,
      sourceFile: path
        .relative(path.join(rawCorpusRoot, '..', '..'), sourceFile)
        .replaceAll(path.sep, '/'),
      sourceChecksum: actualChecksum,
    })
  }

  const chunkIds = records.map((record) => record.chunkId)
  if (new Set(chunkIds).size !== chunkIds.length) {
    throw new Error('Normalized chunk IDs are not unique')
  }
  await writeFile(
    path.join(normalizedDirectory, 'chunks.jsonl'),
    `${records.map((record) => JSON.stringify(record)).join('\n')}\n`,
    'utf8',
  )
  await writeJson(path.join(normalizedDirectory, 'rejected.json'), {
    schemaVersion: '1.0.0',
    rejected,
  })
  return { normalized: records.length, rejected: rejected.length }
}

const coverage = async () => {
  const context = await readAllContext()
  const cells = []
  for (const hexagram of context.hexagrams) {
    for (const schoolId of SCHOOL_IDS) {
      const sources = context.sources.filter((source) => source.schoolId === schoolId)
      const chunks = sources.map((source) => ({
        source,
        record: context.chunkByKey.get(`${source.sourceId}:${hexagram.number}`),
      }))
      const eligible = chunks.filter((item) => item.record?.ingestion_eligible)
      const sectionCoverage = []
      for (const item of eligible) {
        const text = await readFile(sourceChunkPath(item.source, hexagram.number), 'utf8')
        sectionCoverage.push(detectSectionCoverage(text))
      }
      cells.push({
        hexagramNumber: hexagram.number,
        hexagramName: hexagram.nameEnglish,
        schoolId,
        registeredSources: sources.map((source) => source.sourceId),
        directCommentarySourceCount: eligible.filter(
          (item) => !item.source.frameworkOnly,
        ).length,
        frameworkSourceCount: eligible.filter((item) => item.source.frameworkOnly).length,
        chunkCount: eligible.length,
        judgmentCommentaryCoverage: sectionCoverage.filter((item) => item.judgment).length,
        imageCommentaryCoverage: sectionCoverage.filter((item) => item.image).length,
        lineCommentaryCoverage: sectionCoverage.filter((item) => item.line).length,
        languages: [...new Set(eligible.map((item) => item.source.language))],
        rightsStatuses: [...new Set(eligible.map((item) => item.source.rightsStatus))],
        publishability: eligible.length > 0 ? 'draft-only' : 'unavailable',
        missingSources: chunks
          .filter((item) => !item.record?.ingestion_eligible)
          .map((item) => item.source.sourceId),
        duplicateSources: [],
        ambiguousChunks: chunks
          .filter((item) => item.record && !item.record.ingestion_eligible)
          .map((item) => ({
            chunkId: chunkIdFor(item.record),
            issues: item.record.issues,
          })),
      })
    }
  }
  if (cells.length !== 64 * SCHOOL_IDS.length) {
    throw new Error(`Coverage matrix must contain 384 cells; found ${cells.length}`)
  }
  const payload = {
    schemaVersion: '1.0.0',
    dimensions: { hexagrams: 64, schools: SCHOOL_IDS.length, cells: cells.length },
    summary: {
      cellsWithEvidence: cells.filter((cell) => cell.chunkCount > 0).length,
      unavailableCells: cells.filter((cell) => cell.chunkCount === 0).length,
      ambiguousChunkReferences: cells.reduce(
        (count, cell) => count + cell.ambiguousChunks.length,
        0,
      ),
    },
    cells,
  }
  await writeJson(path.join(reportsRoot, 'coverage.json'), payload)
  const rows = cells
    .map(
      (cell) =>
        `| ${cell.hexagramNumber} | ${cell.hexagramName} | ${cell.schoolId} | ${cell.chunkCount}/${cell.registeredSources.length} | ${cell.judgmentCommentaryCoverage} | ${cell.imageCommentaryCoverage} | ${cell.lineCommentaryCoverage} | ${cell.publishability} | ${cell.missingSources.join(', ') || '—'} |`,
    )
    .join('\n')
  await writeText(
    path.join(reportsRoot, 'coverage.md'),
    `# Yijing commentary coverage

The matrix contains all 64 × 6 cells. Counts describe eligible whole-hexagram source chunks;
judgment, image, and line values report detected section coverage without promoting line material
into the base synthesis.

| # | Hexagram | School | Chunks | Judgment | Image | Lines | Status | Missing or rejected |
| ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${rows}
`,
  )
  return payload
}

const buildDigests = async () => {
  const context = await readAllContext()
  const normalizedPath = path.join(internalRoot, 'normalized', 'chunks.jsonl')
  const normalizedLines = (await readFile(normalizedPath, 'utf8'))
    .split(/\r?\n/gu)
    .filter(Boolean)
  const normalized = normalizedLines.map((line) => JSON.parse(line))
  const normalizedByKey = new Map(
    normalized.map((record) => [`${record.sourceId}:${record.hexagramNumber}`, record]),
  )
  let completed = 0
  let insufficient = 0

  for (const source of context.sources) {
    for (const hexagram of context.hexagrams) {
      const chunk = normalizedByKey.get(`${source.sourceId}:${hexagram.number}`)
      const indexRecord = context.chunkByKey.get(`${source.sourceId}:${hexagram.number}`)
      const outputPath = path.join(
        internalRoot,
        'digests',
        source.sourceId,
        `hex_${String(hexagram.number).padStart(2, '0')}.json`,
      )
      if (!chunk || !indexRecord) {
        insufficient += 1
        await writeJson(outputPath, {
          schemaVersion: '1.0.0',
          hexagramNumber: hexagram.number,
          schoolId: source.schoolId,
          sourceId: source.sourceId,
          evidenceMode: 'insufficient',
          centralDynamic: [],
          situationDescription: [],
          characteristicImages: [],
          tensionsOrRisks: [],
          capacitiesOrVirtues: [],
          relationalImplications: [],
          transformationOrDevelopment: [],
          sourceSpecificTerms: [],
          ambiguities: indexRecord?.issues ?? ['Eligible source chunk is unavailable.'],
          internalContradictions: [],
          excludedChunkIds: indexRecord ? [chunkIdFor(indexRecord)] : [],
          usedChunkIds: [],
        })
        continue
      }

      const sentences = extractCoreSentences(chunk.normalizedText)
      const claim = (sentence, confidence = 'explicit') =>
        sentence
          ? {
              text: sentence,
              supportingChunkIds: [chunk.chunkId],
              confidence,
              sourceLocator: chunk.sourceLocator,
            }
          : null
      const claims = sentences.map((sentence) => claim(sentence)).filter(Boolean)
      const vocabulary = extractVocabulary(sentences.join(' '))
      const digest = {
        schemaVersion: '1.0.0',
        hexagramNumber: hexagram.number,
        schoolId: source.schoolId,
        sourceId: source.sourceId,
        evidenceMode: 'direct',
        centralDynamic: claims.slice(0, 1),
        situationDescription: claims.slice(1, 2),
        characteristicImages: claims.slice(2, 3),
        tensionsOrRisks: claims.slice(3, 4),
        capacitiesOrVirtues: claims.slice(4, 5),
        relationalImplications: claims.slice(5, 6),
        transformationOrDevelopment: claims.slice(6, 7),
        sourceSpecificTerms:
          vocabulary.length > 0
            ? [
                {
                  text: `Source vocabulary: ${vocabulary.join(', ')}`,
                  supportingChunkIds: [chunk.chunkId],
                  confidence: 'explicit',
                  sourceLocator: chunk.sourceLocator,
                },
              ]
            : [],
        ambiguities: [],
        internalContradictions: [],
        excludedChunkIds: [],
        usedChunkIds: [chunk.chunkId],
      }
      await writeJson(outputPath, digest)
      completed += 1
    }
  }
  return { completed, insufficient }
}

const buildPackets = async () => {
  const context = await readAllContext()
  let completed = 0
  let insufficient = 0
  for (const hexagram of context.hexagrams) {
    for (const schoolId of SCHOOL_IDS) {
      const sources = context.sources.filter((source) => source.schoolId === schoolId)
      const digests = await Promise.all(
        sources.map((source) =>
          readFile(
            path.join(
              internalRoot,
              'digests',
              source.sourceId,
              `hex_${String(hexagram.number).padStart(2, '0')}.json`,
            ),
            'utf8',
          ).then(JSON.parse),
        ),
      )
      const contributing = digests.filter((digest) => digest.evidenceMode !== 'insufficient')
      const chunkIds = contributing.flatMap((digest) => digest.usedChunkIds)
      const vocabulary = [
        ...new Set(
          contributing.flatMap((digest) =>
            digest.sourceSpecificTerms.flatMap((claim) =>
              claim.text.replace(/^Source vocabulary:\s*/u, '').split(/,\s*/u),
            ),
          ),
        ),
      ].slice(0, 18)
      const evidenceMode =
        contributing.length === 0
          ? 'insufficient'
          : contributing.length === 1
            ? 'single-source-direct'
            : 'multi-source-direct'
      const sourceTensions =
        contributing.length > 1
          ? [
              {
                classification: 'scope-difference',
                description:
                  'Registered sources approach the same configuration from different historical or system-specific scopes; the packet preserves those emphases separately.',
                sourceIds: contributing.map((digest) => digest.sourceId),
              },
            ]
          : []
      const packet = {
        schemaVersion: '1.0.0',
        hexagramNumber: hexagram.number,
        schoolId,
        sourceDigests: digests,
        sharedEmphases:
          vocabulary.length > 0
            ? [
                {
                  text: `Recurring packet vocabulary: ${vocabulary.slice(0, 8).join(', ')}`,
                  supportingChunkIds: chunkIds,
                },
              ]
            : [],
        distinctEmphases: contributing.flatMap((digest) =>
          digest.centralDynamic.map((claim) => ({
            sourceId: digest.sourceId,
            text: claim.text,
            supportingChunkIds: claim.supportingChunkIds,
          })),
        ),
        sourceTensions,
        vocabulary,
        coverage: {
          registeredSources: sources.length,
          contributingSources: contributing.length,
          directSources: contributing.length,
          frameworkSources: contributing.filter(
            (digest) => digest.evidenceMode === 'framework-applied',
          ).length,
          chunkCount: chunkIds.length,
        },
        contributionStatuses: digests.map((digest) => ({
          sourceId: digest.sourceId,
          status: digest.evidenceMode === 'insufficient' ? 'excluded for quality' : 'used',
        })),
        evidenceMode,
        publicationEligibility:
          contributing.length > 0 ? 'draft-only' : 'blocked',
      }
      await writeJson(
        path.join(
          internalRoot,
          'packets',
          `hex_${String(hexagram.number).padStart(2, '0')}`,
          `${schoolId}.json`,
        ),
        packet,
      )
      if (contributing.length > 0) completed += 1
      else insufficient += 1
    }
  }
  return { completed, insufficient }
}

const run = async () => {
  switch (command) {
    case 'inventory':
      console.log(JSON.stringify(await inventory(), null, 2))
      return
    case 'normalize':
      console.log(JSON.stringify(await normalize(), null, 2))
      return
    case 'coverage':
      console.log(JSON.stringify((await coverage()).summary, null, 2))
      return
    case 'build-digests':
      console.log(JSON.stringify(await buildDigests(), null, 2))
      return
    case 'build-packets':
      console.log(JSON.stringify(await buildPackets(), null, 2))
      return
    case 'prepare': {
      await inventory()
      const normalized = await normalize()
      const coverageReport = await coverage()
      const digests = await buildDigests()
      const packets = await buildPackets()
      console.log(
        JSON.stringify(
          { normalized, coverage: coverageReport.summary, digests, packets },
          null,
          2,
        ),
      )
      return
    }
    default:
      throw new Error(`Unknown commentary pipeline command: ${command}`)
  }
}

await run()
