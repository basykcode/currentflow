import type {
  AlchemyProviderCapabilities,
  AlchemyProviderStatus,
  EntityNeighborhood,
  FormulaAnalysisResult,
  FormulaComparisonResult,
  FormulaDetail,
  FormulaDraft,
  FormulaSearchInput,
  FormulaSummary,
  HerbDetail,
  HerbSearchInput,
  HerbSummary,
  PaginatedResult,
  RetrievalContextInput,
  RetrievalContextResult,
  TextPassageResult,
  TextSearchInput,
} from './types'

export interface AlchemyProvider {
  getStatus(signal?: AbortSignal): Promise<AlchemyProviderStatus>
  getCapabilities(signal?: AbortSignal): Promise<AlchemyProviderCapabilities>
  searchHerbs(input: HerbSearchInput, signal?: AbortSignal): Promise<PaginatedResult<HerbSummary>>
  getHerb(herbId: string, signal?: AbortSignal): Promise<HerbDetail>
  searchFormulas(
    input: FormulaSearchInput,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<FormulaSummary>>
  getFormula(formulaId: string, signal?: AbortSignal): Promise<FormulaDetail>
  analyzeFormula(formula: FormulaDraft, signal?: AbortSignal): Promise<FormulaAnalysisResult>
  compareFormulas(
    formulas: readonly FormulaDraft[],
    signal?: AbortSignal,
  ): Promise<FormulaComparisonResult>
  searchTexts(
    input: TextSearchInput,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<TextPassageResult>>
  getEntityNeighborhood(entityId: string, signal?: AbortSignal): Promise<EntityNeighborhood>
  buildRetrievalContext(
    input: RetrievalContextInput,
    signal?: AbortSignal,
  ): Promise<RetrievalContextResult>
}
