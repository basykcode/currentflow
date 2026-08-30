import type { components } from './generated/schema'
import type {
  AlchemyDataStatus,
  Citation,
  ComparedIngredient,
  DistributionDatum,
  EntityNeighborhood,
  FormulaActionComparison,
  FormulaAnalysisResult,
  FormulaComparisonResult,
  FormulaDetail,
  FormulaDraft,
  FormulaSummary,
  HerbDetail,
  HerbSummary,
  InteractionSignal,
  KnowledgeCompleteness,
  PaginatedResult,
  PreparationVariantSignal,
  RetrievalContextResult,
  ReviewStatus,
  SourceClaim,
  TextLinkedEntity,
  TextPassageResult,
} from '../domain/types'

type ApiCitation = components['schemas']['Citation']
type ApiClaim = components['schemas']['ClaimRecord']
type ApiEntitySummary = components['schemas']['EntitySummary']
type ApiEntityDetail = components['schemas']['EntityDetail']
type ApiKnowledgeMeta = components['schemas']['KnowledgeMeta']
type ApiAnalysis = components['schemas']['FormulaAnalysisResult']
type ApiComparison = components['schemas']['FormulaComparisonResult']
type ApiPassage = components['schemas']['PassageRecord']
type ApiTextResult = components['schemas']['TextSearchResult']
type ApiRetrieval = components['schemas']['RetrievalPackage']

const first = <T>(items: readonly T[] | undefined): T | undefined => items?.[0]

const reviewStatus = (statuses: readonly ReviewStatus[] | undefined): ReviewStatus =>
  first(statuses) ?? 'unavailable'

const stringArray = (
  properties: ApiEntitySummary['properties'] | ApiEntityDetail['properties'] | undefined,
  key: string,
): readonly string[] => {
  const value = properties?.[key]
  return Array.isArray(value) ? value : []
}

const stringValue = (
  properties: ApiEntitySummary['properties'] | ApiEntityDetail['properties'] | undefined,
  key: string,
): string | undefined => {
  const value = properties?.[key]
  return typeof value === 'string' ? value : undefined
}

const nameFor = (
  names: ApiEntitySummary['names'],
  predicate: (name: NonNullable<ApiEntitySummary['names']>[number]) => boolean,
): string | undefined => names?.find(predicate)?.text

const nameFields = (entity: ApiEntitySummary) => {
  const nameChineseSimplified = nameFor(entity.names, (name) => name.language === 'zh-Hans')
  const nameChineseTraditional = nameFor(entity.names, (name) => name.language === 'zh-Hant')
  const pinyin = nameFor(entity.names, (name) => name.language.toLowerCase().includes('pinyin'))
  return {
    ...(nameChineseSimplified ? { nameChineseSimplified } : {}),
    ...(nameChineseTraditional ? { nameChineseTraditional } : {}),
    ...(pinyin ? { pinyin } : {}),
  }
}

const citationId = (citation: ApiCitation): string =>
  ['api-citation', citation.sourceId, citation.locator ?? 'unlocated', citation.reviewStatus].join(
    ':',
  )

export const mapCitation = (citation: ApiCitation): Citation => ({
  id: citationId(citation),
  sourceId: citation.sourceId,
  sourceTitle: citation.sourceTitle,
  ...(citation.locator ? { locator: citation.locator } : {}),
  quotation: citation.citationText,
  reviewStatus: citation.reviewStatus,
})

const claimCitation = (claim: ApiClaim): Citation => ({
  id: ['api-claim-citation', claim.id, claim.source.id].join(':'),
  sourceId: claim.source.id,
  sourceTitle: claim.source.title,
  ...(claim.sourceLocator ? { locator: claim.sourceLocator } : {}),
  ...(claim.language ? { language: claim.language } : {}),
  quotation: claim.originalQuotation ?? claim.source.citation,
  reviewStatus: claim.reviewStatus,
})

const claimValue = (claim: ApiClaim): string | undefined =>
  claim.normalizedInterpretation ?? claim.textualValue ?? claim.objectId ?? undefined

const mapClaim = (claim: ApiClaim, entityStatus: AlchemyDataStatus): SourceClaim | undefined => {
  const value = claimValue(claim)
  if (!value) return undefined
  return {
    id: claim.id,
    predicate: claim.predicate,
    value,
    ...(claim.normalizedInterpretation ? { normalizedValue: claim.normalizedInterpretation } : {}),
    status: claim.reviewStatus === 'disputed' ? 'conflicted' : entityStatus,
    citations: [claimCitation(claim)],
  }
}

const claimsFor = (
  claims: readonly ApiClaim[] | undefined,
  predicates: readonly string[],
  status: AlchemyDataStatus,
): readonly SourceClaim[] =>
  (claims ?? [])
    .filter((claim) => predicates.includes(claim.predicate))
    .map((claim) => mapClaim(claim, status))
    .filter((claim): claim is SourceClaim => claim !== undefined)

const completeness = (
  ratio: number,
  totalFieldCount: number,
  unresolvedConflictCount: number,
): KnowledgeCompleteness => ({
  knownFieldCount: Math.round(ratio * totalFieldCount),
  totalFieldCount,
  unresolvedConflictCount,
})

const pagination = <T>(
  items: readonly T[],
  meta: ApiKnowledgeMeta,
  pageMeta: components['schemas']['PageMeta'],
): PaginatedResult<T> => ({
  items,
  total: pageMeta.total,
  page: Math.floor(pageMeta.offset / pageMeta.limit) + 1,
  pageSize: pageMeta.limit,
  hasMore: pageMeta.hasMore,
  status: meta.dataStatus,
  partial: meta.dataStatus === 'incomplete' || (meta.warnings?.length ?? 0) > 0,
})

export const mapHerbSummary = (entity: ApiEntitySummary): HerbSummary => {
  const latinDrugName = nameFor(entity.names, (name) => name.kind.toLowerCase().includes('latin'))
  return {
    id: entity.id,
    displayName: entity.displayName,
    ...nameFields(entity),
    ...(latinDrugName ? { latinDrugName } : {}),
    botanicalNames:
      entity.names
        ?.filter((name) => name.kind.toLowerCase().includes('botanical'))
        .map((name) => name.text) ?? [],
    aliases:
      entity.names
        ?.filter(
          (name) =>
            name.kind.toLowerCase().includes('alias') &&
            !name.kind.toLowerCase().includes('botanical'),
        )
        .map((name) => name.text) ?? [],
    categoryLabels: stringArray(entity.properties, 'categories'),
    status: entity.dataStatus,
    reviewStatus: reviewStatus(entity.reviewStatuses),
    sourceCount: entity.sourceIds?.length ?? 0,
    ambiguous: (entity.ambiguity?.length ?? 0) > 0,
  }
}

export const mapHerbPage = (
  envelope: components['schemas']['Envelope_PaginatedData_EntitySummary__'],
): PaginatedResult<HerbSummary> =>
  pagination(envelope.data.items.map(mapHerbSummary), envelope.meta, envelope.data.pagination)

export const mapHerbDetail = (
  envelope: components['schemas']['Envelope_EntityDetail_'],
): HerbDetail => {
  const entity = envelope.data
  const base = mapHerbSummary(entity)
  return {
    ...base,
    biologicalSources: claimsFor(entity.claims, ['DERIVED_FROM'], entity.dataStatus),
    medicinalParts: claimsFor(entity.claims, ['USES_PART'], entity.dataStatus),
    preparations: claimsFor(entity.claims, ['PREPARED_FROM', 'HAS_PREPARATION'], entity.dataStatus),
    thermalNatures: claimsFor(entity.claims, ['HAS_NATURE'], entity.dataStatus),
    flavors: claimsFor(entity.claims, ['HAS_FLAVOR'], entity.dataStatus),
    channels: claimsFor(entity.claims, ['ENTERS_CHANNEL'], entity.dataStatus),
    actions: claimsFor(entity.claims, ['HAS_ACTION'], entity.dataStatus),
    patterns: claimsFor(entity.claims, ['ADDRESSES_PATTERN'], entity.dataStatus),
    cautions: claimsFor(entity.claims, ['CAUTION', 'CONTRAINDICATED_WITH'], entity.dataStatus),
    compounds: claimsFor(entity.claims, ['CONTAINS_COMPOUND'], entity.dataStatus),
    relatedFormulaIds: stringArray(entity.properties, 'relatedFormulaIds'),
    completeness: completeness(entity.completeness, 10, entity.unresolvedConflicts?.length ?? 0),
  }
}

export const mapFormulaSummary = (entity: ApiEntitySummary): FormulaSummary => {
  const ingredientIds = stringArray(entity.properties, 'ingredientIds')
  const categories = [
    ...stringArray(entity.properties, 'categories'),
    ...(stringValue(entity.properties, 'category')
      ? [stringValue(entity.properties, 'category') as string]
      : []),
  ]
  return {
    id: entity.id,
    displayName: entity.displayName,
    ...nameFields(entity),
    categories,
    ingredientCount: ingredientIds.length,
    status: entity.dataStatus,
    reviewStatus: reviewStatus(entity.reviewStatuses),
    sourceCount: entity.sourceIds?.length ?? 0,
  }
}

export const mapFormulaPage = (
  envelope: components['schemas']['Envelope_PaginatedData_EntitySummary__'],
): PaginatedResult<FormulaSummary> =>
  pagination(envelope.data.items.map(mapFormulaSummary), envelope.meta, envelope.data.pagination)

export const mapFormulaDetail = (
  envelope: components['schemas']['Envelope_EntityDetail_'],
  ingredientEntities: ReadonlyMap<string, ApiEntityDetail>,
): FormulaDetail => {
  const entity = envelope.data
  const summary = mapFormulaSummary(entity)
  const citations = (entity.claims ?? []).map(claimCitation)
  const ingredientIds = stringArray(entity.properties, 'ingredientIds')
  const ingredientAmounts = stringArray(entity.properties, 'ingredientAmountTexts')
  const ingredientUnits = stringArray(entity.properties, 'ingredientUnits')
  const ingredientSourceTerms = stringArray(entity.properties, 'ingredientSourceTerms')
  const status: AlchemyDataStatus =
    ingredientIds.length > 0 && ingredientEntities.size < ingredientIds.length
      ? 'incomplete'
      : entity.dataStatus
  return {
    ...summary,
    status,
    variants: (entity.claims ?? [])
      .filter((claim) => claim.predicate === 'VARIANT_OF')
      .map((claim) => ({
        id: claim.id,
        label: claimValue(claim) ?? claim.id,
        description: claim.textualValue ?? 'Variant relationship reported by the source.',
        status: claim.reviewStatus === 'disputed' ? 'conflicted' : entity.dataStatus,
        citations: [claimCitation(claim)],
      })),
    ingredients: ingredientIds.map((herbMaterialId, index) => {
      const ingredient = ingredientEntities.get(herbMaterialId)
      const names = ingredient ? nameFields(ingredient) : {}
      return {
        id: `api-formula-line:${entity.id}:${index}`,
        herbMaterialId,
        herbDisplayName: ingredient?.displayName ?? herbMaterialId,
        ...names,
        amountText: ingredientAmounts[index] ?? '',
        unit: ingredientUnits[index] ?? '',
        status: ingredient ? entity.dataStatus : 'unavailable',
        citations,
        note:
          ingredientSourceTerms[index] ??
          'The source identifies this material without a separate source-term label.',
      }
    }),
    preparationNotes: claimsFor(
      entity.claims,
      ['PREPARATION', 'PREPARATION_NOTE'],
      entity.dataStatus,
    ),
    documentedActions: claimsFor(entity.claims, ['HAS_ACTION'], entity.dataStatus),
    documentedPatterns: claimsFor(entity.claims, ['ADDRESSES_PATTERN'], entity.dataStatus),
    cautions: claimsFor(entity.claims, ['CAUTION', 'CONTRAINDICATED_WITH'], entity.dataStatus),
    conflicts: (entity.unresolvedConflicts ?? []).map((summaryText, index) => ({
      id: `api-formula-conflict:${entity.id}:${index}`,
      field: 'Source record',
      summary: summaryText,
      alternatives: [],
      citations,
    })),
    citations,
    completeness: completeness(entity.completeness, 7, entity.unresolvedConflicts?.length ?? 0),
  }
}

const mapDistribution = (
  entries: readonly components['schemas']['DistributionEntry'][] | undefined,
  status: AlchemyDataStatus,
): readonly DistributionDatum[] =>
  (entries ?? []).map((entry) => ({
    label: entry.value,
    count: entry.count,
    proportion: entry.proportion,
    status,
  }))

const mapInteraction = (
  signal: components['schemas']['IngredientPairSignal'],
  labels: ReadonlyMap<string, string>,
  index: number,
): InteractionSignal => ({
  id: `api-interaction:${signal.leftHerbMaterialId}:${signal.rightHerbMaterialId}:${index}`,
  sourceEntityId: signal.leftHerbMaterialId,
  sourceLabel: labels.get(signal.leftHerbMaterialId) ?? signal.leftHerbMaterialId,
  targetEntityId: signal.rightHerbMaterialId,
  targetLabel: labels.get(signal.rightHerbMaterialId) ?? signal.rightHerbMaterialId,
  relationshipType: signal.relationshipType ?? 'Unspecified relationship',
  kind: signal.relationshipStatus === 'documented' ? 'documented_relationship' : 'no_record_found',
  summary:
    signal.context ??
    signal.uncertainty ??
    (signal.relationshipStatus === 'documented'
      ? 'The backend returned a documented relationship.'
      : 'No relationship record was returned.'),
  status: signal.relationshipStatus === 'documented' ? 'source_reported' : 'unavailable',
  citations: (signal.claims ?? []).map(claimCitation),
})

const flattenMissing = (missing: Readonly<Record<string, readonly string[]>>): readonly string[] =>
  Object.entries(missing).flatMap(([field, values]) => values.map((value) => `${field}: ${value}`))

export const mapAnalysis = (
  data: ApiAnalysis,
  meta: ApiKnowledgeMeta,
  draft: FormulaDraft,
): FormulaAnalysisResult => {
  const labels = new Map(
    data.normalizedIngredients.map((item) => [item.herbMaterialId, item.displayName]),
  )
  const lineIds = draft.ingredients.map((item) => item.id)
  const duplicateIds = new Set(data.exactDuplicateIngredientIds)
  const missing = flattenMissing(data.missingData)
  return {
    algorithmVersion: data.algorithmVersion,
    dataVersion: data.dataVersion,
    status: meta.dataStatus,
    normalizedIngredients: data.normalizedIngredients.map((item) => ({
      lineId: lineIds[item.inputIndex] ?? `api-line:${item.inputIndex}`,
      herbMaterialId: item.herbMaterialId,
      herbDisplayName: item.displayName,
      amountText: item.originalAmount ?? '',
      unit: item.originalUnit ?? '',
      ...(item.preparationId ? { preparationLabel: item.preparationId } : {}),
      normalizationStatus: item.grams
        ? 'unchanged'
        : item.originalUnit
          ? 'unsupported'
          : 'unresolved',
      ...(item.note ? { note: item.note } : {}),
    })),
    duplicateIngredients: [...duplicateIds].map((herbMaterialId) => ({
      herbMaterialId,
      herbDisplayName: labels.get(herbMaterialId) ?? herbMaterialId,
      lineIds: data.normalizedIngredients
        .filter((item) => item.herbMaterialId === herbMaterialId)
        .map((item) => lineIds[item.inputIndex] ?? `api-line:${item.inputIndex}`),
    })),
    preparationVariants: Object.entries(data.preparationDistinctions).map(
      ([herbMaterialId, preparations]) => ({
        herbMaterialId,
        herbDisplayName: labels.get(herbMaterialId) ?? herbMaterialId,
        preparations,
        lineIds: data.normalizedIngredients
          .filter((item) => item.baseMaterialId === herbMaterialId)
          .map((item) => lineIds[item.inputIndex] ?? `api-line:${item.inputIndex}`),
      }),
    ),
    natureDistribution: mapDistribution(data.distributions['thermalNatures'], meta.dataStatus),
    flavorDistribution: mapDistribution(data.distributions['flavors'], meta.dataStatus),
    channelDistribution: mapDistribution(data.distributions['channels'], meta.dataStatus),
    categoryDistribution: mapDistribution(data.distributions['categories'], meta.dataStatus),
    documentedActions: data.documentedActions.map((value, index) => ({
      id: `api-analysis-action:${index}`,
      predicate: 'HAS_ACTION',
      value,
      status: meta.dataStatus,
      citations: [],
    })),
    documentedPatterns: data.documentedPatterns.map((value, index) => ({
      id: `api-analysis-pattern:${index}`,
      predicate: 'ADDRESSES_PATTERN',
      value,
      status: meta.dataStatus,
      citations: [],
    })),
    interactions: data.pairSignals.map((signal, index) => mapInteraction(signal, labels, index)),
    sourceConflicts: data.conflicts.map((summary, index) => ({
      id: `api-analysis-conflict:${index}`,
      field: 'Source record',
      summary,
      alternatives: [],
      citations: [],
    })),
    missingData: [...missing, ...data.unsupportedOrUnresolvedUnits],
    warnings: data.warnings,
    sourceCoveragePercent: data.sourceCoveragePercentage,
    reviewStatusBreakdown: Object.entries(data.reviewStatusBreakdown)
      .filter(([status]) =>
        [
          'synthetic_fixture',
          'machine_imported',
          'human_reviewed',
          'disputed',
          'superseded',
        ].includes(status),
      )
      .map(([status, count]) => ({ status: status as ReviewStatus, count })),
  }
}

const comparedIngredients = (
  data: ApiComparison,
): {
  labels: ReadonlyMap<string, string>
  formulasByIngredient: ReadonlyMap<string, readonly string[]>
} => {
  const labels = new Map<string, string>()
  const formulasByIngredient = new Map<string, string[]>()
  data.analyses.forEach((analysis) => {
    const formulaId = analysis.originalInput.id ?? analysis.originalInput.name
    analysis.normalizedIngredients.forEach((ingredient) => {
      labels.set(ingredient.herbMaterialId, ingredient.displayName)
      const formulaIds = formulasByIngredient.get(ingredient.herbMaterialId) ?? []
      if (!formulaIds.includes(formulaId)) formulaIds.push(formulaId)
      formulasByIngredient.set(ingredient.herbMaterialId, formulaIds)
    })
  })
  return { labels, formulasByIngredient }
}

const compared = (
  herbMaterialId: string,
  labels: ReadonlyMap<string, string>,
  formulasByIngredient: ReadonlyMap<string, readonly string[]>,
): ComparedIngredient => ({
  herbMaterialId,
  herbDisplayName: labels.get(herbMaterialId) ?? herbMaterialId,
  formulaIds: formulasByIngredient.get(herbMaterialId) ?? [],
})

const actionComparisons = (
  values: Readonly<Record<string, readonly string[]>>,
  status: AlchemyDataStatus,
): readonly FormulaActionComparison[] => {
  const formulasByValue = new Map<string, string[]>()
  Object.entries(values).forEach(([formulaId, labels]) => {
    labels.forEach((label) => {
      const formulas = formulasByValue.get(label) ?? []
      formulas.push(formulaId)
      formulasByValue.set(label, formulas)
    })
  })
  return [...formulasByValue].map(([label, formulaIds]) => ({ label, formulaIds, status }))
}

export const mapComparison = (
  data: ApiComparison,
  meta: ApiKnowledgeMeta,
): FormulaComparisonResult => {
  const { labels, formulasByIngredient } = comparedIngredients(data)
  const formulaIds = data.analyses.map(
    (analysis) => analysis.originalInput.id ?? analysis.originalInput.name,
  )
  const allIngredientIds = [...formulasByIngredient.keys()]
  const sharedIds = allIngredientIds.filter(
    (ingredientId) => formulasByIngredient.get(ingredientId)?.length === formulaIds.length,
  )
  const uniqueIngredientsByFormula = Object.fromEntries(
    formulaIds.map((formulaId) => [
      formulaId,
      allIngredientIds
        .filter((ingredientId) => {
          const ids = formulasByIngredient.get(ingredientId) ?? []
          return ids.length === 1 && ids[0] === formulaId
        })
        .map((ingredientId) => compared(ingredientId, labels, formulasByIngredient)),
    ]),
  )
  const preparationDifferences: PreparationVariantSignal[] = data.pairwise.flatMap((pair) =>
    Object.entries(pair.sameMaterialDifferentPreparations).map(
      ([herbMaterialId, preparations]) => ({
        herbMaterialId,
        herbDisplayName: labels.get(herbMaterialId) ?? herbMaterialId,
        preparations,
        lineIds: [],
      }),
    ),
  )
  const sharedActionValues = Object.fromEntries(
    formulaIds.map((formulaId) => [formulaId, data.sharedActions]),
  )
  const sharedPatternValues = Object.fromEntries(
    formulaIds.map((formulaId) => [formulaId, data.sharedPatterns]),
  )
  return {
    algorithmVersion: data.algorithmVersion,
    dataVersion: data.dataVersion,
    status: meta.dataStatus,
    formulaIds,
    pairwiseOverlap: data.pairwise.map((pair) => ({
      formulaAId: pair.leftKey,
      formulaALabel: pair.leftKey,
      formulaBId: pair.rightKey,
      formulaBLabel: pair.rightKey,
      sharedIngredientIds: pair.sharedIngredientIds,
      sharedIngredientLabels: pair.sharedIngredientIds.map(
        (ingredientId) => labels.get(ingredientId) ?? ingredientId,
      ),
      jaccardSimilarity: pair.jaccardSimilarity,
    })),
    sharedIngredients: sharedIds.map((id) => compared(id, labels, formulasByIngredient)),
    uniqueIngredientsByFormula,
    repeatedIngredients: data.repeatedIngredientIds.map((id) =>
      compared(id, labels, formulasByIngredient),
    ),
    preparationDifferences,
    combinedDistributions: Object.values(data.combinedDistributions).flatMap((entries) =>
      mapDistribution(entries, meta.dataStatus),
    ),
    sharedActions: actionComparisons(sharedActionValues, meta.dataStatus),
    distinctActions: actionComparisons(data.distinctActions, meta.dataStatus),
    sharedPatterns: actionComparisons(sharedPatternValues, meta.dataStatus),
    distinctPatterns: actionComparisons(data.distinctPatterns, meta.dataStatus),
    interactionSignals: data.crossFormulaPairSignals.map((signal, index) =>
      mapInteraction(signal, labels, index),
    ),
    conflicts: data.sourceConflicts.map((summary, index) => ({
      id: `api-comparison-conflict:${index}`,
      field: 'Source record',
      summary,
      alternatives: [],
      citations: [],
    })),
    missingData: Object.entries(data.completenessSummary)
      .filter(([, ratio]) => ratio < 1)
      .map(([formulaId, ratio]) => `${formulaId}: ${Math.round(ratio * 100)}% source coverage.`),
    warnings: data.warnings,
  }
}

export const mapTextPassage = (
  result: ApiTextResult,
  meta: ApiKnowledgeMeta,
  documentTitle?: string,
): TextPassageResult => ({
  id: result.passage.id,
  documentId: result.passage.documentId,
  documentTitle: documentTitle ?? result.passage.documentTitle,
  locator: result.passage.sourceLocator,
  language: result.passage.language,
  text: result.passage.originalText,
  matchedTerms: result.matchedTerms ?? [],
  linkedEntities: result.passage.mentionedEntities?.map(linkedEntity) ?? [],
  reviewStatus: result.passage.reviewStatus,
  status: meta.dataStatus,
  citation: mapCitation(result.passage.citation),
})

export const mapTextPage = (
  envelope: components['schemas']['Envelope_PaginatedData_TextSearchResult__'],
  documentTitles: ReadonlyMap<string, string>,
): PaginatedResult<TextPassageResult> =>
  pagination(
    envelope.data.items.map((item) =>
      mapTextPassage(item, envelope.meta, documentTitles.get(item.passage.documentId)),
    ),
    envelope.meta,
    envelope.data.pagination,
  )

const nodeType = (
  entityType: components['schemas']['EntityType'],
): TextLinkedEntity['entityType'] => {
  if (entityType === 'Formula') return 'formula'
  if (entityType === 'Source') return 'source'
  if (entityType === 'Category') return 'category'
  return 'herb'
}

const linkedEntity = (entity: components['schemas']['EntitySummary']): TextLinkedEntity => ({
  id: entity.id,
  label: entity.displayName,
  entityType: nodeType(entity.entityType),
})

export const mapNeighborhood = (
  envelope: components['schemas']['Envelope_ExploreQueryResult_'],
  entityId: string,
): EntityNeighborhood => {
  const graph = envelope.data
  const labels = new Map(graph.nodes.map((node) => [node.id, node.displayName]))
  const root = graph.nodes.find((node) => node.id === entityId)
  return {
    entityId,
    entityLabel: root?.displayName ?? entityId,
    status: envelope.meta.dataStatus,
    relationships: graph.edges.map((edge) => ({
      id: edge.id,
      sourceEntityId: edge.sourceId,
      sourceLabel: labels.get(edge.sourceId) ?? edge.sourceId,
      targetEntityId: edge.targetId,
      targetLabel: labels.get(edge.targetId) ?? edge.targetId,
      relationshipType: edge.relationshipType,
      direction:
        edge.sourceId === entityId
          ? 'outgoing'
          : edge.targetId === entityId
            ? 'incoming'
            : 'bidirectional',
      status: envelope.meta.dataStatus,
      citations: [],
    })),
    missingRelationshipTypes:
      envelope.meta.dataStatus === 'incomplete'
        ? ['The API marks this graph projection as incomplete.']
        : [],
  }
}

const mapPassage = (passage: ApiPassage, status: AlchemyDataStatus): TextPassageResult => ({
  id: passage.id,
  documentId: passage.documentId,
  documentTitle: passage.documentTitle,
  locator: passage.sourceLocator,
  language: passage.language,
  text: passage.originalText,
  matchedTerms: [],
  linkedEntities: passage.mentionedEntities?.map(linkedEntity) ?? [],
  reviewStatus: passage.reviewStatus,
  status,
  citation: mapCitation(passage.citation),
})

export const mapRetrieval = (
  data: ApiRetrieval,
  meta: ApiKnowledgeMeta,
  requestId: string,
): RetrievalContextResult => {
  const citations = data.citations.map(mapCitation)
  const citationIds = new Map(citations.map((citation) => [citation.sourceId, citation.id]))
  const sourceSummary = new Map<
    string,
    { sourceTitle: string; passageCount: number; reviewStatuses: ReviewStatus[] }
  >()
  data.passages.forEach((passage) => {
    const title = passage.citation.sourceTitle
    const existing = sourceSummary.get(title) ?? {
      sourceTitle: title,
      passageCount: 0,
      reviewStatuses: [],
    }
    existing.passageCount += 1
    if (!existing.reviewStatuses.includes(passage.reviewStatus)) {
      existing.reviewStatuses.push(passage.reviewStatus)
    }
    sourceSummary.set(title, existing)
  })
  return {
    id: `api-retrieval:${requestId}`,
    status: meta.dataStatus,
    passages: data.passages.map((passage) => mapPassage(passage, meta.dataStatus)),
    citations,
    matchedEntities: data.matchedEntities.map(linkedEntity),
    graphFacts: data.graphNeighborhoodFacts.map((fact, index) => ({
      id: `api-retrieval-fact:${index}`,
      subject: fact.subjectId,
      predicate: fact.predicate,
      object: fact.objectId ?? fact.textualValue ?? 'Unavailable',
      status: meta.dataStatus,
      citationIds: [citationIds.get(fact.citation.sourceId) ?? citationId(fact.citation)],
    })),
    unresolvedAmbiguities: data.unresolvedAmbiguities,
    characterBudget: data.characterBudget,
    characterCount: data.usedCharacters,
    sourceSummary: [...sourceSummary.values()],
  }
}

export const formulaDraftToRequest = (
  formula: FormulaDraft,
): components['schemas']['FormulaCompositionInput-Input'] => ({
  id: formula.id,
  name: formula.name,
  sourceFormulaId: formula.sourceFormulaId ?? null,
  notes: formula.notes,
  ingredients: formula.ingredients.map((ingredient) => {
    const amount = ingredient.amountText.trim()
    return {
      herbMaterialId: ingredient.herbMaterialId,
      ...(amount ? { amount } : {}),
      ...(ingredient.unit ? { unit: ingredient.unit } : {}),
      ...(ingredient.preparationId ? { preparationId: ingredient.preparationId } : {}),
      ...(ingredient.role ? { role: ingredient.role } : {}),
      ...(ingredient.note ? { note: ingredient.note } : {}),
    }
  }),
})
