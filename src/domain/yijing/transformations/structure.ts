import { getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramReference, LinePolarity, Trigram } from '@/domain/astrology/types'

import { calculateNuclear } from './core'
import type { LineNumber } from './types'

export type ThreePowersLayer = 'Earth' | 'Human' | 'Heaven'

export type LineAnatomy = {
  lineNumber: LineNumber
  polarity: LinePolarity
  trigramPosition: 'lower' | 'upper'
  threePowers: ThreePowersLayer
  central: boolean
  positionConvention: 'correct' | 'not-correct'
}

export type CorrespondencePair = {
  lowerLine: LineNumber
  upperLine: LineNumber
  classification: 'responsive' | 'nonresponsive'
}

export type StructuralAnatomy = {
  lines: readonly LineAnatomy[]
  correspondence: readonly CorrespondencePair[]
  trigrams: {
    lower: Trigram
    upper: Trigram
    lowerNuclear: Trigram
    upperNuclear: Trigram
  }
  provenance: {
    tradition: 'Classical structural'
    sourceIds: readonly string[]
    availability: 'computed'
  }
}

const getThreePowers = (lineNumber: LineNumber): ThreePowersLayer => {
  if (lineNumber <= 2) return 'Earth'
  if (lineNumber <= 4) return 'Human'
  return 'Heaven'
}

const isConventionallyCorrect = (lineNumber: LineNumber, polarity: LinePolarity): boolean =>
  (lineNumber % 2 === 1 && polarity === 'yang') || (lineNumber % 2 === 0 && polarity === 'yin')

export const getStructuralAnatomy = (hexagram: HexagramReference): StructuralAnatomy => {
  const nuclear = getHexagramByLines(calculateNuclear(hexagram.linesBottomToTop))
  const lines = hexagram.linesBottomToTop.map((polarity, index) => {
    const lineNumber = (index + 1) as LineNumber
    return {
      lineNumber,
      polarity,
      trigramPosition: lineNumber <= 3 ? ('lower' as const) : ('upper' as const),
      threePowers: getThreePowers(lineNumber),
      central: lineNumber === 2 || lineNumber === 5,
      positionConvention: isConventionallyCorrect(lineNumber, polarity)
        ? ('correct' as const)
        : ('not-correct' as const),
    }
  })

  const correspondence = [
    [1, 4],
    [2, 5],
    [3, 6],
  ].map(([lowerLine, upperLine]) => {
    const lower = lowerLine as LineNumber
    const upper = upperLine as LineNumber
    return {
      lowerLine: lower,
      upperLine: upper,
      classification:
        hexagram.linesBottomToTop[lower - 1] !== hexagram.linesBottomToTop[upper - 1]
          ? ('responsive' as const)
          : ('nonresponsive' as const),
    }
  })

  return {
    lines,
    correspondence,
    trigrams: {
      lower: hexagram.lowerTrigram,
      upper: hexagram.upperTrigram,
      lowerNuclear: nuclear.lowerTrigram,
      upperNuclear: nuclear.upperTrigram,
    },
    provenance: {
      tradition: 'Classical structural',
      sourceIds: ['docs:YIJING_TRANSFORMATIONS'],
      availability: 'computed',
    },
  }
}

export const DISPLAY_LINE_ORDER: readonly LineNumber[] = [6, 5, 4, 3, 2, 1]
