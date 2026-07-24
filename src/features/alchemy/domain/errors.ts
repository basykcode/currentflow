import type { AlchemyUiError } from './types'

export class AlchemyProviderError extends Error {
  readonly uiError: AlchemyUiError

  constructor(uiError: AlchemyUiError) {
    super(uiError.detail)
    this.name = 'AlchemyProviderError'
    this.uiError = uiError
  }
}

export const normalizeAlchemyError = (error: unknown): AlchemyUiError => {
  if (error instanceof AlchemyProviderError) return error.uiError

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'request_cancelled',
      title: 'Request cancelled',
      detail: 'The previous request was replaced by a newer one.',
      retryable: true,
    }
  }

  return {
    code: 'alchemy_unavailable',
    title: 'Alchemy data unavailable',
    detail: 'The requested research data could not be loaded. No information was inferred.',
    retryable: true,
  }
}
