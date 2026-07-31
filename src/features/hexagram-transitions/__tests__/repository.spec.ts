import { describe, expect, it, vi } from 'vitest'

import { createHexagramTransitionRepository } from '../repository'

const createPayload = () => ({
  schemaVersion: '1.0.0',
  contentVersion: 'test',
  sourceHexagramNumber: 1,
  transitions: [44, 13, 10, 9, 14, 43].map((target, index) => ({
    schemaVersion: '1.0.0',
    contentVersion: 'test',
    transitionId: `forest-01-${String(target).padStart(2, '0')}`,
    sourceHexagramNumber: 1,
    targetHexagramNumber: target,
    changingLine: index + 1,
    theme: 'Grounded test theme',
    summary: 'A sufficiently detailed original transition summary for repository validation.',
    evidenceMode: 'single-source-direct',
    source: {
      sourceId: 'transition_1_jiaoshi_yilin_gait',
      title: 'The Forest of Changes',
      titleChinese: '焦氏易林',
      translator: 'Christopher Gait',
      sourceLocator: `1-${target}`,
      resolvedLocator: `1-${target}`,
      crossReferenceChain: [],
      sourcePassageSha256: 'a'.repeat(64),
    },
    rights: {
      publicationEligibility: 'draft-only',
      quotationIncluded: false,
    },
    review: {
      status: 'qa-passed',
      issues: [],
    },
  })),
})

describe('HexagramTransitionRepository', () => {
  it('loads, validates, and caches a six-line transition bundle', async () => {
    const loader = vi.fn(() => Promise.resolve(createPayload()))
    const repository = createHexagramTransitionRepository({
      '../../../content/yijing/generated/transitions/01.json': loader,
    })

    const first = await repository.getLineTransitions(1)
    const second = await repository.getLineTransitions(1)

    expect(first.status).toBe('available')
    expect(second).toBe(first)
    expect(loader).toHaveBeenCalledTimes(1)
    await expect(repository.getTransition(1, 13)).resolves.toMatchObject({
      changingLine: 2,
      theme: 'Grounded test theme',
    })
  })

  it('returns typed unavailable states for missing and malformed artifacts', async () => {
    const malformed = createPayload()
    malformed.transitions = malformed.transitions.slice(0, 5)
    const repository = createHexagramTransitionRepository({
      '../../../content/yijing/generated/transitions/01.json': () => Promise.resolve(malformed),
    })

    await expect(repository.getLineTransitions(2)).resolves.toMatchObject({
      status: 'unavailable',
      sourceHexagramNumber: 2,
    })
    await expect(repository.getLineTransitions(1)).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'The Forest transition artifact did not pass runtime validation.',
    })
    await expect(repository.getLineTransitions(65)).resolves.toMatchObject({
      status: 'unavailable',
      sourceHexagramNumber: 65,
    })
  })
})
