import { describe, expect, it, vi } from 'vitest'

import { createHexagramCommentaryRepository } from '../repository'

describe('HexagramCommentaryRepository', () => {
  it('loads, validates, and caches the static Hexagram 5 content', async () => {
    const validPayload = {
      schemaVersion: '1.0.0',
      contentVersion: 'test',
      hexagramNumber: 5,
      summaries: [
        'daoist',
        'buddhist',
        'confucian',
        'psychological',
        'human-design',
        'gene-keys',
      ].map((schoolId) => ({
        schemaVersion: '1.0.0',
        contentVersion: 'test',
        hexagramNumber: 5,
        schoolId,
        essence: schoolId === 'buddhist' ? '' : 'A sufficiently long test essence for validation.',
        summary: schoolId === 'buddhist' ? '' : 'A supported test summary.',
        evidenceMode: schoolId === 'buddhist' ? 'insufficient' : 'single-source-direct',
        sourcesUsed: [],
        sentenceSupport: [],
        coverage: {
          registeredSourceCount: 1,
          contributingSourceCount: schoolId === 'buddhist' ? 0 : 1,
          directSourceCount: schoolId === 'buddhist' ? 0 : 1,
          chunkCount: schoolId === 'buddhist' ? 0 : 1,
        },
        rights: {
          publicationEligibility: schoolId === 'buddhist' ? 'blocked' : 'draft-only',
          quotationIncluded: false,
        },
        review: {
          status: schoolId === 'buddhist' ? 'blocked' : 'qa-passed',
          issues: [],
        },
        generation: {
          generatorKind: 'codex-assisted',
          promptVersion: 'test',
          generatedAtIso: '2026-07-30T00:00:00Z',
          sourceDigest: 'digest',
        },
      })),
    }
    const loader = vi.fn(() => Promise.resolve(validPayload))
    const repository = createHexagramCommentaryRepository({
      '../../../content/yijing/generated/hexagrams/05.json': loader,
    })

    const first = await repository.getHexagramCommentaries(5)
    const second = await repository.getHexagramCommentaries(5)

    expect(first.status).toBe('available')
    expect(second).toBe(first)
    expect(loader).toHaveBeenCalledTimes(1)
    expect((await repository.getSchoolSummary(5, 'buddhist'))?.evidenceMode).toBe(
      'insufficient',
    )
  })

  it('returns typed unavailable states for missing and malformed content', async () => {
    const repository = createHexagramCommentaryRepository({
      '../../../content/yijing/generated/hexagrams/05.json': () =>
        Promise.resolve({
          hexagramNumber: 5,
          summaries: [],
        }),
    })

    await expect(repository.getHexagramCommentaries(4)).resolves.toMatchObject({
      status: 'unavailable',
      hexagramNumber: 4,
    })
    await expect(repository.getHexagramCommentaries(5)).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'The commentary artifact did not pass runtime validation.',
    })
    await expect(repository.getHexagramCommentaries(0)).resolves.toMatchObject({
      status: 'unavailable',
      hexagramNumber: 0,
    })
  })
})
