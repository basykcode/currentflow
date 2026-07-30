import { getHexagram } from '@/domain/astrology/hexagrams'
import type { HexagramReference } from '@/domain/astrology/types'

import { createAvailableResult, createUnavailableResult } from './core'
import type { TransformationResult } from './types'

export type ZaguaContrastRecord = {
  sourceHexagramNumber: number
  targetHexagramNumber: number
  contrastSummary: string
  sourceId: string
}

export type SourceTableValidation = {
  valid: boolean
  errors: readonly string[]
}

export const validateCompleteHexagramSourceTable = (
  records: readonly { sourceHexagramNumber: number }[],
): SourceTableValidation => {
  const errors: string[] = []
  const counts = new Map<number, number>()
  for (const record of records) {
    counts.set(record.sourceHexagramNumber, (counts.get(record.sourceHexagramNumber) ?? 0) + 1)
  }
  for (let number = 1; number <= 64; number += 1) {
    const count = counts.get(number) ?? 0
    if (count === 0) errors.push(`Missing source record for Hexagram ${number}.`)
    if (count > 1) errors.push(`Duplicate source records for Hexagram ${number}.`)
  }
  for (const number of counts.keys()) {
    if (number < 1 || number > 64) errors.push(`Out-of-range source hexagram: ${number}.`)
  }
  return { valid: errors.length === 0, errors }
}

export const getKingWenContext = (
  source: HexagramReference,
  zaguaRecords?: readonly ZaguaContrastRecord[],
): readonly TransformationResult[] => {
  const pairNumber = source.number % 2 === 0 ? source.number - 1 : source.number + 1
  const previous =
    source.number > 1
      ? createAvailableResult(source, 'king-wen-previous', getHexagram(source.number - 1), [], {
          dataStatus: 'source-derived',
        })
      : createUnavailableResult(
          source,
          'king-wen-previous',
          'not-applicable',
          'Hexagram 1 has no previous King Wen sequence neighbor.',
        )
  const next =
    source.number < 64
      ? createAvailableResult(source, 'king-wen-next', getHexagram(source.number + 1), [], {
          dataStatus: 'source-derived',
        })
      : createUnavailableResult(
          source,
          'king-wen-next',
          'not-applicable',
          'Hexagram 64 has no next King Wen sequence neighbor.',
        )
  const zagua = zaguaRecords?.find((record) => record.sourceHexagramNumber === source.number)
  const zaguaResult = zagua
    ? {
        ...createAvailableResult(
          source,
          'zagua-contrast',
          getHexagram(zagua.targetHexagramNumber),
          [],
          {
            dataStatus: 'source-derived',
            explanation: zagua.contrastSummary,
          },
        ),
        provenance: {
          tradition: 'Textual relation',
          canonicality: 'historically-attested' as const,
          sourceIds: [zagua.sourceId],
        },
        interpretation: {
          status: 'available' as const,
          summary: zagua.contrastSummary,
        },
      }
    : createUnavailableResult(
        source,
        'zagua-contrast',
        'source-needed',
        'Source table not yet connected. No geometric partner is inferred.',
      )

  return [
    createAvailableResult(source, 'king-wen-pair', getHexagram(pairNumber), [], {
      dataStatus: 'source-derived',
    }),
    previous,
    next,
    zaguaResult,
  ]
}
