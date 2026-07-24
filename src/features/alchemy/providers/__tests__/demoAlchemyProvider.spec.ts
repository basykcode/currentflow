import { describe, expect, it } from 'vitest'

import type { FormulaDraft } from '../../domain/types'
import { ContractUnavailableAlchemyProvider } from '../contractUnavailableAlchemyProvider'
import { DemoAlchemyProvider } from '../demoAlchemyProvider'

const provider = new DemoAlchemyProvider(0)

const draft = (id: string, name: string, ingredientIds: readonly string[]): FormulaDraft => ({
  id,
  name,
  ingredients: ingredientIds.map((herbMaterialId, index) => ({
    id: `${id}:line:${index}`,
    herbMaterialId,
    herbDisplayName:
      {
        'demo:herb:root-a': 'Demo Root A',
        'demo:herb:seed-b': 'Demo Seed B',
        'demo:herb:leaf-c': 'Demo Leaf C',
        'demo:herb:mineral-d': 'Demo Mineral D',
      }[herbMaterialId] ?? 'Unresolved material',
    amountText: '1',
    unit: 'g',
  })),
  notes: '',
  updatedAtIso: '2026-07-23T00:00:00.000Z',
})

describe('DemoAlchemyProvider', () => {
  it('returns deterministic multilingual material records', async () => {
    const first = await provider.searchHerbs({ query: 'root' })
    const second = await provider.searchHerbs({ query: 'root' })
    const chinese = await provider.searchHerbs({ query: '演示根甲' })

    expect(first).toEqual(second)
    expect(first.items[0]?.id).toBe('demo:herb:root-a')
    expect(chinese.items[0]?.displayName).toBe('Demo Root A')
    expect(first.status).toBe('demo')
  })

  it('marks records, claims, and citations as explicitly synthetic', async () => {
    const herbs = await provider.searchHerbs({ query: '', pageSize: 100 })
    const formulas = await provider.searchFormulas({ query: '', pageSize: 100 })

    expect(herbs.items.every((item) => item.id.startsWith('demo:'))).toBe(true)
    expect(herbs.items.every((item) => item.reviewStatus === 'synthetic_fixture')).toBe(true)
    expect(formulas.items.every((item) => item.id.startsWith('demo:'))).toBe(true)

    for (const summary of herbs.items) {
      const detail = await provider.getHerb(summary.id)
      const claims = [
        ...detail.biologicalSources,
        ...detail.medicinalParts,
        ...detail.preparations,
        ...detail.thermalNatures,
        ...detail.flavors,
        ...detail.channels,
        ...detail.actions,
        ...detail.patterns,
        ...detail.cautions,
        ...detail.compounds,
      ]
      expect(claims.every((item) => item.id.startsWith('demo:'))).toBe(true)
      expect(
        claims
          .flatMap((item) => item.citations)
          .every((item) => item.reviewStatus === 'synthetic_fixture'),
      ).toBe(true)
    }
  })

  it('supports AbortSignal cancellation', async () => {
    const delayedProvider = new DemoAlchemyProvider(100)
    const controller = new AbortController()
    const request = delayedProvider.searchHerbs({ query: '' }, controller.signal)
    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('distinguishes documented fixture relationships from missing records', async () => {
    const result = await provider.analyzeFormula(
      draft('local:one', 'Pair study', [
        'demo:herb:root-a',
        'demo:herb:seed-b',
        'demo:herb:leaf-c',
      ]),
    )

    expect(result.algorithmVersion).toBe('demo-analysis-1.0')
    expect(result.interactions.some((item) => item.kind === 'documented_relationship')).toBe(true)
    expect(result.interactions.some((item) => item.kind === 'no_record_found')).toBe(true)
    expect(result.interactions.find((item) => item.kind === 'no_record_found')?.summary).toMatch(
      /does not imply compatibility/i,
    )
  })

  it('compares four formulas with pairwise overlap and no clinical score', async () => {
    const result = await provider.compareFormulas([
      draft('local:one', 'One', ['demo:herb:root-a', 'demo:herb:seed-b']),
      draft('local:two', 'Two', ['demo:herb:seed-b', 'demo:herb:leaf-c']),
      draft('local:three', 'Three', ['demo:herb:leaf-c', 'demo:herb:mineral-d']),
      draft('local:four', 'Four', ['demo:herb:root-a', 'demo:herb:mineral-d']),
    ])

    expect(result.pairwiseOverlap).toHaveLength(6)
    expect(result.formulaIds).toHaveLength(4)
    expect(result.algorithmVersion).toBe('demo-comparison-1.0')
    expect(result.warnings.join(' ')).toMatch(/does not express clinical similarity/i)
  })

  it('searches passages and builds a bounded context without an AI response', async () => {
    const passages = await provider.searchTexts({ query: 'Root A' })
    const result = await provider.buildRetrievalContext({
      passageIds: passages.items.map((item) => item.id),
      characterBudget: 2000,
    })

    expect(passages.items.length).toBeGreaterThan(0)
    expect(result.passages).toHaveLength(passages.items.length)
    expect(result.characterBudget).toBe(2000)
    expect(result).not.toHaveProperty('answer')
  })
})

describe('ContractUnavailableAlchemyProvider', () => {
  it('makes API-unavailable mode visible and never returns demo records', async () => {
    const unavailable = new ContractUnavailableAlchemyProvider()

    await expect(unavailable.getStatus()).resolves.toMatchObject({
      connection: 'not_configured',
      dataStatus: 'unavailable',
      label: 'Alchemy API not configured',
    })
    await expect(unavailable.searchHerbs()).rejects.toMatchObject({
      uiError: {
        code: 'alchemy_api_not_configured',
        retryable: false,
      },
    })
  })
})
