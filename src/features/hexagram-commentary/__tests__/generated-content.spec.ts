import { describe, expect, it } from 'vitest'

import { SCHOOL_IDS } from '../repository'
import type { SchoolHexagramSummary } from '../types'

type GeneratedPayload = {
  hexagramNumber: number
  summaries: SchoolHexagramSummary[]
}

const modules = import.meta.glob<
  true,
  string,
  { default: GeneratedPayload }
>('../../../../content/yijing/generated/hexagrams/*.json', {
  eager: true,
})

describe('generated hexagram commentary', () => {
  it('publishes one six-school bundle for every King Wen hexagram', () => {
    expect(Object.keys(modules)).toHaveLength(64)

    for (const [modulePath, module] of Object.entries(modules)) {
      const payload = module.default
      expect(payload.hexagramNumber, modulePath).toBeGreaterThanOrEqual(1)
      expect(payload.hexagramNumber, modulePath).toBeLessThanOrEqual(64)
      expect(
        payload.summaries.map((summary) => summary.schoolId),
        modulePath,
      ).toEqual(SCHOOL_IDS)
    }
  })

  it('keeps public artifacts quotation-free and sentence-supported', () => {
    const summaries = Object.values(modules).flatMap(
      (module) => module.default.summaries,
    )
    const unavailable = summaries.filter(
      (summary) => summary.evidenceMode === 'insufficient',
    )
    const available = summaries.filter(
      (summary) => summary.evidenceMode !== 'insufficient',
    )

    expect(summaries).toHaveLength(384)
    expect(available).toHaveLength(379)
    expect(unavailable).toHaveLength(5)
    expect(
      available.every(
        (summary) =>
          summary.review.status === 'qa-passed' &&
          summary.rights.quotationIncluded === false &&
          summary.sentenceSupport.length >= 4 &&
          summary.sentenceSupport.every(
            (support) => support.supportingChunkIds.length > 0,
          ),
      ),
    ).toBe(true)
    expect(
      unavailable.every(
        (summary) =>
          summary.review.status === 'blocked' &&
          summary.essence === '' &&
          summary.summary === '',
      ),
    ).toBe(true)
    expect(JSON.stringify(modules)).not.toContain('"originalText"')
    expect(JSON.stringify(modules)).not.toContain('"normalizedText"')
  })
})
