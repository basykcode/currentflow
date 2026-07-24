import { AlchemyProviderError } from '../domain/errors'
import type { AlchemyProvider } from '../domain/provider'
import type { AlchemyProviderCapabilities } from '../domain/types'

const unavailableError = (detail: string): AlchemyProviderError =>
  new AlchemyProviderError({
    code: 'alchemy_api_not_configured',
    title: 'Alchemy API is not configured',
    detail,
    retryable: false,
  })

const unavailableCapabilities: AlchemyProviderCapabilities = {
  providerId: 'contract-unavailable',
  canSearchHerbs: false,
  canSearchFormulas: false,
  canAnalyzeFormulas: false,
  canCompareFormulas: false,
  canSearchTexts: false,
  canBuildRetrievalContext: false,
  canExploreRelationships: false,
  maxComparisonFormulas: 0,
  supportedUnits: [],
  filters: {
    thermalNatures: [],
    flavors: [],
    channels: [],
    categories: [],
    actions: [],
    sources: [],
    reviewStatuses: [],
    languages: [],
    documents: [],
  },
}

export class ContractUnavailableAlchemyProvider implements AlchemyProvider {
  constructor(private readonly detail = 'API mode is selected, but its URL is not configured.') {}

  async getStatus() {
    return Promise.resolve({
      providerId: 'contract-unavailable',
      label: 'Alchemy API not configured',
      connection: 'not_configured' as const,
      dataStatus: 'unavailable' as const,
      detail: this.detail,
      checkedAtIso: new Date().toISOString(),
    })
  }

  async getCapabilities() {
    return Promise.resolve(structuredClone(unavailableCapabilities))
  }

  searchHerbs(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  getHerb(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  searchFormulas(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  getFormula(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  analyzeFormula(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  compareFormulas(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  searchTexts(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  getEntityNeighborhood(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }

  buildRetrievalContext(): Promise<never> {
    return Promise.reject(unavailableError(this.detail))
  }
}
