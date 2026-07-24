import { AlchemyProviderError } from '../domain/errors'
import type { AlchemyProvider } from '../domain/provider'
import type {
  AlchemyDataStatus,
  ComparedIngredient,
  DistributionDatum,
  EntityNeighborhood,
  FormulaActionComparison,
  FormulaAnalysisResult,
  FormulaComparisonResult,
  FormulaDetail,
  FormulaDraft,
  FormulaSearchInput,
  FormulaSummary,
  HerbDetail,
  HerbSearchInput,
  HerbSummary,
  InteractionSignal,
  PaginatedResult,
  PairwiseOverlap,
  PreparationVariantSignal,
  RetrievalContextInput,
  RetrievalContextResult,
  SourceClaim,
  TextSearchInput,
} from '../domain/types'
import {
  DEMO_CAPABILITIES,
  DEMO_DISPUTE_CITATION,
  DEMO_FORMULAS,
  DEMO_HERBS,
  DEMO_INDEX_CITATION,
  DEMO_NOTEBOOK_CITATION,
  DEMO_TEXT_PASSAGES,
} from '../fixtures/demoAlchemy'

const DEFAULT_LATENCY_MS = 160

const waitForDemoLatency = (signal?: AbortSignal, latencyMs = DEFAULT_LATENCY_MS): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The request was aborted.', 'AbortError'))
      return
    }

    const timer = window.setTimeout(resolve, latencyMs)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('The request was aborted.', 'AbortError'))
      },
      { once: true },
    )
  })

const normalized = (value: string): string => value.trim().toLocaleLowerCase()

const includesQuery = (values: readonly (string | undefined)[], query: string): boolean => {
  const needle = normalized(query)
  return !needle || values.some((value) => value && normalized(value).includes(needle))
}

const paginate = <T>(
  items: readonly T[],
  page = 1,
  pageSize = 24,
  status: AlchemyDataStatus = 'demo',
): PaginatedResult<T> => {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, Math.min(100, pageSize))
  const start = (safePage - 1) * safePageSize
  const pageItems = items.slice(start, start + safePageSize)

  return {
    items: structuredClone(pageItems),
    total: items.length,
    page: safePage,
    pageSize: safePageSize,
    hasMore: start + safePageSize < items.length,
    status,
    partial: false,
  }
}

const notFound = (entityLabel: string): AlchemyProviderError =>
  new AlchemyProviderError({
    code: 'demo_record_not_found',
    title: 'Demo record not found',
    detail: `${entityLabel} is not present in the synthetic demo index.`,
    retryable: false,
  })

const valuePrefix = (value: string): string => value.split(' — ')[0] ?? value

const herbForId = (id: string): HerbDetail | undefined => DEMO_HERBS.find((herb) => herb.id === id)

const toHerbSummary = (herb: HerbDetail): HerbSummary => ({
  id: herb.id,
  displayName: herb.displayName,
  ...(herb.nameChineseSimplified ? { nameChineseSimplified: herb.nameChineseSimplified } : {}),
  ...(herb.nameChineseTraditional ? { nameChineseTraditional: herb.nameChineseTraditional } : {}),
  ...(herb.pinyin ? { pinyin: herb.pinyin } : {}),
  ...(herb.latinDrugName ? { latinDrugName: herb.latinDrugName } : {}),
  botanicalNames: herb.botanicalNames,
  aliases: herb.aliases,
  categoryLabels: herb.categoryLabels,
  status: herb.status,
  reviewStatus: herb.reviewStatus,
  sourceCount: herb.sourceCount,
  ...(herb.ambiguous === undefined ? {} : { ambiguous: herb.ambiguous }),
})

const toFormulaSummary = (formula: FormulaDetail): FormulaSummary => ({
  id: formula.id,
  displayName: formula.displayName,
  ...(formula.nameChineseSimplified
    ? { nameChineseSimplified: formula.nameChineseSimplified }
    : {}),
  ...(formula.nameChineseTraditional
    ? { nameChineseTraditional: formula.nameChineseTraditional }
    : {}),
  ...(formula.pinyin ? { pinyin: formula.pinyin } : {}),
  categories: formula.categories,
  ingredientCount: formula.ingredientCount,
  status: formula.status,
  reviewStatus: formula.reviewStatus,
  sourceCount: formula.sourceCount,
})

const claimsForDraft = (
  draft: FormulaDraft,
  key: 'actions' | 'patterns',
): readonly SourceClaim[] => {
  const seen = new Set<string>()
  const claims: SourceClaim[] = []

  for (const line of draft.ingredients) {
    const herb = herbForId(line.herbMaterialId)
    for (const item of herb?.[key] ?? []) {
      if (!seen.has(item.value)) {
        seen.add(item.value)
        claims.push(item)
      }
    }
  }

  return structuredClone(claims)
}

const distributionForDraft = (
  draft: FormulaDraft,
  key: 'thermalNatures' | 'flavors' | 'channels',
): readonly DistributionDatum[] => {
  const counts = new Map<string, number>()

  for (const line of draft.ingredients) {
    const herb = herbForId(line.herbMaterialId)
    const firstClaim = herb?.[key][0]
    if (!firstClaim) continue
    const label = valuePrefix(firstClaim.value)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
  return [...counts.entries()].map(([label, count]) => ({
    label,
    count,
    proportion: total === 0 ? 0 : count / total,
    status: 'demo',
  }))
}

const categoryDistribution = (draft: FormulaDraft): readonly DistributionDatum[] => {
  const counts = new Map<string, number>()
  for (const line of draft.ingredients) {
    for (const label of herbForId(line.herbMaterialId)?.categoryLabels ?? []) {
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
  return [...counts.entries()].map(([label, count]) => ({
    label,
    count,
    proportion: total === 0 ? 0 : count / total,
    status: 'demo',
  }))
}

const duplicateIngredients = (draft: FormulaDraft) => {
  const byHerb = new Map<string, FormulaDraft['ingredients'][number][]>()
  for (const line of draft.ingredients) {
    if (!line.herbMaterialId) continue
    const group = byHerb.get(line.herbMaterialId) ?? []
    group.push(line)
    byHerb.set(line.herbMaterialId, group)
  }

  return [...byHerb.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([herbMaterialId, lines]) => ({
      herbMaterialId,
      herbDisplayName: lines[0]?.herbDisplayName ?? 'Unresolved material',
      lineIds: lines.map((line) => line.id),
    }))
}

const preparationVariants = (draft: FormulaDraft): readonly PreparationVariantSignal[] => {
  const byHerb = new Map<string, FormulaDraft['ingredients'][number][]>()
  for (const line of draft.ingredients) {
    if (!line.herbMaterialId) continue
    const group = byHerb.get(line.herbMaterialId) ?? []
    group.push(line)
    byHerb.set(line.herbMaterialId, group)
  }

  return [...byHerb.entries()].flatMap(([herbMaterialId, lines]) => {
    const preparations = [
      ...new Set(lines.map((line) => line.preparationLabel || 'Unspecified preparation')),
    ]
    if (preparations.length < 2) return []
    return [
      {
        herbMaterialId,
        herbDisplayName: lines[0]?.herbDisplayName ?? 'Unresolved material',
        preparations,
        lineIds: lines.map((line) => line.id),
      },
    ]
  })
}

const interactionForPair = (
  sourceId: string,
  targetId: string,
  suffix: string,
): InteractionSignal => {
  const source = herbForId(sourceId)
  const target = herbForId(targetId)
  const sourceLabel = source?.displayName ?? 'Unresolved material'
  const targetLabel = target?.displayName ?? 'Unresolved material'
  const ids = [sourceId, targetId].sort()

  if (ids.includes('demo:herb:root-a') && ids.includes('demo:herb:seed-b')) {
    return {
      id: `demo:interaction:documented:${suffix}`,
      sourceEntityId: sourceId,
      sourceLabel,
      targetEntityId: targetId,
      targetLabel,
      relationshipType: 'Synthetic co-occurrence',
      kind: 'documented_relationship',
      summary:
        'These materials co-occur in the synthetic notebook. This is a fixture relationship, not a compatibility conclusion.',
      status: 'demo',
      citations: [DEMO_NOTEBOOK_CITATION],
    }
  }

  if (ids.includes('demo:herb:mineral-d')) {
    return {
      id: `demo:interaction:incomplete:${suffix}`,
      sourceEntityId: sourceId,
      sourceLabel,
      targetEntityId: targetId,
      targetLabel,
      relationshipType: 'Data coverage',
      kind: 'data_incomplete',
      summary: 'Relationship coverage is incomplete because Demo Mineral D lacks indexed fields.',
      status: 'incomplete',
      citations: [DEMO_INDEX_CITATION],
    }
  }

  return {
    id: `demo:interaction:none:${suffix}`,
    sourceEntityId: sourceId,
    sourceLabel,
    targetEntityId: targetId,
    targetLabel,
    relationshipType: 'No record found',
    kind: 'no_record_found',
    summary:
      'No relationship record was found in the synthetic fixture. Absence of a record does not imply compatibility.',
    status: 'incomplete',
    citations: [],
  }
}

const interactionsForIds = (ids: readonly string[]): readonly InteractionSignal[] => {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const signals: InteractionSignal[] = []
  for (let left = 0; left < uniqueIds.length; left += 1) {
    for (let right = left + 1; right < uniqueIds.length; right += 1) {
      const sourceId = uniqueIds[left]
      const targetId = uniqueIds[right]
      if (sourceId && targetId) {
        signals.push(interactionForPair(sourceId, targetId, `${left}-${right}`))
      }
    }
  }
  return signals
}

const comparedIngredients = (formulas: readonly FormulaDraft[]): readonly ComparedIngredient[] => {
  const occurrence = new Map<string, { label: string; formulaIds: Set<string> }>()
  for (const formula of formulas) {
    for (const ingredient of formula.ingredients) {
      if (!ingredient.herbMaterialId) continue
      const existing = occurrence.get(ingredient.herbMaterialId) ?? {
        label: ingredient.herbDisplayName,
        formulaIds: new Set<string>(),
      }
      existing.formulaIds.add(formula.id)
      occurrence.set(ingredient.herbMaterialId, existing)
    }
  }
  return [...occurrence.entries()].map(([herbMaterialId, value]) => ({
    herbMaterialId,
    herbDisplayName: value.label,
    formulaIds: [...value.formulaIds],
  }))
}

const pairwiseOverlaps = (formulas: readonly FormulaDraft[]): readonly PairwiseOverlap[] => {
  const overlaps: PairwiseOverlap[] = []
  for (let left = 0; left < formulas.length; left += 1) {
    for (let right = left + 1; right < formulas.length; right += 1) {
      const formulaA = formulas[left]
      const formulaB = formulas[right]
      if (!formulaA || !formulaB) continue
      const setA = new Set(formulaA.ingredients.map((item) => item.herbMaterialId).filter(Boolean))
      const setB = new Set(formulaB.ingredients.map((item) => item.herbMaterialId).filter(Boolean))
      const shared = [...setA].filter((id) => setB.has(id))
      const union = new Set([...setA, ...setB])
      overlaps.push({
        formulaAId: formulaA.id,
        formulaALabel: formulaA.name,
        formulaBId: formulaB.id,
        formulaBLabel: formulaB.name,
        sharedIngredientIds: shared,
        sharedIngredientLabels: shared.map(
          (id) => herbForId(id)?.displayName ?? 'Unresolved material',
        ),
        jaccardSimilarity: union.size === 0 ? 0 : shared.length / union.size,
      })
    }
  }
  return overlaps
}

const claimComparisons = (
  formulas: readonly FormulaDraft[],
  key: 'actions' | 'patterns',
): {
  shared: readonly FormulaActionComparison[]
  distinct: readonly FormulaActionComparison[]
} => {
  const byValue = new Map<string, Set<string>>()
  for (const formula of formulas) {
    for (const item of claimsForDraft(formula, key)) {
      const ids = byValue.get(item.value) ?? new Set<string>()
      ids.add(formula.id)
      byValue.set(item.value, ids)
    }
  }
  const entries = [...byValue.entries()].map(([label, formulaIds]) => ({
    label,
    formulaIds: [...formulaIds],
    status: 'demo' as const,
  }))
  return {
    shared: entries.filter((entry) => entry.formulaIds.length === formulas.length),
    distinct: entries.filter((entry) => entry.formulaIds.length < formulas.length),
  }
}

export class DemoAlchemyProvider implements AlchemyProvider {
  readonly latencyMs: number

  constructor(latencyMs = DEFAULT_LATENCY_MS) {
    this.latencyMs = latencyMs
  }

  async getStatus(signal?: AbortSignal) {
    await waitForDemoLatency(signal, this.latencyMs)
    return {
      providerId: 'demo-alchemy',
      label: 'Synthetic demo data',
      connection: 'demo' as const,
      dataStatus: 'demo' as const,
      detail: 'Deterministic local fixtures; no network requests.',
      checkedAtIso: '2026-07-23T00:00:00.000Z',
    }
  }

  async getCapabilities(signal?: AbortSignal) {
    await waitForDemoLatency(signal, this.latencyMs)
    return structuredClone(DEMO_CAPABILITIES)
  }

  async searchHerbs(input: HerbSearchInput, signal?: AbortSignal) {
    await waitForDemoLatency(signal, this.latencyMs)
    const filtered = DEMO_HERBS.filter((herb) => {
      if (
        !includesQuery(
          [
            herb.displayName,
            herb.nameChineseSimplified,
            herb.nameChineseTraditional,
            herb.pinyin,
            herb.latinDrugName,
            ...herb.botanicalNames,
            ...herb.aliases,
          ],
          input.query,
        )
      ) {
        return false
      }
      if (input.category && !herb.categoryLabels.includes(input.category)) return false
      if (input.reviewStatus && herb.reviewStatus !== input.reviewStatus) return false
      if (
        input.thermalNature &&
        !herb.thermalNatures.some((item) => item.value.startsWith(input.thermalNature ?? ''))
      ) {
        return false
      }
      if (input.flavor && !herb.flavors.some((item) => item.value.startsWith(input.flavor ?? ''))) {
        return false
      }
      if (
        input.channel &&
        !herb.channels.some((item) => item.value.startsWith(input.channel ?? ''))
      ) {
        return false
      }
      if (input.action && !herb.actions.some((item) => item.value.startsWith(input.action ?? ''))) {
        return false
      }
      if (
        input.source &&
        ![
          ...herb.biologicalSources,
          ...herb.medicinalParts,
          ...herb.preparations,
          ...herb.thermalNatures,
          ...herb.flavors,
          ...herb.channels,
          ...herb.actions,
          ...herb.patterns,
          ...herb.cautions,
          ...herb.compounds,
        ].some((item) =>
          item.citations.some((itemCitation) => itemCitation.sourceTitle === input.source),
        )
      ) {
        return false
      }
      return true
    })

    return paginate(filtered.map(toHerbSummary), input.page, input.pageSize)
  }

  async getHerb(herbId: string, signal?: AbortSignal): Promise<HerbDetail> {
    await waitForDemoLatency(signal, this.latencyMs)
    const herb = herbForId(herbId)
    if (!herb) throw notFound('The requested material')
    return structuredClone(herb)
  }

  async searchFormulas(input: FormulaSearchInput, signal?: AbortSignal) {
    await waitForDemoLatency(signal, this.latencyMs)
    const filtered = DEMO_FORMULAS.filter((formula) => {
      if (
        !includesQuery(
          [
            formula.displayName,
            formula.nameChineseSimplified,
            formula.nameChineseTraditional,
            formula.pinyin,
            ...formula.categories,
          ],
          input.query,
        )
      ) {
        return false
      }
      if (input.category && !formula.categories.includes(input.category)) return false
      if (input.reviewStatus && formula.reviewStatus !== input.reviewStatus) return false
      if (
        input.ingredientId &&
        !formula.ingredients.some((ingredient) => ingredient.herbMaterialId === input.ingredientId)
      ) {
        return false
      }
      if (
        input.action &&
        !formula.documentedActions.some((item) => item.value.startsWith(input.action ?? ''))
      ) {
        return false
      }
      if (
        input.pattern &&
        !formula.documentedPatterns.some((item) => item.value.startsWith(input.pattern ?? ''))
      ) {
        return false
      }
      if (input.source && !formula.citations.some((item) => item.sourceTitle === input.source)) {
        return false
      }
      return true
    })

    return paginate(filtered.map(toFormulaSummary), input.page, input.pageSize)
  }

  async getFormula(formulaId: string, signal?: AbortSignal): Promise<FormulaDetail> {
    await waitForDemoLatency(signal, this.latencyMs)
    const formula = DEMO_FORMULAS.find((item) => item.id === formulaId)
    if (!formula) throw notFound('The requested formula')
    return structuredClone(formula)
  }

  async analyzeFormula(
    formula: FormulaDraft,
    signal?: AbortSignal,
  ): Promise<FormulaAnalysisResult> {
    await waitForDemoLatency(signal, this.latencyMs)
    if (formula.ingredients.length === 0) {
      throw new AlchemyProviderError({
        code: 'empty_formula',
        title: 'Formula is empty',
        detail: 'Add at least one resolved demo material before analysis.',
        retryable: false,
        fieldErrors: [{ field: 'ingredients', message: 'At least one ingredient is required.' }],
      })
    }

    const unresolvedCount = formula.ingredients.filter(
      (item) => !item.herbMaterialId || !herbForId(item.herbMaterialId),
    ).length
    const missingData = [
      ...(unresolvedCount > 0 ? [`${unresolvedCount} ingredient identities are unresolved.`] : []),
      ...(formula.ingredients.some((item) => item.herbMaterialId === 'demo:herb:mineral-d')
        ? ['Demo Mineral D has incomplete nature, flavor, channel, pattern, and compound data.']
        : []),
    ]
    const conflicts = formula.ingredients.some((item) => item.herbMaterialId === 'demo:herb:root-a')
      ? [
          {
            id: 'demo:conflict:root-a-nature',
            field: 'Thermal nature',
            summary: 'Synthetic sources retain two alternate classifications for Demo Root A.',
            alternatives: [
              'Balanced — synthetic classification',
              'Gently cool — synthetic alternate',
            ],
            citations: [DEMO_INDEX_CITATION, DEMO_DISPUTE_CITATION],
          },
        ]
      : []

    return {
      algorithmVersion: 'demo-analysis-1.0',
      dataVersion: 'synthetic-fixtures-2026-07',
      status: missingData.length > 0 ? 'incomplete' : 'demo',
      normalizedIngredients: formula.ingredients.map((item) => ({
        lineId: item.id,
        herbMaterialId: item.herbMaterialId,
        herbDisplayName: item.herbDisplayName || 'Unresolved material',
        amountText: item.amountText,
        unit: item.unit,
        ...(item.preparationLabel ? { preparationLabel: item.preparationLabel } : {}),
        normalizationStatus: item.herbMaterialId ? 'unchanged' : 'unresolved',
        note: item.amountText
          ? 'Amount text retained exactly; no traditional unit conversion was attempted.'
          : 'Amount unspecified.',
      })),
      duplicateIngredients: duplicateIngredients(formula),
      preparationVariants: preparationVariants(formula),
      natureDistribution: distributionForDraft(formula, 'thermalNatures'),
      flavorDistribution: distributionForDraft(formula, 'flavors'),
      channelDistribution: distributionForDraft(formula, 'channels'),
      categoryDistribution: categoryDistribution(formula),
      documentedActions: claimsForDraft(formula, 'actions'),
      documentedPatterns: claimsForDraft(formula, 'patterns'),
      interactions: interactionsForIds(formula.ingredients.map((item) => item.herbMaterialId)),
      sourceConflicts: conflicts,
      missingData,
      warnings: [
        'Synthetic demo analysis exercises the interface only.',
        'No relationship record must not be interpreted as compatibility.',
      ],
      sourceCoveragePercent:
        formula.ingredients.length === 0
          ? 0
          : Math.max(
              0,
              Math.round(
                ((formula.ingredients.length - unresolvedCount) / formula.ingredients.length) *
                  100 -
                  (missingData.length > 0 ? 12 : 0),
              ),
            ),
      reviewStatusBreakdown: [
        { status: 'synthetic_fixture', count: formula.ingredients.length },
        { status: 'human_reviewed', count: 0 },
      ],
    }
  }

  async compareFormulas(
    formulas: readonly FormulaDraft[],
    signal?: AbortSignal,
  ): Promise<FormulaComparisonResult> {
    await waitForDemoLatency(signal, this.latencyMs)
    if (formulas.length < 2 || formulas.length > 4) {
      throw new AlchemyProviderError({
        code: 'comparison_formula_count',
        title: 'Comparison requires two to four formulas',
        detail: 'Open at least two and no more than four local formula drafts.',
        retryable: false,
        fieldErrors: [{ field: 'formulas', message: 'Select two to four formulas.' }],
      })
    }

    const ingredients = comparedIngredients(formulas)
    const repeated = ingredients.filter((item) => item.formulaIds.length > 1)
    const uniqueByFormula = Object.fromEntries(
      formulas.map((formula) => [
        formula.id,
        ingredients.filter(
          (item) => item.formulaIds.length === 1 && item.formulaIds[0] === formula.id,
        ),
      ]),
    )
    const actionComparison = claimComparisons(formulas, 'actions')
    const patternComparison = claimComparisons(formulas, 'patterns')
    const allIngredientIds = formulas.flatMap((formula) =>
      formula.ingredients.map((item) => item.herbMaterialId),
    )
    const combinedDraft: FormulaDraft = {
      id: 'demo:comparison:combined',
      name: 'Combined comparison',
      ingredients: formulas.flatMap((formula) => formula.ingredients),
      notes: '',
      updatedAtIso: '2026-07-23T00:00:00.000Z',
    }

    return {
      algorithmVersion: 'demo-comparison-1.0',
      dataVersion: 'synthetic-fixtures-2026-07',
      status: allIngredientIds.includes('demo:herb:mineral-d') ? 'incomplete' : 'demo',
      formulaIds: formulas.map((formula) => formula.id),
      pairwiseOverlap: pairwiseOverlaps(formulas),
      sharedIngredients: ingredients.filter((item) => item.formulaIds.length === formulas.length),
      uniqueIngredientsByFormula: uniqueByFormula,
      repeatedIngredients: repeated,
      preparationDifferences: preparationVariants(combinedDraft),
      combinedDistributions: categoryDistribution(combinedDraft),
      sharedActions: actionComparison.shared,
      distinctActions: actionComparison.distinct,
      sharedPatterns: patternComparison.shared,
      distinctPatterns: patternComparison.distinct,
      interactionSignals: interactionsForIds(allIngredientIds),
      conflicts: allIngredientIds.includes('demo:herb:root-a')
        ? [
            {
              id: 'demo:comparison:root-a-conflict',
              field: 'Thermal nature',
              summary: 'Root A carries an unresolved synthetic classification conflict.',
              alternatives: [
                'Balanced — synthetic classification',
                'Gently cool — synthetic alternate',
              ],
              citations: [DEMO_INDEX_CITATION, DEMO_DISPUTE_CITATION],
            },
          ]
        : [],
      missingData: allIngredientIds.includes('demo:herb:mineral-d')
        ? [
            'At least one compared formula includes Demo Mineral D, whose fixture record is incomplete.',
          ]
        : [],
      warnings: [
        'Jaccard overlap describes ingredient identity only; it does not express clinical similarity.',
        'Synthetic fixture relationships are not medical conclusions.',
      ],
    }
  }

  async searchTexts(input: TextSearchInput, signal?: AbortSignal) {
    await waitForDemoLatency(signal, this.latencyMs)
    const filtered = DEMO_TEXT_PASSAGES.filter((passage) => {
      if (
        !includesQuery(
          [
            passage.documentTitle,
            passage.chapter,
            passage.section,
            passage.text,
            ...passage.matchedTerms,
            ...passage.linkedEntities.map((entity) => entity.label),
          ],
          input.query,
        )
      ) {
        return false
      }
      if (input.language && passage.language !== input.language) return false
      if (input.source && passage.citation.sourceTitle !== input.source) return false
      if (input.documentId && passage.documentId !== input.documentId) return false
      if (input.reviewStatus && passage.reviewStatus !== input.reviewStatus) return false
      return true
    })
    return paginate(filtered, input.page, input.pageSize)
  }

  async getEntityNeighborhood(entityId: string, signal?: AbortSignal): Promise<EntityNeighborhood> {
    await waitForDemoLatency(signal, this.latencyMs)
    const herb = herbForId(entityId)
    const formula = DEMO_FORMULAS.find((item) => item.id === entityId)
    if (!herb && !formula) throw notFound('The requested entity')

    if (herb) {
      return {
        entityId: herb.id,
        entityLabel: herb.displayName,
        status: herb.status,
        relationships: herb.relatedFormulaIds.map((formulaId, index) => ({
          id: `demo:relationship:${herb.id}:${formulaId}`,
          sourceEntityId: herb.id,
          sourceLabel: herb.displayName,
          targetEntityId: formulaId,
          targetLabel:
            DEMO_FORMULAS.find((item) => item.id === formulaId)?.displayName ?? 'Demo formula',
          relationshipType: 'Appears in synthetic formula',
          direction: 'outgoing',
          status: 'demo',
          citations: index === 0 ? [DEMO_NOTEBOOK_CITATION] : [DEMO_INDEX_CITATION],
        })),
        missingRelationshipTypes: ['Real-world interaction records', 'Verified taxonomic links'],
      }
    }

    const resolvedFormula = formula
    if (!resolvedFormula) throw notFound('The requested entity')
    return {
      entityId: resolvedFormula.id,
      entityLabel: resolvedFormula.displayName,
      status: resolvedFormula.status,
      relationships: resolvedFormula.ingredients.map((ingredient) => ({
        id: `demo:relationship:${resolvedFormula.id}:${ingredient.id}`,
        sourceEntityId: resolvedFormula.id,
        sourceLabel: resolvedFormula.displayName,
        targetEntityId: ingredient.herbMaterialId,
        targetLabel: ingredient.herbDisplayName,
        relationshipType: 'Contains synthetic material',
        direction: 'outgoing',
        status: 'demo',
        citations: [DEMO_NOTEBOOK_CITATION],
      })),
      missingRelationshipTypes: ['Verified lineage', 'Real-world interaction records'],
    }
  }

  async buildRetrievalContext(
    input: RetrievalContextInput,
    signal?: AbortSignal,
  ): Promise<RetrievalContextResult> {
    await waitForDemoLatency(signal, this.latencyMs)
    const passages = DEMO_TEXT_PASSAGES.filter((passage) => input.passageIds.includes(passage.id))
    const citations = [
      ...new Map(passages.map((passage) => [passage.citation.id, passage.citation])).values(),
    ]
    const entities = [
      ...new Map(
        passages.flatMap((passage) =>
          passage.linkedEntities.map((entity) => [entity.id, entity] as const),
        ),
      ).values(),
    ]
    const characterCount = passages.reduce((count, passage) => count + passage.text.length, 0)

    return {
      id: `demo:retrieval-context:${passages.map((passage) => passage.id).join('|')}`,
      status: passages.some((passage) => passage.status === 'conflicted') ? 'conflicted' : 'demo',
      passages: structuredClone(passages),
      citations: structuredClone(citations),
      matchedEntities: structuredClone(entities),
      graphFacts: entities.slice(0, 3).map((entity, index) => ({
        id: `demo:graph-fact:${index}`,
        subject: entity.label,
        predicate: 'linked from',
        object:
          passages.find((passage) =>
            passage.linkedEntities.some((linked) => linked.id === entity.id),
          )?.documentTitle ?? 'Synthetic source',
        status: 'demo',
        citationIds: citations.slice(0, 1).map((item) => item.id),
      })),
      unresolvedAmbiguities: passages.some((passage) => passage.status === 'conflicted')
        ? ['Demo Root A has two unresolved synthetic thermal classifications.']
        : [],
      characterBudget: input.characterBudget,
      characterCount,
      sourceSummary: [
        ...new Map(
          passages.map((passage) => [
            passage.documentTitle,
            {
              sourceTitle: passage.documentTitle,
              passageCount: passages.filter((item) => item.documentTitle === passage.documentTitle)
                .length,
              reviewStatuses: ['synthetic_fixture'] as const,
            },
          ]),
        ).values(),
      ],
    }
  }
}
