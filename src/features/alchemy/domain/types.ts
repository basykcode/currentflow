export type AlchemyDataStatus =
  'demo' | 'verified' | 'source_reported' | 'conflicted' | 'incomplete' | 'unavailable'

export type ReviewStatus =
  | 'synthetic_fixture'
  | 'machine_imported'
  | 'human_reviewed'
  | 'disputed'
  | 'superseded'
  | 'unavailable'

export type Citation = {
  id: string
  sourceId: string
  sourceTitle: string
  locator?: string
  url?: string
  language?: string
  quotation?: string
  reviewStatus: ReviewStatus
}

export type SourceClaim<T = string> = {
  id: string
  predicate: string
  value: T
  normalizedValue?: string
  status: AlchemyDataStatus
  citations: readonly Citation[]
  conflictGroupId?: string
}

export type KnowledgeCompleteness = {
  knownFieldCount: number
  totalFieldCount: number
  unresolvedConflictCount: number
}

export type HerbSummary = {
  id: string
  displayName: string
  nameChineseSimplified?: string
  nameChineseTraditional?: string
  pinyin?: string
  latinDrugName?: string
  botanicalNames: readonly string[]
  aliases: readonly string[]
  categoryLabels: readonly string[]
  status: AlchemyDataStatus
  reviewStatus: ReviewStatus
  sourceCount: number
  ambiguous?: boolean
}

export type HerbDetail = HerbSummary & {
  biologicalSources: readonly SourceClaim[]
  medicinalParts: readonly SourceClaim[]
  preparations: readonly SourceClaim[]
  thermalNatures: readonly SourceClaim[]
  flavors: readonly SourceClaim[]
  channels: readonly SourceClaim[]
  actions: readonly SourceClaim[]
  patterns: readonly SourceClaim[]
  cautions: readonly SourceClaim[]
  compounds: readonly SourceClaim[]
  relatedFormulaIds: readonly string[]
  completeness: KnowledgeCompleteness
}

export type FormulaSummary = {
  id: string
  displayName: string
  nameChineseSimplified?: string
  nameChineseTraditional?: string
  pinyin?: string
  categories: readonly string[]
  ingredientCount: number
  status: AlchemyDataStatus
  reviewStatus: ReviewStatus
  sourceCount: number
}

export type FormulaIngredientLine = {
  id: string
  herbMaterialId: string
  herbDisplayName: string
  nameChineseSimplified?: string
  nameChineseTraditional?: string
  pinyin?: string
  amountText: string
  unit: string
  preparationId?: string
  preparationLabel?: string
  role?: string
  note?: string
}

export type FormulaSourceIngredient = FormulaIngredientLine & {
  status: AlchemyDataStatus
  citations: readonly Citation[]
}

export type FormulaVariant = {
  id: string
  label: string
  description: string
  status: AlchemyDataStatus
  citations: readonly Citation[]
}

export type FormulaDetail = FormulaSummary & {
  variants: readonly FormulaVariant[]
  ingredients: readonly FormulaSourceIngredient[]
  preparationNotes: readonly SourceClaim[]
  documentedActions: readonly SourceClaim[]
  documentedPatterns: readonly SourceClaim[]
  cautions: readonly SourceClaim[]
  conflicts: readonly SourceConflict[]
  citations: readonly Citation[]
  completeness: KnowledgeCompleteness
}

export type FormulaDraft = {
  id: string
  name: string
  sourceFormulaId?: string
  ingredients: readonly FormulaIngredientLine[]
  notes: string
  updatedAtIso: string
}

export type IngredientNormalizationStatus = 'unchanged' | 'unresolved' | 'unsupported'

export type NormalizedIngredient = {
  lineId: string
  herbMaterialId: string
  herbDisplayName: string
  amountText: string
  unit: string
  preparationLabel?: string
  normalizationStatus: IngredientNormalizationStatus
  note?: string
}

export type DuplicateIngredient = {
  herbMaterialId: string
  herbDisplayName: string
  lineIds: readonly string[]
}

export type PreparationVariantSignal = {
  herbMaterialId: string
  herbDisplayName: string
  preparations: readonly string[]
  lineIds: readonly string[]
}

export type DistributionDatum = {
  label: string
  count: number
  proportion: number
  status: AlchemyDataStatus
}

export type InteractionKind =
  'documented_relationship' | 'no_record_found' | 'data_incomplete' | 'unsupported_input'

export type InteractionSignal = {
  id: string
  sourceEntityId: string
  sourceLabel: string
  targetEntityId: string
  targetLabel: string
  relationshipType: string
  kind: InteractionKind
  summary: string
  status: AlchemyDataStatus
  citations: readonly Citation[]
}

export type SourceConflict = {
  id: string
  field: string
  summary: string
  alternatives: readonly string[]
  citations: readonly Citation[]
}

export type ReviewStatusCount = {
  status: ReviewStatus
  count: number
}

export type FormulaAnalysisResult = {
  algorithmVersion: string
  dataVersion?: string
  status: AlchemyDataStatus
  normalizedIngredients: readonly NormalizedIngredient[]
  duplicateIngredients: readonly DuplicateIngredient[]
  preparationVariants: readonly PreparationVariantSignal[]
  natureDistribution: readonly DistributionDatum[]
  flavorDistribution: readonly DistributionDatum[]
  channelDistribution: readonly DistributionDatum[]
  categoryDistribution: readonly DistributionDatum[]
  documentedActions: readonly SourceClaim[]
  documentedPatterns: readonly SourceClaim[]
  interactions: readonly InteractionSignal[]
  sourceConflicts: readonly SourceConflict[]
  missingData: readonly string[]
  warnings: readonly string[]
  sourceCoveragePercent?: number
  reviewStatusBreakdown: readonly ReviewStatusCount[]
}

export type PairwiseOverlap = {
  formulaAId: string
  formulaALabel: string
  formulaBId: string
  formulaBLabel: string
  sharedIngredientIds: readonly string[]
  sharedIngredientLabels: readonly string[]
  jaccardSimilarity?: number
}

export type ComparedIngredient = {
  herbMaterialId: string
  herbDisplayName: string
  formulaIds: readonly string[]
}

export type FormulaActionComparison = {
  label: string
  formulaIds: readonly string[]
  status: AlchemyDataStatus
}

export type FormulaComparisonResult = {
  algorithmVersion: string
  dataVersion?: string
  status: AlchemyDataStatus
  formulaIds: readonly string[]
  pairwiseOverlap: readonly PairwiseOverlap[]
  sharedIngredients: readonly ComparedIngredient[]
  uniqueIngredientsByFormula: Readonly<Record<string, readonly ComparedIngredient[]>>
  repeatedIngredients: readonly ComparedIngredient[]
  preparationDifferences: readonly PreparationVariantSignal[]
  combinedDistributions: readonly DistributionDatum[]
  sharedActions: readonly FormulaActionComparison[]
  distinctActions: readonly FormulaActionComparison[]
  sharedPatterns: readonly FormulaActionComparison[]
  distinctPatterns: readonly FormulaActionComparison[]
  interactionSignals: readonly InteractionSignal[]
  conflicts: readonly SourceConflict[]
  missingData: readonly string[]
  warnings: readonly string[]
}

export type TextLinkedEntity = {
  id: string
  label: string
  entityType: 'herb' | 'formula' | 'category' | 'source'
}

export type TextPassageResult = {
  id: string
  documentId: string
  documentTitle: string
  chapter?: string
  section?: string
  locator: string
  language: string
  text: string
  matchedTerms: readonly string[]
  linkedEntities: readonly TextLinkedEntity[]
  reviewStatus: ReviewStatus
  status: AlchemyDataStatus
  citation: Citation
}

export type EntityRelationship = {
  id: string
  sourceEntityId: string
  sourceLabel: string
  targetEntityId: string
  targetLabel: string
  relationshipType: string
  direction: 'outgoing' | 'incoming' | 'bidirectional'
  status: AlchemyDataStatus
  citations: readonly Citation[]
}

export type EntityNeighborhood = {
  entityId: string
  entityLabel: string
  status: AlchemyDataStatus
  relationships: readonly EntityRelationship[]
  missingRelationshipTypes: readonly string[]
}

export type RetrievalContextInput = {
  passageIds: readonly string[]
  characterBudget: number
}

export type RetrievalGraphFact = {
  id: string
  subject: string
  predicate: string
  object: string
  status: AlchemyDataStatus
  citationIds: readonly string[]
}

export type RetrievalSourceSummary = {
  sourceTitle: string
  passageCount: number
  reviewStatuses: readonly ReviewStatus[]
}

export type RetrievalContextResult = {
  id: string
  status: AlchemyDataStatus
  passages: readonly TextPassageResult[]
  citations: readonly Citation[]
  matchedEntities: readonly TextLinkedEntity[]
  graphFacts: readonly RetrievalGraphFact[]
  unresolvedAmbiguities: readonly string[]
  characterBudget: number
  characterCount: number
  sourceSummary: readonly RetrievalSourceSummary[]
}

export type PaginatedResult<T> = {
  items: readonly T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  status: AlchemyDataStatus
  partial: boolean
}

export type AlchemyFilterOptions = {
  thermalNatures: readonly string[]
  flavors: readonly string[]
  channels: readonly string[]
  categories: readonly string[]
  actions: readonly string[]
  sources: readonly string[]
  reviewStatuses: readonly ReviewStatus[]
  languages: readonly string[]
  documents: readonly string[]
}

export type AlchemyProviderCapabilities = {
  providerId: string
  canSearchHerbs: boolean
  canSearchFormulas: boolean
  canAnalyzeFormulas: boolean
  canCompareFormulas: boolean
  canSearchTexts: boolean
  canBuildRetrievalContext: boolean
  canExploreRelationships: boolean
  maxComparisonFormulas: number
  supportedUnits: readonly string[]
  filters: AlchemyFilterOptions
}

export type AlchemyProviderConnectionState =
  'demo' | 'connected' | 'degraded' | 'disconnected' | 'not_configured'

export type AlchemyProviderStatus = {
  providerId: string
  label: string
  connection: AlchemyProviderConnectionState
  dataStatus: AlchemyDataStatus
  detail: string
  checkedAtIso: string
}

export type HerbSearchInput = {
  query: string
  page?: number
  pageSize?: number
  thermalNature?: string
  flavor?: string
  channel?: string
  category?: string
  action?: string
  source?: string
  reviewStatus?: ReviewStatus
}

export type FormulaSearchInput = {
  query: string
  page?: number
  pageSize?: number
  category?: string
  ingredientId?: string
  action?: string
  pattern?: string
  source?: string
  reviewStatus?: ReviewStatus
}

export type TextSearchInput = {
  query: string
  page?: number
  pageSize?: number
  language?: string
  source?: string
  documentId?: string
  reviewStatus?: ReviewStatus
}

export type AlchemyUiError = {
  code: string
  title: string
  detail: string
  requestId?: string
  retryable: boolean
  fieldErrors?: readonly {
    field: string
    message: string
  }[]
}

export type AlchemyDataMode = 'demo' | 'api'
