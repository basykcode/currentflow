// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { AlchemyProviderError } from '../../domain/errors'
import type { FormulaDraft } from '../../domain/types'
import { HttpAlchemyProvider } from '../httpAlchemyProvider'

const knowledgeMeta = {
  requestId: 'request-1',
  dataStatus: 'demo',
  sources: [],
  warnings: [],
  generatedAt: '2026-07-24T00:00:00Z',
  schemaVersion: 'alchemy-graph-v1',
}

const source = {
  id: 'demo:source',
  title: 'Synthetic source',
  rightsStatus: 'approved',
  reviewStatus: 'synthetic_fixture',
  citation: 'Synthetic fixture.',
}

const citation = {
  sourceId: source.id,
  sourceTitle: source.title,
  locator: 'fixture:1',
  citationText: source.citation,
  reviewStatus: 'synthetic_fixture',
}

const herb = {
  id: 'demo:herb:root',
  entityType: 'HerbMaterial',
  displayName: 'Demo Root',
  names: [
    {
      text: 'Demo Root',
      normalized: 'demo root',
      language: 'en',
      script: 'Latn',
      kind: 'preferred',
      sourceId: source.id,
      reviewStatus: 'synthetic_fixture',
    },
    {
      text: 'Yǎnshì Gēn',
      normalized: 'yǎnshì gēn',
      language: 'zh-Latn-pinyin',
      script: 'Latn',
      kind: 'hanyu_pinyin_tone_marks',
      sourceId: source.id,
      reviewStatus: 'synthetic_fixture',
    },
    {
      text: '演示根',
      normalized: '演示根',
      language: 'zh-Hant',
      script: 'Hant',
      kind: 'source_preferred',
      sourceId: source.id,
      reviewStatus: 'synthetic_fixture',
    },
  ],
  reviewStatuses: ['synthetic_fixture'],
  sourceIds: [source.id],
  dataStatus: 'demo',
  ambiguity: [],
  properties: {
    thermalNatures: ['neutral'],
    flavors: ['sweet'],
    categories: ['demo-category'],
  },
}

const herbDetail = {
  ...herb,
  completeness: 0.8,
  unresolvedConflicts: [],
  claims: [
    {
      id: 'demo:claim:nature',
      predicate: 'HAS_NATURE',
      subjectId: herb.id,
      textualValue: 'neutral',
      language: 'en',
      evidenceType: 'synthetic_fixture',
      reviewStatus: 'synthetic_fixture',
      source,
      importRunId: 'demo:run',
      createdAt: '2026-07-24T00:00:00Z',
      sourceLocator: 'fixture:1',
    },
  ],
}

const formula = {
  id: 'demo:formula:one',
  entityType: 'Formula',
  displayName: 'Demo Formula',
  names: [],
  reviewStatuses: ['synthetic_fixture'],
  sourceIds: [source.id],
  dataStatus: 'demo',
  ambiguity: [],
  properties: {
    ingredientIds: [herb.id],
    ingredientAmountTexts: ['1'],
    ingredientUnits: ['g'],
    ingredientSourceTerms: ['Demo Root source term'],
    category: 'demo-category',
  },
}

const formulaDetail = {
  ...formula,
  completeness: 0.7,
  unresolvedConflicts: [],
  claims: [
    {
      id: 'demo:claim:formula',
      predicate: 'CONTAINS',
      subjectId: formula.id,
      textualValue: 'Contains Demo Root.',
      language: 'en',
      evidenceType: 'synthetic_fixture',
      reviewStatus: 'synthetic_fixture',
      source,
      importRunId: 'demo:run',
      createdAt: '2026-07-24T00:00:00Z',
    },
  ],
}

const passage = {
  id: 'demo:passage:1',
  documentId: 'demo:document:1',
  originalText: 'Synthetic passage.',
  normalizedText: 'synthetic passage',
  language: 'en',
  sourceLocator: 'fixture:passage:1',
  checksum: 'demo-checksum',
  reviewStatus: 'synthetic_fixture',
  citation,
  mentionedEntityIds: [herb.id],
}

const page = (items: readonly unknown[]) => ({
  data: {
    items,
    pagination: { offset: 0, limit: 25, total: items.length, hasMore: false },
  },
  meta: knowledgeMeta,
})

const envelope = (data: unknown) => ({ data, meta: knowledgeMeta })

const draft: FormulaDraft = {
  id: 'draft-1',
  name: 'Draft one',
  ingredients: [
    {
      id: 'line-1',
      herbMaterialId: herb.id,
      herbDisplayName: herb.displayName,
      amountText: '1',
      unit: 'g',
    },
  ],
  notes: '',
  updatedAtIso: '2026-07-24T00:00:00Z',
}

const analysis = {
  algorithmVersion: 'analysis-v1',
  dataVersion: 'data-v1',
  originalInput: {
    id: draft.id,
    name: draft.name,
    ingredients: [{ herbMaterialId: herb.id, amount: '1', unit: 'g' }],
  },
  normalizedIngredients: [
    {
      inputIndex: 0,
      herbMaterialId: herb.id,
      displayName: herb.displayName,
      baseMaterialId: herb.id,
      preparationId: null,
      originalAmount: '1',
      originalUnit: 'g',
      grams: '1',
      role: null,
      sourceText: null,
      note: null,
    },
  ],
  exactDuplicateIngredientIds: [],
  preparationDistinctions: {},
  supportedUnitTotalsGrams: '1',
  unsupportedOrUnresolvedUnits: [],
  distributions: {
    thermalNatures: [{ value: 'neutral', count: 1, proportion: 1 }],
    flavors: [{ value: 'sweet', count: 1, proportion: 1 }],
    channels: [],
    categories: [{ value: 'demo-category', count: 1, proportion: 1 }],
  },
  documentedActions: [],
  documentedPatterns: [],
  explicitRoles: {},
  pairSignals: [],
  conflicts: [],
  missingData: {},
  sourceCoveragePercentage: 100,
  reviewStatusBreakdown: { synthetic_fixture: 1 },
  warnings: [],
}

const comparison = {
  algorithmVersion: 'comparison-v1',
  dataVersion: 'data-v1',
  analyses: [
    analysis,
    {
      ...analysis,
      originalInput: { ...analysis.originalInput, id: 'draft-2', name: 'Draft two' },
    },
  ],
  pairwise: [
    {
      leftKey: 'draft-1',
      rightKey: 'draft-2',
      jaccardSimilarity: 1,
      sharedIngredientIds: [herb.id],
      leftUniqueIngredientIds: [],
      rightUniqueIngredientIds: [],
      sameMaterialDifferentPreparations: {},
    },
  ],
  repeatedIngredientIds: [herb.id],
  combinedDistributions: {},
  sharedActions: [],
  distinctActions: {},
  sharedPatterns: [],
  distinctPatterns: {},
  crossFormulaPairSignals: [],
  sourceConflicts: [],
  warnings: [],
  completenessSummary: { 'draft-1': 1, 'draft-2': 1 },
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': 'request-1' },
  })

const apiFetch = vi.fn((input: Request) => {
  const url = new URL(input.url)
  const path = decodeURIComponent(url.pathname)
  if (path === '/api/v1/health/ready') {
    return Promise.resolve(
      json({ status: 'ready', dependencies: [{ name: 'neo4j', status: 'ready' }] }),
    )
  }
  if (path === '/api/v1/meta') {
    return Promise.resolve(
      json({
        serviceName: 'current-alchemy-api',
        apiVersion: '1',
        applicationVersion: '0.1',
        graphSchemaVersion: '1',
        formulaAnalysisAlgorithmVersion: 'analysis-v1',
        activeDataSourceCount: 1,
        safetyBoundarySummary: 'Research only.',
        featureFlags: {
          enabled: [
            'graph-retrieval',
            'formula-analysis',
            'formula-comparison',
            'text-search',
            'constrained-exploration',
          ],
          disabled: ['external-ai'],
        },
      }),
    )
  }
  if (path === '/api/v1/sources') return Promise.resolve(json(page([source])))
  if (path === '/api/v1/documents') {
    return Promise.resolve(
      json(
        page([
          {
            id: passage.documentId,
            sourceId: source.id,
            title: 'Synthetic document',
            language: 'en',
            version: '1',
            checksum: 'demo',
            reviewStatus: 'synthetic_fixture',
            citation,
          },
        ]),
      ),
    )
  }
  if (path === `/api/v1/documents/${passage.documentId}`) {
    return Promise.resolve(
      json(
        envelope({
          id: passage.documentId,
          sourceId: source.id,
          title: 'Synthetic document',
          language: 'en',
          version: '1',
          checksum: 'demo',
          reviewStatus: 'synthetic_fixture',
          citation,
        }),
      ),
    )
  }
  if (path === '/api/v1/herbs') return Promise.resolve(json(page([herb])))
  if (path === `/api/v1/herbs/${herb.id}`) return Promise.resolve(json(envelope(herbDetail)))
  if (path === '/api/v1/formulas') return Promise.resolve(json(page([formula])))
  if (path === `/api/v1/formulas/${formula.id}`) {
    return Promise.resolve(json(envelope(formulaDetail)))
  }
  if (path === '/api/v1/formulas/analyze') return Promise.resolve(json(envelope(analysis)))
  if (path === '/api/v1/formulas/compare') return Promise.resolve(json(envelope(comparison)))
  if (path === '/api/v1/text/search') {
    return Promise.resolve(json(page([{ passage, score: 1, matchedTerms: ['synthetic'] }])))
  }
  if (path === `/api/v1/graph/entities/${herb.id}/neighborhood`) {
    return Promise.resolve(
      json(
        envelope({
          rows: [],
          nodes: [
            {
              id: herb.id,
              entityType: 'HerbMaterial',
              displayName: herb.displayName,
              properties: {},
            },
            {
              id: formula.id,
              entityType: 'Formula',
              displayName: formula.displayName,
              properties: {},
            },
          ],
          edges: [
            {
              id: 'demo:edge',
              sourceId: formula.id,
              targetId: herb.id,
              relationshipType: 'CONTAINS',
              properties: {},
            },
          ],
        }),
      ),
    )
  }
  if (path === '/api/v1/retrieval/context') {
    return Promise.resolve(
      json(
        envelope({
          query: 'Selected passages',
          passages: [passage],
          citations: [citation],
          matchedEntities: [herb],
          graphNeighborhoodFacts: [
            {
              subjectId: herb.id,
              predicate: 'HAS_NATURE',
              textualValue: 'neutral',
              citation,
            },
          ],
          unresolvedAmbiguities: [],
          sourceStatuses: { [source.id]: 'approved' },
          reviewStatuses: { [source.id]: 'synthetic_fixture' },
          usedCharacters: passage.originalText.length,
          characterBudget: 6000,
        }),
      ),
    )
  }
  return Promise.resolve(
    json(
      {
        type: 'https://current-flow.net/problems/not-found',
        title: 'Not found',
        status: 404,
        code: 'not_found',
        detail: `No mock route for ${path}.`,
        requestId: 'request-1',
        errors: [],
      },
      404,
    ),
  )
})

describe('HttpAlchemyProvider', () => {
  it('maps every provider operation from the checked-in transport contract', async () => {
    const provider = new HttpAlchemyProvider({
      baseUrl: 'http://alchemy.test',
      fetch: apiFetch,
      timeoutMs: 1000,
    })

    await expect(provider.getStatus()).resolves.toMatchObject({
      connection: 'connected',
      dataStatus: 'source_reported',
    })
    await expect(provider.getCapabilities()).resolves.toMatchObject({
      canSearchHerbs: true,
      canAnalyzeFormulas: true,
      maxComparisonFormulas: 4,
    })
    await expect(provider.searchHerbs({ query: '' })).resolves.toMatchObject({
      total: 1,
      items: [{ id: herb.id, categoryLabels: ['demo-category'] }],
    })
    await expect(provider.getHerb(herb.id)).resolves.toMatchObject({
      id: herb.id,
      thermalNatures: [{ value: 'neutral' }],
    })
    await expect(provider.searchFormulas({ query: '' })).resolves.toMatchObject({
      items: [{ id: formula.id, ingredientCount: 1 }],
    })
    await expect(provider.getFormula(formula.id)).resolves.toMatchObject({
      id: formula.id,
      ingredients: [
        {
          herbDisplayName: herb.displayName,
          nameChineseTraditional: '演示根',
          pinyin: 'Yǎnshì Gēn',
          amountText: '1',
          unit: 'g',
          note: 'Demo Root source term',
          status: 'demo',
        },
      ],
    })
    await expect(provider.analyzeFormula(draft)).resolves.toMatchObject({
      algorithmVersion: 'analysis-v1',
      normalizedIngredients: [{ lineId: 'line-1', herbMaterialId: herb.id }],
    })
    await expect(
      provider.compareFormulas([draft, { ...draft, id: 'draft-2' }]),
    ).resolves.toMatchObject({
      algorithmVersion: 'comparison-v1',
      repeatedIngredients: [{ herbMaterialId: herb.id }],
    })
    await expect(provider.searchTexts({ query: '' })).resolves.toMatchObject({
      items: [{ id: passage.id, documentTitle: 'Synthetic document' }],
    })
    await expect(provider.getEntityNeighborhood(herb.id)).resolves.toMatchObject({
      entityId: herb.id,
      relationships: [{ relationshipType: 'CONTAINS' }],
    })
    await expect(
      provider.buildRetrievalContext({ passageIds: [passage.id], characterBudget: 6000 }),
    ).resolves.toMatchObject({
      passages: [{ id: passage.id }],
      matchedEntities: [{ id: herb.id }],
    })
  })

  it('preserves problem details and request IDs without falling back to demo data', async () => {
    const failingFetch = vi.fn(() =>
      Promise.resolve(
        json(
          {
            type: 'https://current-flow.net/problems/herb-not-found',
            title: 'Herb material not found',
            status: 404,
            code: 'herb_not_found',
            detail: 'No herb exists with that ID.',
            requestId: 'request-problem',
            errors: [],
          },
          404,
        ),
      ),
    )
    const provider = new HttpAlchemyProvider({
      baseUrl: 'http://alchemy.test',
      fetch: failingFetch,
    })

    await expect(provider.getHerb('missing')).rejects.toMatchObject({
      uiError: {
        code: 'herb_not_found',
        requestId: 'request-problem',
        retryable: false,
      },
    })
    expect(failingFetch).toHaveBeenCalledTimes(1)
  })

  it('uses the retrieval response request ID for collision-safe package identity', async () => {
    let requestSequence = 0
    const retrievalFetch = vi.fn((input: Request) => {
      expect(new URL(input.url).pathname).toBe('/api/v1/retrieval/context')
      requestSequence += 1
      const response = json(
        envelope({
          query: 'Selected passages',
          passages: [passage],
          citations: [citation],
          matchedEntities: [herb],
          graphNeighborhoodFacts: [],
          unresolvedAmbiguities: [],
          sourceStatuses: { [source.id]: 'approved' },
          reviewStatuses: { [source.id]: 'synthetic_fixture' },
          usedCharacters: passage.originalText.length,
          characterBudget: 6000,
        }),
      )
      response.headers.set('x-request-id', `retrieval-${requestSequence}`)
      return Promise.resolve(response)
    })
    const provider = new HttpAlchemyProvider({
      baseUrl: 'http://alchemy.test',
      fetch: retrievalFetch,
    })

    const first = await provider.buildRetrievalContext({
      passageIds: [passage.id],
      characterBudget: 6000,
    })
    const second = await provider.buildRetrievalContext({
      passageIds: [passage.id],
      characterBudget: 6000,
    })

    expect(first.id).toBe('api-retrieval:retrieval-1')
    expect(second.id).toBe('api-retrieval:retrieval-2')
    expect(second.id).not.toBe(first.id)
  })

  it('normalizes configured timeouts', async () => {
    const hangingFetch = vi.fn(
      (input: Request) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = input.signal
          signal?.addEventListener(
            'abort',
            () =>
              reject(
                signal.reason instanceof Error
                  ? signal.reason
                  : new DOMException('The request timed out.', 'TimeoutError'),
              ),
            { once: true },
          )
        }),
    )
    const provider = new HttpAlchemyProvider({
      baseUrl: 'http://alchemy.test',
      fetch: hangingFetch,
      timeoutMs: 5,
    })

    await expect(provider.getHerb('slow')).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof AlchemyProviderError && error.uiError.code === 'request_timeout',
    )
  })
})
