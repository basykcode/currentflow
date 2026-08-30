import createClient, { type Client } from 'openapi-fetch'

import type { paths } from '../api/generated/schema'
import {
  formulaDraftToRequest,
  mapAnalysis,
  mapComparison,
  mapFormulaDetail,
  mapFormulaPage,
  mapHerbDetail,
  mapHerbPage,
  mapNeighborhood,
  mapRetrieval,
  mapTextPage,
} from '../api/mappers'
import { AlchemyProviderError } from '../domain/errors'
import type { AlchemyProvider } from '../domain/provider'
import type {
  AlchemyProviderCapabilities,
  AlchemyProviderStatus,
  AlchemyUiError,
  FormulaDraft,
  FormulaSearchInput,
  HerbSearchInput,
  PaginatedResult,
  RetrievalContextInput,
  ReviewStatus,
  TextPassageResult,
  TextSearchInput,
} from '../domain/types'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_PAGE_SIZE = 25

type HttpAlchemyProviderOptions = {
  baseUrl: string
  timeoutMs?: number
  fetch?: (input: Request) => Promise<Response>
}

type UnknownRecord = Readonly<Record<string, unknown>>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringField = (record: UnknownRecord, field: string): string | undefined =>
  typeof record[field] === 'string' ? record[field] : undefined

const recordArray = (value: unknown): readonly UnknownRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : []

const normalizedBaseUrl = (value: string): string => {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Alchemy API URL must use HTTP or HTTPS.')
  }
  return url.toString().replace(/\/$/, '')
}

const positiveTimeout = (value: number | undefined): number =>
  Number.isFinite(value) && (value ?? 0) > 0 ? Math.round(value as number) : DEFAULT_TIMEOUT_MS

const pageValues = (page?: number, pageSize?: number) => {
  const resolvedPage = Math.max(1, Math.trunc(page ?? 1))
  const resolvedPageSize = Math.min(100, Math.max(1, Math.trunc(pageSize ?? DEFAULT_PAGE_SIZE)))
  return {
    page: resolvedPage,
    pageSize: resolvedPageSize,
    offset: (resolvedPage - 1) * resolvedPageSize,
  }
}

const abortSignal = (caller: AbortSignal | undefined, timeoutMs: number): AbortSignal => {
  const timeout = AbortSignal.timeout(timeoutMs)
  return caller ? AbortSignal.any([caller, timeout]) : timeout
}

const problemError = (
  error: unknown,
  response: Response,
  fallbackTitle = 'Alchemy request failed',
): AlchemyProviderError => {
  const record: UnknownRecord = isRecord(error) ? error : {}
  const status = response.status
  const fieldErrors = [...recordArray(record['errors']), ...recordArray(record['detail'])].map(
    (item) => {
      const location = item['location'] ?? item['loc']
      return {
        field: Array.isArray(location) ? location.map(String).join('.') : 'request',
        message: stringField(item, 'message') ?? stringField(item, 'msg') ?? 'Invalid value.',
      }
    },
  )
  const requestId =
    stringField(record, 'requestId') ?? response.headers.get('x-request-id') ?? undefined
  const uiError: AlchemyUiError = {
    code: stringField(record, 'code') ?? `http_${status}`,
    title: stringField(record, 'title') ?? fallbackTitle,
    detail:
      (typeof record['detail'] === 'string' ? record['detail'] : undefined) ??
      `The Alchemy API returned HTTP ${status}.`,
    ...(requestId ? { requestId } : {}),
    retryable: status === 408 || status === 429 || status >= 500,
    ...(fieldErrors.length ? { fieldErrors } : {}),
  }
  return new AlchemyProviderError(uiError)
}

const networkError = (error: unknown): AlchemyProviderError => {
  const errorName =
    error instanceof DOMException
      ? error.name
      : isRecord(error) && typeof error['name'] === 'string'
        ? error['name']
        : undefined
  if (errorName === 'AbortError') {
    return new AlchemyProviderError({
      code: 'request_cancelled',
      title: 'Request cancelled',
      detail: 'The request was cancelled before the API responded.',
      retryable: true,
    })
  }
  if (errorName === 'TimeoutError') {
    return new AlchemyProviderError({
      code: 'request_timeout',
      title: 'Alchemy API timed out',
      detail: 'The Alchemy API did not respond before the configured timeout.',
      retryable: true,
    })
  }
  return new AlchemyProviderError({
    code: 'alchemy_api_unreachable',
    title: 'Alchemy API unavailable',
    detail: 'The configured Alchemy API could not be reached.',
    retryable: true,
  })
}

const throwMissingData = (): never => {
  throw new AlchemyProviderError({
    code: 'alchemy_contract_mismatch',
    title: 'Alchemy API response is incomplete',
    detail: 'The API response did not contain the data required by its checked-in contract.',
    retryable: false,
  })
}

const reviewStatuses = new Set<ReviewStatus>([
  'synthetic_fixture',
  'machine_imported',
  'human_reviewed',
  'disputed',
  'superseded',
])

export class HttpAlchemyProvider implements AlchemyProvider {
  private readonly client: Client<paths>
  private readonly timeoutMs: number
  private readonly baseUrl: string
  private sourceIdsByTitle = new Map<string, string>()

  constructor(options: HttpAlchemyProviderOptions) {
    this.baseUrl = normalizedBaseUrl(options.baseUrl)
    this.timeoutMs = positiveTimeout(options.timeoutMs)
    this.client = createClient<paths>({
      baseUrl: this.baseUrl,
      ...(options.fetch ? { fetch: options.fetch } : {}),
    })
  }

  private signal(caller?: AbortSignal): AbortSignal {
    return abortSignal(caller, this.timeoutMs)
  }

  private async sourceId(source: string | undefined, signal?: AbortSignal) {
    if (!source) return undefined
    if (!this.sourceIdsByTitle.size) await this.loadSourceOptions(signal)
    return this.sourceIdsByTitle.get(source) ?? source
  }

  private async loadSourceOptions(signal?: AbortSignal): Promise<readonly string[]> {
    try {
      const result = await this.client.GET('/api/v1/sources', {
        params: { query: { offset: 0, limit: 100 } },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      this.sourceIdsByTitle = new Map(
        result.data.data.items.map((source) => [source.title, source.id]),
      )
      return result.data.data.items.map((source) => source.title)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async getStatus(signal?: AbortSignal): Promise<AlchemyProviderStatus> {
    try {
      const [ready, meta] = await Promise.all([
        this.client.GET('/api/v1/health/ready', { signal: this.signal(signal) }),
        this.client.GET('/api/v1/meta', { signal: this.signal(signal) }),
      ])
      if (ready.error || !ready.data) {
        return {
          providerId: 'alchemy-api',
          label: 'Alchemy API',
          connection: 'degraded',
          dataStatus: 'unavailable',
          detail: 'The API is reachable, but its graph dependency is not ready.',
          checkedAtIso: new Date().toISOString(),
        }
      }
      const metaData = meta.data
      if (!metaData) return throwMissingData()
      return {
        providerId: 'alchemy-api',
        label: metaData.serviceName,
        connection: 'connected',
        dataStatus: metaData.activeDataSourceCount > 0 ? 'source_reported' : 'incomplete',
        detail: `API ${metaData.apiVersion}; graph schema ${metaData.graphSchemaVersion}; ${metaData.activeDataSourceCount} active source${metaData.activeDataSourceCount === 1 ? '' : 's'}.`,
        checkedAtIso: new Date().toISOString(),
      }
    } catch (error) {
      const detail =
        error instanceof AlchemyProviderError
          ? error.uiError.detail
          : 'The configured Alchemy API could not be reached.'
      return {
        providerId: 'alchemy-api',
        label: 'Alchemy API',
        connection: 'disconnected',
        dataStatus: 'unavailable',
        detail,
        checkedAtIso: new Date().toISOString(),
      }
    }
  }

  async getCapabilities(signal?: AbortSignal): Promise<AlchemyProviderCapabilities> {
    try {
      const [metaResult, sourceTitles, documentsResult] = await Promise.all([
        this.client.GET('/api/v1/meta', { signal: this.signal(signal) }),
        this.loadSourceOptions(signal),
        this.client.GET('/api/v1/documents', {
          params: { query: { offset: 0, limit: 100 } },
          signal: this.signal(signal),
        }),
      ])
      if (documentsResult.error) throw problemError(documentsResult.error, documentsResult.response)
      const metaData = metaResult.data
      const documentsData = documentsResult.data
      if (!metaData || !documentsData) return throwMissingData()
      const enabled = new Set(metaData.featureFlags.enabled ?? [])
      return {
        providerId: 'alchemy-api',
        canSearchHerbs: enabled.has('graph-retrieval'),
        canSearchFormulas: enabled.has('graph-retrieval'),
        canAnalyzeFormulas: enabled.has('formula-analysis'),
        canCompareFormulas: enabled.has('formula-comparison'),
        canSearchTexts: enabled.has('text-search'),
        canBuildRetrievalContext: enabled.has('graph-retrieval'),
        canExploreRelationships: enabled.has('constrained-exploration'),
        maxComparisonFormulas: 4,
        supportedUnits: ['g', 'mg', 'kg'],
        filters: {
          thermalNatures: [],
          flavors: [],
          channels: [],
          categories: [],
          actions: [],
          sources: sourceTitles,
          reviewStatuses: [...reviewStatuses],
          languages: [...new Set(documentsData.data.items.map((item) => item.language))],
          documents: documentsData.data.items.map((item) => item.id),
        },
      }
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async searchHerbs(input: HerbSearchInput, signal?: AbortSignal) {
    const { offset, pageSize } = pageValues(input.page, input.pageSize)
    try {
      const sourceId = await this.sourceId(input.source, signal)
      const result = await this.client.GET('/api/v1/herbs', {
        params: {
          query: {
            ...(input.query ? { query: input.query } : {}),
            ...(input.thermalNature ? { thermal_nature: input.thermalNature } : {}),
            ...(input.flavor ? { flavor: input.flavor } : {}),
            ...(input.channel ? { channel: input.channel } : {}),
            ...(input.category ? { category: input.category } : {}),
            ...(input.action ? { action: input.action } : {}),
            ...(sourceId ? { source: sourceId } : {}),
            ...(input.reviewStatus && input.reviewStatus !== 'unavailable'
              ? { review_status: input.reviewStatus }
              : {}),
            offset,
            limit: pageSize,
          },
        },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      return mapHerbPage(result.data)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async getHerb(herbId: string, signal?: AbortSignal) {
    try {
      const result = await this.client.GET('/api/v1/herbs/{herb_id}', {
        params: { path: { herb_id: herbId } },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      return mapHerbDetail(result.data)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async searchFormulas(input: FormulaSearchInput, signal?: AbortSignal) {
    const { offset, pageSize } = pageValues(input.page, input.pageSize)
    try {
      const sourceId = await this.sourceId(input.source, signal)
      const result = await this.client.GET('/api/v1/formulas', {
        params: {
          query: {
            ...(input.query ? { query: input.query } : {}),
            ...(input.category ? { category: input.category } : {}),
            ...(input.ingredientId ? { ingredient: input.ingredientId } : {}),
            ...(input.action ? { action: input.action } : {}),
            ...(input.pattern ? { pattern: input.pattern } : {}),
            ...(sourceId ? { source: sourceId } : {}),
            ...(input.reviewStatus && input.reviewStatus !== 'unavailable'
              ? { review_status: input.reviewStatus }
              : {}),
            offset,
            limit: pageSize,
          },
        },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      return mapFormulaPage(result.data)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async getFormula(formulaId: string, signal?: AbortSignal) {
    try {
      const result = await this.client.GET('/api/v1/formulas/{formula_id}', {
        params: { path: { formula_id: formulaId } },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      const ingredientIds = result.data.data.properties?.['ingredientIds']
      const ids = Array.isArray(ingredientIds) ? ingredientIds : []
      const herbs = await Promise.all(
        ids.map(async (herbId) => {
          const herbResult = await this.client.GET('/api/v1/herbs/{herb_id}', {
            params: { path: { herb_id: herbId } },
            signal: this.signal(signal),
          })
          return herbResult.data?.data
        }),
      )
      return mapFormulaDetail(
        result.data,
        new Map(herbs.filter((herb) => herb !== undefined).map((herb) => [herb.id, herb])),
      )
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async analyzeFormula(formula: FormulaDraft, signal?: AbortSignal) {
    try {
      const result = await this.client.POST('/api/v1/formulas/analyze', {
        body: { composition: formulaDraftToRequest(formula) },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response, 'Formula analysis failed')
      if (!result.data) throwMissingData()
      return mapAnalysis(result.data.data, result.data.meta, formula)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async compareFormulas(formulas: readonly FormulaDraft[], signal?: AbortSignal) {
    try {
      const result = await this.client.POST('/api/v1/formulas/compare', {
        body: { compositions: formulas.map(formulaDraftToRequest) },
        signal: this.signal(signal),
      })
      if (result.error)
        throw problemError(result.error, result.response, 'Formula comparison failed')
      if (!result.data) throwMissingData()
      return mapComparison(result.data.data, result.data.meta)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async searchTexts(
    input: TextSearchInput,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<TextPassageResult>> {
    const { page, pageSize, offset } = pageValues(input.page, input.pageSize)
    try {
      const sourceId = await this.sourceId(input.source, signal)
      const result = await this.client.GET('/api/v1/text/search', {
        params: {
          query: {
            q: input.query,
            ...(sourceId ? { source_id: [sourceId] } : {}),
            offset,
            limit: pageSize,
          },
        },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      const documentIds = [
        ...new Set(result.data.data.items.map((item) => item.passage.documentId)),
      ]
      const documents = await Promise.all(
        documentIds.map(async (documentId) => {
          const document = await this.client.GET('/api/v1/documents/{document_id}', {
            params: { path: { document_id: documentId } },
            signal: this.signal(signal),
          })
          return document.data?.data
        }),
      )
      const mapped = mapTextPage(
        result.data,
        new Map(
          documents
            .filter((document) => document !== undefined)
            .map((document) => [document.id, document.title]),
        ),
      )
      const items = mapped.items.filter(
        (item) =>
          (!input.language || item.language === input.language) &&
          (!input.documentId || item.documentId === input.documentId) &&
          (!input.reviewStatus || item.reviewStatus === input.reviewStatus),
      )
      return {
        ...mapped,
        items,
        page,
        partial: mapped.partial || items.length !== mapped.items.length,
      }
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async getEntityNeighborhood(entityId: string, signal?: AbortSignal) {
    try {
      const result = await this.client.GET('/api/v1/graph/entities/{entity_id}/neighborhood', {
        params: { path: { entity_id: entityId }, query: { depth: 1, limit: 100 } },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      return mapNeighborhood(result.data, entityId)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }

  async buildRetrievalContext(input: RetrievalContextInput, signal?: AbortSignal) {
    try {
      const result = await this.client.POST('/api/v1/retrieval/context', {
        body: {
          passageIds: [...input.passageIds],
          maximumCharacterBudget: input.characterBudget,
          maximumPassages: Math.max(1, input.passageIds.length),
        },
        signal: this.signal(signal),
      })
      if (result.error) throw problemError(result.error, result.response)
      if (!result.data) throwMissingData()
      const requestId = result.response.headers.get('x-request-id') ?? result.data.meta.requestId
      if (!requestId) return throwMissingData()
      return mapRetrieval(result.data.data, result.data.meta, requestId)
    } catch (error) {
      if (error instanceof AlchemyProviderError) throw error
      throw networkError(error)
    }
  }
}
