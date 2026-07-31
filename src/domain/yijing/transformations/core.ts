import { getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramLines, HexagramReference, LinePolarity } from '@/domain/astrology/types'

import { getTransformationDefinition } from './registry'
import type { LineNumber, TransformationResult } from './types'

export const LINE_NUMBERS: readonly LineNumber[] = [1, 2, 3, 4, 5, 6]

export const oppositePolarity = (line: LinePolarity): LinePolarity =>
  line === 'yang' ? 'yin' : 'yang'

/**
 * All domain arrays use traditional construction order:
 * index 0 is line 1 at the bottom; index 5 is line 6 at the top.
 */
export const calculateLineChange = (
  lines: HexagramLines,
  changedLines: readonly LineNumber[],
): HexagramLines => {
  const selected = new Set(changedLines)
  return [
    selected.has(1) ? oppositePolarity(lines[0]) : lines[0],
    selected.has(2) ? oppositePolarity(lines[1]) : lines[1],
    selected.has(3) ? oppositePolarity(lines[2]) : lines[2],
    selected.has(4) ? oppositePolarity(lines[3]) : lines[3],
    selected.has(5) ? oppositePolarity(lines[4]) : lines[4],
    selected.has(6) ? oppositePolarity(lines[5]) : lines[5],
  ]
}

export const calculateNuclear = (lines: HexagramLines): HexagramLines => [
  lines[1],
  lines[2],
  lines[3],
  lines[2],
  lines[3],
  lines[4],
]

export const calculateLineComplement = (lines: HexagramLines): HexagramLines => [
  oppositePolarity(lines[0]),
  oppositePolarity(lines[1]),
  oppositePolarity(lines[2]),
  oppositePolarity(lines[3]),
  oppositePolarity(lines[4]),
  oppositePolarity(lines[5]),
]

export const calculateLineReversal = (lines: HexagramLines): HexagramLines => [
  lines[5],
  lines[4],
  lines[3],
  lines[2],
  lines[1],
  lines[0],
]

export const calculateTrigramExchange = (lines: HexagramLines): HexagramLines => [
  lines[3],
  lines[4],
  lines[5],
  lines[0],
  lines[1],
  lines[2],
]

export const getChangedLineNumbers = (
  source: HexagramLines,
  target: HexagramLines,
): readonly LineNumber[] =>
  LINE_NUMBERS.filter((lineNumber) => source[lineNumber - 1] !== target[lineNumber - 1])

export const hammingDistance = (source: HexagramLines, target: HexagramLines): number =>
  getChangedLineNumbers(source, target).length

type ResultOptions = {
  operationLabels?: readonly string[]
  dataStatus?: TransformationResult['dataStatus']
  explanation?: string
  intermediateHexagramNumbers?: readonly number[]
}

export const createAvailableResult = (
  source: HexagramReference,
  definitionId: string,
  target: HexagramReference,
  changedLines = getChangedLineNumbers(source.linesBottomToTop, target.linesBottomToTop),
  options: ResultOptions = {},
): TransformationResult => {
  const definition = getTransformationDefinition(definitionId)
  return {
    id: `${definitionId}:${source.number}:${target.number}:${changedLines.join('-') || 'self'}`,
    sourceHexagramNumber: source.number,
    targetHexagramNumber: target.number,
    definitionId,
    status: target.number === source.number ? 'self-mapping' : 'available',
    changedLines,
    intermediateHexagramNumbers: options.intermediateHexagramNumbers ?? [],
    title: definition.nameEnglish,
    explanation: options.explanation ?? definition.explanation,
    operationLabels: options.operationLabels ?? [definition.nameEnglish],
    provenance: definition.provenance,
    interpretation: {
      status: 'structural-only',
      summary: 'Structural result; interpretation not yet connected.',
    },
    dataStatus: options.dataStatus ?? 'computed',
  }
}

export const createUnavailableResult = (
  source: HexagramReference,
  definitionId: string,
  status: Extract<
    TransformationResult['status'],
    'source-needed' | 'not-applicable' | 'unavailable'
  >,
  explanation?: string,
): TransformationResult => {
  const definition = getTransformationDefinition(definitionId)
  return {
    id: `${definitionId}:${source.number}:${status}`,
    sourceHexagramNumber: source.number,
    definitionId,
    status,
    changedLines: [],
    intermediateHexagramNumbers: [],
    title: definition.nameEnglish,
    explanation: explanation ?? definition.explanation,
    operationLabels: [definition.nameEnglish],
    provenance: definition.provenance,
    interpretation: {
      status: 'source-needed',
    },
    dataStatus: 'unavailable',
  }
}

export const getRelatingResult = (
  source: HexagramReference,
  changedLines: readonly LineNumber[],
): TransformationResult =>
  changedLines.length === 0
    ? createUnavailableResult(
        source,
        'line-change',
        'not-applicable',
        'Select one or more moving lines to calculate a relating hexagram.',
      )
    : createAvailableResult(
        source,
        'line-change',
        getHexagramByLines(calculateLineChange(source.linesBottomToTop, changedLines)),
        [...changedLines].sort((left, right) => left - right),
      )

export const getIntrinsicTransformationResults = (
  source: HexagramReference,
): readonly TransformationResult[] => [
  createAvailableResult(
    source,
    'nuclear',
    getHexagramByLines(calculateNuclear(source.linesBottomToTop)),
  ),
  createAvailableResult(
    source,
    'line-complement',
    getHexagramByLines(calculateLineComplement(source.linesBottomToTop)),
  ),
  createAvailableResult(
    source,
    'line-reversal',
    getHexagramByLines(calculateLineReversal(source.linesBottomToTop)),
  ),
  createAvailableResult(
    source,
    'trigram-exchange',
    getHexagramByLines(calculateTrigramExchange(source.linesBottomToTop)),
  ),
]
