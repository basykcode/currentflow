import { describe, expect, it } from 'vitest'

import type { HexagramTransitionSummary } from '../types'

type GeneratedPayload = {
  sourceHexagramNumber: number
  transitions: HexagramTransitionSummary[]
}

const modules = import.meta.glob<true, string, { default: GeneratedPayload }>(
  '../../../../content/yijing/generated/transitions/*.json',
  {
    eager: true,
  },
)

describe('generated Forest transition commentary', () => {
  it('publishes one six-line bundle for every King Wen hexagram', () => {
    expect(Object.keys(modules)).toHaveLength(64)

    for (const [modulePath, module] of Object.entries(modules)) {
      const payload = module.default
      expect(payload.sourceHexagramNumber, modulePath).toBeGreaterThanOrEqual(1)
      expect(payload.sourceHexagramNumber, modulePath).toBeLessThanOrEqual(64)
      expect(payload.transitions, modulePath).toHaveLength(6)
      expect(
        payload.transitions.map((transition) => transition.changingLine),
        modulePath,
      ).toEqual([1, 2, 3, 4, 5, 6])
    }
  })

  it('keeps all 384 public records draft-only, quotation-free, and provenance-linked', () => {
    const transitions = Object.values(modules).flatMap((module) => module.default.transitions)

    expect(transitions).toHaveLength(384)
    expect(
      transitions.every(
        (transition) =>
          transition.review.status === 'qa-passed' &&
          transition.rights.publicationEligibility === 'draft-only' &&
          transition.rights.quotationIncluded === false &&
          transition.source.sourcePassageSha256.length === 64,
      ),
    ).toBe(true)
    expect(
      transitions.filter((transition) => transition.source.crossReferenceChain.length > 0),
    ).toHaveLength(4)
    expect(JSON.stringify(modules)).not.toContain('"verseParagraphs"')
    expect(JSON.stringify(modules)).not.toContain('"footnotes"')
  })
})
