import { getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramLines, HexagramReference } from '@/domain/astrology/types'

import {
  calculateLineComplement,
  calculateLineReversal,
  calculateTrigramExchange,
  createAvailableResult,
} from './core'
import type { TransformationResult } from './types'

type SymmetryOperation = {
  id: string
  label: string
  apply: (lines: HexagramLines) => HexagramLines
  simpleDefinitionId?: 'line-complement' | 'line-reversal' | 'trigram-exchange'
}

const identity = (lines: HexagramLines): HexagramLines => [...lines]
const compose =
  (
    ...operations: readonly ((lines: HexagramLines) => HexagramLines)[]
  ): ((lines: HexagramLines) => HexagramLines) =>
  (lines) =>
    operations.reduce((current, operation) => operation(current), lines)

const SYMMETRY_OPERATIONS: readonly SymmetryOperation[] = [
  { id: 'identity', label: 'Original', apply: identity },
  {
    id: 'line-complement',
    label: 'Opposite',
    apply: calculateLineComplement,
    simpleDefinitionId: 'line-complement',
  },
  {
    id: 'line-reversal',
    label: 'Reversed',
    apply: calculateLineReversal,
    simpleDefinitionId: 'line-reversal',
  },
  {
    id: 'trigram-exchange',
    label: 'Exchanged',
    apply: calculateTrigramExchange,
    simpleDefinitionId: 'trigram-exchange',
  },
  {
    id: 'complement-reversal',
    label: 'Opposite–Reversed',
    apply: compose(calculateLineComplement, calculateLineReversal),
  },
  {
    id: 'complement-exchange',
    label: 'Opposite–Exchanged',
    apply: compose(calculateLineComplement, calculateTrigramExchange),
  },
  {
    id: 'reversal-exchange',
    label: 'Trigram-Mirrored',
    apply: compose(calculateLineReversal, calculateTrigramExchange),
  },
  {
    id: 'complement-reversal-exchange',
    label: 'Opposite Trigram-Mirrored',
    apply: compose(calculateLineComplement, calculateLineReversal, calculateTrigramExchange),
  },
]

export const getSymmetryFamily = (source: HexagramReference): readonly TransformationResult[] => {
  const grouped = new Map<number, { target: HexagramReference; operations: SymmetryOperation[] }>()

  for (const operation of SYMMETRY_OPERATIONS) {
    const target = getHexagramByLines(operation.apply(source.linesBottomToTop))
    const existing = grouped.get(target.number)
    if (existing) {
      existing.operations.push(operation)
    } else {
      grouped.set(target.number, { target, operations: [operation] })
    }
  }

  return [...grouped.values()].map(({ target, operations }) => {
    const onlyOperation = operations.length === 1 ? operations[0] : undefined
    const definitionId = onlyOperation?.simpleDefinitionId ?? 'symmetry-family'
    return createAvailableResult(source, definitionId, target, undefined, {
      operationLabels: operations.map((operation) => operation.label),
      dataStatus: definitionId === 'symmetry-family' ? 'current-derived' : 'computed',
      ...(definitionId === 'symmetry-family'
        ? {
            explanation:
              'Current structural composition. Labels retain every operation that converges on this figure.',
          }
        : {}),
    })
  })
}
