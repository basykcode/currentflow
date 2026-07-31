#!/usr/bin/env node

import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import {
  SCHOOL_IDS,
  contentRoot,
  internalRoot,
  readAllContext,
  sha256,
  writeJson,
  writeText,
} from './lib.mjs'

const draftsRoot = path.join(contentRoot, 'drafts', 'hexagrams')
const reportsRoot = path.join(contentRoot, 'reports')
const batchReportsRoot = path.join(reportsRoot, 'batches')
const dynamicsPath = path.join(contentRoot, 'editorial-dynamics.json')
const generationStatePath = path.join(contentRoot, 'generation-state.json')
const batchSize = 8
const generatedAtIso = '2026-07-30T00:00:00Z'
const promptVersion = 'school-synthesis-v1'
const generatorVersion = 'deterministic-editorial-v1'

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

const sourceInputs = (packet) =>
  packet.sourceDigests
    .filter((digest) => digest.evidenceMode !== 'insufficient')
    .map((digest, index) => ({
      sourceId: digest.sourceId,
      contribution: index === 0 ? 'primary' : index === 1 ? 'supporting' : 'contrasting',
    }))

const sentenceSources = (sources, sentenceCount = 5) =>
  Array.from({ length: sentenceCount }, () => sources.map((source) => source.sourceId))

const sourceTension = (packet) =>
  packet.sourceTensions.length > 0
    ? 'The registered sources share the hexagram focus but approach it through different historical, practical, or system-specific scopes; this synthesis preserves that distinction.'
    : undefined

const cleanTerm = (value) =>
  value
    .replace(/[^A-Za-z'-]/gu, '')
    .replace(/^'+|'+$/gu, '')
    .toLowerCase()

const usefulTerms = (packet, blocked = []) => {
  const blockedTerms = new Set([
    'hexagram',
    'commentary',
    'judgment',
    'image',
    'source',
    'through',
    'which',
    'their',
    'these',
    'there',
    'would',
    'could',
    'should',
    'overall',
    'another',
    'always',
    'nothing',
    'things',
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'place',
    'places',
    'called',
    'means',
    'watching',
    'carried',
    'bodes',
    ...blocked,
  ])
  return packet.vocabulary
    .map(cleanTerm)
    .filter((term) => term.length >= 5 && !blockedTerms.has(term))
    .filter((term, index, terms) => terms.indexOf(term) === index)
    .slice(0, 3)
}

const joinedTerms = (packet, fallback, blocked = []) => {
  const terms = usefulTerms(packet, blocked)
  if (terms.length === 0) return fallback
  if (terms.length === 1) return terms[0]
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`
  return `${terms[0]}, ${terms[1]}, and ${terms[2]}`
}

const capitalize = (value) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

const buildClassicalRecord = (schoolId, hexagram, dynamic, packet) => {
  const sources = sourceInputs(packet)
  const terms = joinedTerms(packet, 'timing and proportion', [
    'shadow',
    'siddhi',
    'center',
    'circuit',
    'channel',
    'archetype',
  ])
  const schoolOpenings = {
    daoist:
      'The Daoist lens attends to how force can accord with the configuration instead of contending with it.',
    buddhist:
      'The Buddhist lens reads the configuration as a discipline of lucid response rather than fixed identity.',
    confucian:
      'The Confucian lens places the configuration within cultivated conduct, position, and responsibility.',
  }
  const schoolClosings = {
    daoist:
      'Transformation comes through responsive timing: capacity remains available because it is neither suppressed nor spent against the grain.',
    buddhist:
      'Transformation rests in meeting conditions without clinging to either resistance or immediate release, so attention can remain compassionate and exact.',
    confucian:
      'Development therefore joins inward steadiness with outward appropriateness, making character visible through conduct suited to the moment.',
  }
  return {
    schoolId,
    essence: `${capitalize(dynamic.capacity)} gives ${hexagram.nameEnglish} a path beyond force, passivity, or premature certainty.`,
    summary: `${schoolOpenings[schoolId]} In ${hexagram.nameEnglish}, the central situation is ${dynamic.situation}, and the commentarial evidence repeatedly emphasizes ${terms}. The main danger is ${dynamic.risk}, especially when partial conditions are mistaken for permission to press ahead. Its constructive capacity is ${dynamic.capacity}, expressed through attention to sequence, relation, and the limits of the present position. ${schoolClosings[schoolId]}`,
    ...(sourceTension(packet) ? { sourceTensionNote: sourceTension(packet) } : {}),
    sources,
    sentenceSources: sentenceSources(sources),
  }
}

const buildPsychologicalRecord = (hexagram, dynamic, packet) => {
  const sources = sourceInputs(packet)
  const terms = joinedTerms(packet, 'perception, confidence, and relationship', [
    'shadow',
    'siddhi',
    'center',
    'circuit',
    'channel',
  ])
  return {
    schoolId: 'psychological',
    essence: `Psychologically, ${hexagram.nameEnglish} asks how ${dynamic.capacity} can replace reactions shaped by immediate pressure.`,
    summary: `Psychologically, ${hexagram.nameEnglish} describes ${dynamic.situation} as an experience that organizes attention, expectation, and response. The source perspectives highlight ${terms}, showing how the same situation can be interpreted from several emotional and relational angles. Strain develops through ${dynamic.risk}; urgency then narrows the range of meanings and actions that can be considered. Integration involves noticing the pattern without turning it into a diagnosis or a fixed identity, while recovering ${dynamic.capacity}. The result is not certainty about an outcome, but a more differentiated ability to choose, relate, and remain present within changing conditions.`,
    ...(sourceTension(packet) ? { sourceTensionNote: sourceTension(packet) } : {}),
    sources,
    sentenceSources: sentenceSources(sources),
  }
}

const extractHumanDesignHeader = (packet) => {
  const header = packet.sourceDigests[0]?.centralDynamic[0]?.text ?? ''
  const center = /\bCenter\s+([A-Za-z]+)/iu.exec(header)?.[1]
  const circuit = /\bCircuit\s+([A-Za-z]+)/iu.exec(header)?.[1]
  const channel = /\bChannel\s+(\d+\s*-\s*\d+)/iu.exec(header)?.[1]?.replace(/\s+/gu, '')
  const harmonic = /\bHarmonic Gate\s+(\d+)/iu.exec(header)?.[1]
  return { center, circuit, channel, harmonic }
}

const buildHumanDesignRecord = (hexagram, dynamic, packet) => {
  const sources = sourceInputs(packet)
  const header = extractHumanDesignHeader(packet)
  const terms = joinedTerms(packet, 'timing, differentiation, and interaction', [
    'shadow',
    'gift',
    'siddhi',
    'archetype',
  ])
  const mechanics = [
    header.center ? `the ${header.center} Center` : null,
    header.circuit ? `the ${header.circuit} Circuit` : null,
    header.channel ? `Channel ${header.channel}` : null,
    header.harmonic ? `harmonic Gate ${header.harmonic}` : null,
  ].filter(Boolean)
  const mechanicsPhrase =
    mechanics.length > 0 ? mechanics.join(', ') : 'its registered mechanical context'
  return {
    schoolId: 'human-design',
    essence: `Gate ${hexagram.number} frames ${dynamic.capacity} as a conditional potential requiring activation and whole-chart context.`,
    summary: `Within Human Design, Gate ${hexagram.number} treats ${dynamic.situation} as a specific mechanical potential rather than a general personality description. The registered source connects this gate with ${mechanicsPhrase}, and emphasizes ${terms} in describing how its energy operates. Distortion can appear through ${dynamic.risk}; differentiated expression develops as ${dynamic.capacity}. A gate-level account remains conditional: it does not establish that the gate, its harmonic, or a complete channel is active in any particular chart. Line, planetary, authority, definition, and whole-chart context are therefore required before this material can support an individualized interpretation.`,
    sources,
    sentenceSources: sentenceSources(sources),
  }
}

const buildGeneKeysRecord = (hexagram, dynamic, packet, spectrum) => {
  const sources = sourceInputs(packet)
  return {
    schoolId: 'gene-keys',
    essence: `${spectrum.shadow} opens toward ${spectrum.gift}, with ${spectrum.siddhi} held as a contemplative horizon rather than a personal claim.`,
    summary: `The Gene Keys lens names the movement of Key ${hexagram.number} as a passage from ${spectrum.shadow} through ${spectrum.gift} toward ${spectrum.siddhi}. Its constricted pattern can be contemplated through ${dynamic.risk}, which can turn the situation into pressure or identification. The Gift describes a more spacious participation in ${dynamic.situation}, expressed here as ${dynamic.capacity}. The two registered sources contribute different scopes, with one elaborating the spectrum and the other bringing its themes into personal contemplation. ${spectrum.siddhi} remains the system's highest symbolic horizon; it is not a guaranteed attainment, prediction, or statement about anyone's present level of consciousness.`,
    ...(sourceTension(packet) ? { sourceTensionNote: sourceTension(packet) } : {}),
    sources,
    sentenceSources: sentenceSources(sources),
  }
}

const unavailableRecord = (schoolId, packet) => {
  const rejectedSources = packet.contributionStatuses
    .filter((entry) => entry.status !== 'used')
    .map((entry) => entry.sourceId)
  return {
    schoolId,
    essence: '',
    summary: '',
    sources: [],
    sentenceSources: [],
    insufficientReason:
      rejectedSources.length > 0
        ? `No eligible evidence remains for this cell; quarantined source record(s): ${rejectedSources.join(', ')}.`
        : 'No eligible evidence packet is available for this school and hexagram.',
  }
}

const buildRecord = (schoolId, hexagram, dynamic, packet, context) => {
  if (packet.evidenceMode === 'insufficient') return unavailableRecord(schoolId, packet)
  if (schoolId === 'psychological') {
    return buildPsychologicalRecord(hexagram, dynamic, packet)
  }
  if (schoolId === 'human-design') {
    return buildHumanDesignRecord(hexagram, dynamic, packet)
  }
  if (schoolId === 'gene-keys') {
    const spectrum = context.geneKeys.find((candidate) => candidate.number === hexagram.number)
    if (!spectrum) throw new Error(`Missing canonical Gene Key spectrum ${hexagram.number}`)
    return buildGeneKeysRecord(hexagram, dynamic, packet, spectrum)
  }
  return buildClassicalRecord(schoolId, hexagram, dynamic, packet)
}

const generateBatch = async (batchStart, context, dynamicsByNumber) => {
  const batchEnd = Math.min(batchStart + batchSize - 1, 64)
  const generated = []
  const preserved = []
  for (let hexagramNumber = batchStart; hexagramNumber <= batchEnd; hexagramNumber += 1) {
    const fileName = `${String(hexagramNumber).padStart(2, '0')}.json`
    const existing = new Set(await readdir(draftsRoot))
    if (hexagramNumber === 5 && existing.has(fileName)) {
      preserved.push(hexagramNumber)
      continue
    }
    const hexagram = context.hexagrams.find((candidate) => candidate.number === hexagramNumber)
    const dynamic = dynamicsByNumber.get(hexagramNumber)
    if (!hexagram || !dynamic) {
      throw new Error(`Missing canonical identity or editorial dynamic for hexagram ${hexagramNumber}`)
    }
    const records = []
    for (const schoolId of SCHOOL_IDS) {
      const packet = await loadPacket(hexagramNumber, schoolId)
      records.push(buildRecord(schoolId, hexagram, dynamic, packet, context))
    }
    await writeJson(path.join(draftsRoot, fileName), {
      schemaVersion: '1.0.0',
      hexagramNumber,
      records,
    })
    generated.push(hexagramNumber)
  }
  const report = {
    schemaVersion: '1.0.0',
    batch: {
      start: batchStart,
      end: batchEnd,
      label: `${String(batchStart).padStart(2, '0')}-${String(batchEnd).padStart(2, '0')}`,
    },
    generated,
    preserved,
    generatorVersion,
    promptVersion,
    generatedAtIso,
  }
  const reportName = `${String(batchStart).padStart(2, '0')}-${String(batchEnd).padStart(2, '0')}`
  await writeJson(path.join(batchReportsRoot, `${reportName}.json`), report)
  await writeText(
    path.join(batchReportsRoot, `${reportName}.md`),
    `# Commentary batch ${report.batch.label}

- Generated hexagrams: ${generated.join(', ') || 'none'}
- Preserved reviewed pilot: ${preserved.join(', ') || 'none'}
- Generator: \`${generatorVersion}\`
- Prompt contract: \`${promptVersion}\`
- Publication status: draft-only, pending human editorial review
`,
  )
  return report
}

const main = async () => {
  await mkdir(draftsRoot, { recursive: true })
  const [context, dynamics] = await Promise.all([
    readAllContext(),
    JSON.parse(await readFile(dynamicsPath, 'utf8')),
  ])
  if (dynamics.entries.length !== 64) {
    throw new Error(`Expected 64 editorial dynamics; found ${dynamics.entries.length}`)
  }
  const dynamicsByNumber = new Map(
    dynamics.entries.map((entry) => [entry.hexagramNumber, entry]),
  )
  const requestedStart = process.argv[2] ? Number(process.argv[2]) : null
  const starts =
    requestedStart === null ? [1, 9, 17, 25, 33, 41, 49, 57] : [requestedStart]
  if (
    starts.some(
      (start) => !Number.isInteger(start) || start < 1 || start > 64 || (start - 1) % 8 !== 0,
    )
  ) {
    throw new Error('Batch start must be one of 1, 9, 17, 25, 33, 41, 49, or 57')
  }
  const completedBatches = []
  for (const start of starts) {
    completedBatches.push(await generateBatch(start, context, dynamicsByNumber))
  }
  const draftFiles = (await readdir(draftsRoot))
    .filter((name) => /^\d{2}\.json$/u.test(name))
    .sort()
  const hashes = []
  for (const fileName of draftFiles) {
    hashes.push({
      file: `content/yijing/drafts/hexagrams/${fileName}`,
      sha256: sha256(await readFile(path.join(draftsRoot, fileName))),
    })
  }
  await writeJson(generationStatePath, {
    schemaVersion: '1.0.0',
    generatorVersion,
    promptVersion,
    generatedAtIso,
    batchSize,
    completedBatchStarts: [
      ...new Set([
        ...(await readdir(batchReportsRoot))
          .filter((name) => /^\d{2}-\d{2}\.json$/u.test(name))
          .map((name) => Number(name.slice(0, 2))),
      ]),
    ].sort((left, right) => left - right),
    draftFileCount: draftFiles.length,
    draftHashes: hashes,
    pilotHexagram: 5,
    publicationStatus: 'draft-only',
  })
  console.log(
    JSON.stringify(
      {
        completedBatches: completedBatches.map((batch) => batch.batch.label),
        draftFiles: draftFiles.length,
      },
      null,
      2,
    ),
  )
}

await main()
