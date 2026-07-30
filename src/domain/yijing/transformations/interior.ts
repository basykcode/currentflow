import { getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramLines, HexagramReference } from '@/domain/astrology/types'

import {
  calculateLineChange,
  calculateNuclear,
  createAvailableResult,
  getRelatingResult,
} from './core'
import type { LineNumber, TransformationResult } from './types'

type MutualFieldConstruction = {
  definitionId:
    | 'lower-four-line-interior'
    | 'nuclear'
    | 'upper-four-line-interior'
    | 'lower-five-line-interior'
    | 'upper-five-line-interior'
  label: string
  sourceLines: string
  calculate: (lines: HexagramLines) => HexagramLines
}

const MUTUAL_FIELD_CONSTRUCTIONS: readonly MutualFieldConstruction[] = [
  {
    definitionId: 'lower-four-line-interior',
    label: 'Lower Four-Line Interior',
    sourceLines: 'Lower [1,2,3] · upper [2,3,4]',
    calculate: (lines) => [lines[0], lines[1], lines[2], lines[1], lines[2], lines[3]],
  },
  {
    definitionId: 'nuclear',
    label: 'Central Nuclear',
    sourceLines: 'Lower [2,3,4] · upper [3,4,5]',
    calculate: calculateNuclear,
  },
  {
    definitionId: 'upper-four-line-interior',
    label: 'Upper Four-Line Interior',
    sourceLines: 'Lower [3,4,5] · upper [4,5,6]',
    calculate: (lines) => [lines[2], lines[3], lines[4], lines[3], lines[4], lines[5]],
  },
  {
    definitionId: 'lower-five-line-interior',
    label: 'Lower Five-Line Interior',
    sourceLines: 'Lower [1,2,3] · upper [3,4,5]',
    calculate: (lines) => [lines[0], lines[1], lines[2], lines[2], lines[3], lines[4]],
  },
  {
    definitionId: 'upper-five-line-interior',
    label: 'Upper Five-Line Interior',
    sourceLines: 'Lower [2,3,4] · upper [4,5,6]',
    calculate: (lines) => [lines[1], lines[2], lines[3], lines[3], lines[4], lines[5]],
  },
]

export const getMutualField = (source: HexagramReference): readonly TransformationResult[] =>
  MUTUAL_FIELD_CONSTRUCTIONS.map((construction) =>
    createAvailableResult(
      source,
      construction.definitionId,
      getHexagramByLines(construction.calculate(source.linesBottomToTop)),
      undefined,
      {
        operationLabels: [construction.label],
        explanation: `${construction.sourceLines}. This is a geometric construction; no interpretation is inferred.`,
        dataStatus: construction.definitionId === 'nuclear' ? 'computed' : 'current-derived',
      },
    ),
  )

export type DeepNuclearResult = {
  stages: readonly TransformationResult[]
  repeatedHexagramNumber?: number
  cycleStartStage?: number
  cycleLength?: number
}

export const getDeepNuclear = (source: HexagramReference, safetyLimit = 12): DeepNuclearResult => {
  const seenStageBySignature = new Map<string, number>([[source.linesBottomToTop.join(','), 0]])
  const stages: TransformationResult[] = []
  let current = source

  for (let stage = 1; stage <= safetyLimit; stage += 1) {
    const target = getHexagramByLines(calculateNuclear(current.linesBottomToTop))
    const signature = target.linesBottomToTop.join(',')
    const previousStage = seenStageBySignature.get(signature)
    stages.push(
      createAvailableResult(source, 'deep-nuclear', target, undefined, {
        operationLabels: [`N${stage}`],
        dataStatus: stage === 1 ? 'computed' : 'current-derived',
        intermediateHexagramNumbers: stages.map(
          (result) => result.targetHexagramNumber ?? source.number,
        ),
        explanation:
          stage === 1
            ? 'First application of the traditional nuclear operation.'
            : 'Current iteration of the traditional nuclear operation.',
      }),
    )

    if (previousStage !== undefined) {
      return {
        stages,
        repeatedHexagramNumber: target.number,
        cycleStartStage: previousStage,
        cycleLength: stage - previousStage,
      }
    }

    seenStageBySignature.set(signature, stage)
    current = target
  }

  return { stages }
}

export const getNuclearComparison = (
  source: HexagramReference,
  movingLines: readonly LineNumber[],
): readonly TransformationResult[] => {
  const sourceNuclear = createAvailableResult(
    source,
    'nuclear',
    getHexagramByLines(calculateNuclear(source.linesBottomToTop)),
    undefined,
    { operationLabels: ['Inner source'] },
  )
  const relating = getRelatingResult(source, movingLines)
  if (relating.targetHexagramNumber === undefined) {
    return [sourceNuclear, relating]
  }
  const resolvedRelating = getHexagramByLines(
    calculateLineChange(source.linesBottomToTop, movingLines),
  )
  const relatingNuclear = createAvailableResult(
    source,
    'nuclear',
    getHexagramByLines(calculateNuclear(resolvedRelating.linesBottomToTop)),
    undefined,
    { operationLabels: ['Inner result'] },
  )
  return [
    createAvailableResult(source, 'line-change', source, [], {
      operationLabels: ['Visible source'],
    }),
    sourceNuclear,
    { ...relating, operationLabels: ['Visible result'] },
    relatingNuclear,
  ]
}
