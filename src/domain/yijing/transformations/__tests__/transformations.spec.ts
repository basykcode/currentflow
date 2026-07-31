import { describe, expect, it } from 'vitest'

import { getHexagram, getHexagramByLines, getHexagrams } from '@/domain/astrology/hexagrams'
import {
  calculateLineChange,
  calculateLineComplement,
  calculateLineReversal,
  calculateNuclear,
  calculateTrigramExchange,
  createTransformationEngine,
  DISPLAY_LINE_ORDER,
  enumerateLineChangeDestinations,
  getDeepNuclear,
  getChangedLineNumbers,
  getKingWenContext,
  getMutualField,
  getStructuralAnatomy,
  getSymmetryFamily,
  getTransformationPathCount,
  getTransformationPaths,
  getRelatingResult,
  hammingDistance,
  lineNumbersFromMask,
  maskFromLineNumbers,
  SOURCE_GATED_MODULES,
  validateCompleteHexagramSourceTable,
} from '@/domain/yijing/transformations'

describe('canonical transformation registry boundary', () => {
  it('round-trips all 64 unique six-line signatures through the canonical registry', () => {
    const hexagrams = getHexagrams()
    expect(hexagrams).toHaveLength(64)
    expect(new Set(hexagrams.map((hexagram) => hexagram.number)).size).toBe(64)
    expect(new Set(hexagrams.map((hexagram) => hexagram.linesBottomToTop.join(','))).size).toBe(64)

    for (const hexagram of hexagrams) {
      expect(getHexagramByLines(hexagram.linesBottomToTop)).toBe(hexagram)
    }
  })

  it('uses the required Hexagram 1, 2, and 5 exact vectors', () => {
    const one = getHexagram(1)
    const two = getHexagram(2)
    const five = getHexagram(5)

    expect(one.linesBottomToTop).toEqual(['yang', 'yang', 'yang', 'yang', 'yang', 'yang'])
    expect(two.linesBottomToTop).toEqual(['yin', 'yin', 'yin', 'yin', 'yin', 'yin'])
    expect(five.linesBottomToTop).toEqual(['yang', 'yang', 'yang', 'yin', 'yang', 'yin'])

    expect(getHexagramByLines(calculateLineComplement(one.linesBottomToTop)).number).toBe(2)
    expect(getHexagramByLines(calculateLineReversal(one.linesBottomToTop)).number).toBe(1)
    expect(getHexagramByLines(calculateNuclear(one.linesBottomToTop)).number).toBe(1)
    expect(getHexagramByLines(calculateTrigramExchange(one.linesBottomToTop)).number).toBe(1)

    expect(getHexagramByLines(calculateLineComplement(two.linesBottomToTop)).number).toBe(1)
    expect(getHexagramByLines(calculateLineReversal(two.linesBottomToTop)).number).toBe(2)
    expect(getHexagramByLines(calculateNuclear(two.linesBottomToTop)).number).toBe(2)
    expect(getHexagramByLines(calculateTrigramExchange(two.linesBottomToTop)).number).toBe(2)

    expect(getHexagramByLines(calculateLineReversal(five.linesBottomToTop)).number).toBe(6)
    expect(getHexagramByLines(calculateLineComplement(five.linesBottomToTop)).number).toBe(35)
    expect(getHexagramByLines(calculateNuclear(five.linesBottomToTop)).number).toBe(38)
    expect(getHexagramByLines(calculateTrigramExchange(five.linesBottomToTop)).number).toBe(6)
  })
})

describe('core and symmetry operations', () => {
  it('keeps complement, reversal, and trigram exchange involutive for every figure', () => {
    for (const hexagram of getHexagrams()) {
      expect(calculateLineComplement(calculateLineComplement(hexagram.linesBottomToTop))).toEqual(
        hexagram.linesBottomToTop,
      )
      expect(calculateLineReversal(calculateLineReversal(hexagram.linesBottomToTop))).toEqual(
        hexagram.linesBottomToTop,
      )
      expect(calculateTrigramExchange(calculateTrigramExchange(hexagram.linesBottomToTop))).toEqual(
        hexagram.linesBottomToTop,
      )
      expect(calculateNuclear(hexagram.linesBottomToTop)).toHaveLength(6)
    }
  })

  it('changes exactly the selected lines and restores a line when changed twice', () => {
    const source = getHexagram(5)
    for (const line of [1, 2, 3, 4, 5, 6] as const) {
      const once = calculateLineChange(source.linesBottomToTop, [line])
      const twice = calculateLineChange(once, [line])
      expect(hammingDistance(source.linesBottomToTop, once)).toBe(1)
      expect(twice).toEqual(source.linesBottomToTop)
      expect(getHexagramByLines(once).number).not.toBe(source.number)
    }
  })

  it('does not invent a relating target without moving lines', () => {
    const result = getRelatingResult(getHexagram(5), [])
    expect(result.status).toBe('not-applicable')
    expect(result.targetHexagramNumber).toBeUndefined()
  })

  it('deduplicates symmetry targets while preserving convergent operation labels', () => {
    for (const source of getHexagrams()) {
      const orbit = getSymmetryFamily(source)
      expect(orbit.length).toBeGreaterThanOrEqual(1)
      expect(orbit.length).toBeLessThanOrEqual(8)
      expect(new Set(orbit.map((result) => result.targetHexagramNumber)).size).toBe(orbit.length)
      expect(orbit.every((result) => result.operationLabels.length > 0)).toBe(true)
      expect(
        orbit.some(
          (result) =>
            result.targetHexagramNumber === source.number && result.status === 'self-mapping',
        ),
      ).toBe(true)
    }
  })
})

describe('interior structures', () => {
  it('matches the complete Hexagram 5 Mutual Field without mutating the source', () => {
    const source = getHexagram(5)
    const original = [...source.linesBottomToTop]
    expect(getMutualField(source).map((result) => result.targetHexagramNumber)).toEqual([
      43, 38, 63, 14, 60,
    ])
    expect(source.linesBottomToTop).toEqual(original)
  })

  it('detects the Hexagram 5 deep-nuclear 63 ↔ 64 cycle', () => {
    const result = getDeepNuclear(getHexagram(5))
    expect(result.stages.map((stage) => stage.targetHexagramNumber)).toEqual([38, 63, 64, 63])
    expect(result.repeatedHexagramNumber).toBe(63)
    expect(result.cycleLength).toBe(2)
  })
})

describe('complete Change Lab destination universe', () => {
  it('enumerates every nonidentical destination once with binomial group counts', () => {
    const source = getHexagram(5)
    const destinations = enumerateLineChangeDestinations(source)
    expect(destinations).toHaveLength(63)
    expect(new Set(destinations.map((destination) => destination.target.number)).size).toBe(63)
    expect(
      [1, 2, 3, 4, 5, 6].map(
        (count) =>
          destinations.filter((destination) => destination.changedLineCount === count).length,
      ),
    ).toEqual([6, 15, 20, 15, 6, 1])

    for (const destination of destinations) {
      expect(hammingDistance(source.linesBottomToTop, destination.target.linesBottomToTop)).toBe(
        destination.changedLineCount,
      )
      expect(maskFromLineNumbers(lineNumbersFromMask(destination.mask))).toBe(destination.mask)
      expect(
        getChangedLineNumbers(source.linesBottomToTop, destination.target.linesBottomToTop),
      ).toEqual(destination.result.changedLines)
    }
    expect(destinations.find((destination) => destination.mask === 63)?.target.number).toBe(35)
  })

  it('memoizes destinations inside an engine instance without a mutable singleton', () => {
    const engine = createTransformationEngine()
    const source = getHexagram(5)
    expect(engine.getDestinations(source)).toBe(engine.getDestinations(source))
    expect(createTransformationEngine().getDestinations(source)).not.toBe(
      engine.getDestinations(source),
    )
  })
})

describe('lazy minimal transformation paths', () => {
  it('reports N! paths and preserves every valid intermediate', () => {
    const source = getHexagram(5)
    const target = getHexagram(35)
    expect(getTransformationPathCount(source, target)).toBe(720)

    const page = getTransformationPaths(source, target, { offset: 12, limit: 12 })
    expect(page.total).toBe(720)
    expect(page.paths).toHaveLength(12)
    expect(page.paths[0]?.index).toBe(12)

    for (const path of page.paths) {
      expect(new Set(path.changedLineOrder).size).toBe(6)
      expect(path.steps).toHaveLength(6)
      expect(path.steps.at(-1)?.targetHexagramNumber).toBe(target.number)
      for (const step of path.steps) {
        expect(getHexagram(step.targetHexagramNumber).number).toBe(step.targetHexagramNumber)
      }
    }

    expect(getTransformationPaths(source, target, { offset: 12, limit: 12 })).toEqual(page)
  })
})

describe('textual relations, structure, and source gates', () => {
  it('keeps King Wen pairs distinct, does not wrap neighbors, and source-gates Zagua', () => {
    const five = getKingWenContext(getHexagram(5))
    expect(five.map((result) => result.targetHexagramNumber)).toEqual([6, 4, 6, undefined])
    expect(five[3]?.status).toBe('source-needed')
    expect(
      getKingWenContext(getHexagram(1)).find(
        (result) => result.definitionId === 'king-wen-previous',
      )?.status,
    ).toBe('not-applicable')
    expect(
      getKingWenContext(getHexagram(64)).find((result) => result.definitionId === 'king-wen-next')
        ?.status,
    ).toBe('not-applicable')
  })

  it('detects missing and duplicate source-table records', () => {
    const valid = Array.from({ length: 64 }, (_, index) => ({
      sourceHexagramNumber: index + 1,
    }))
    expect(validateCompleteHexagramSourceTable(valid)).toEqual({
      valid: true,
      errors: [],
    })
    const invalid = [...valid.slice(1), { sourceHexagramNumber: 2 }]
    const validation = validateCompleteHexagramSourceTable(invalid)
    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain('Missing source record for Hexagram 1.')
    expect(validation.errors).toContain('Duplicate source records for Hexagram 2.')
    expect(
      validateCompleteHexagramSourceTable([...valid, { sourceHexagramNumber: 65 }]).errors,
    ).toContain('Out-of-range source hexagram: 65.')
  })

  it('classifies centrality, correspondence, Three Powers, and display order', () => {
    const anatomy = getStructuralAnatomy(getHexagram(5))
    expect(anatomy.lines.filter((line) => line.central).map((line) => line.lineNumber)).toEqual([
      2, 5,
    ])
    expect(anatomy.lines.slice(0, 2).every((line) => line.threePowers === 'Earth')).toBe(true)
    expect(anatomy.lines.slice(2, 4).every((line) => line.threePowers === 'Human')).toBe(true)
    expect(anatomy.lines.slice(4, 6).every((line) => line.threePowers === 'Heaven')).toBe(true)
    expect(anatomy.correspondence.map((pair) => [pair.lowerLine, pair.upperLine])).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ])
    expect(anatomy.trigrams.lowerNuclear.nameEnglish).toBe('Lake')
    expect(anatomy.trigrams.upperNuclear.nameEnglish).toBe('Fire')
    expect(DISPLAY_LINE_ORDER).toEqual([6, 5, 4, 3, 2, 1])
  })

  it('never fabricates source-gated lineage results', () => {
    expect(SOURCE_GATED_MODULES.length).toBeGreaterThan(0)
    expect(SOURCE_GATED_MODULES.every((module) => module.status === 'source-needed')).toBe(true)
    expect(SOURCE_GATED_MODULES.every((module) => module.sourceRequirement.length > 0)).toBe(true)
  })
})
