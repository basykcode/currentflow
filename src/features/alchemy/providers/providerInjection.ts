import type { App, InjectionKey } from 'vue'
import { inject } from 'vue'

import type { AlchemyProvider } from '../domain/provider'
import type { AlchemyDataMode } from '../domain/types'
import { ContractUnavailableAlchemyProvider } from './contractUnavailableAlchemyProvider'
import { DemoAlchemyProvider } from './demoAlchemyProvider'
import { HttpAlchemyProvider } from './httpAlchemyProvider'

const ALCHEMY_PROVIDER_KEY: InjectionKey<AlchemyProvider> = Symbol('AlchemyProvider')

const configuredMode = import.meta.env.VITE_ALCHEMY_DATA_MODE?.trim().toLocaleLowerCase()

export const alchemyDataMode: AlchemyDataMode =
  configuredMode === 'api' ? 'api' : configuredMode === 'demo' || !configuredMode ? 'demo' : 'api'

const apiBaseUrl = import.meta.env.VITE_ALCHEMY_API_BASE_URL?.trim()
const parsedTimeout = Number(import.meta.env.VITE_ALCHEMY_API_TIMEOUT_MS)

export const createConfiguredAlchemyProvider = (): AlchemyProvider => {
  if (alchemyDataMode === 'demo') return new DemoAlchemyProvider()
  if (!apiBaseUrl)
    return new ContractUnavailableAlchemyProvider('Alchemy API URL is not configured.')
  try {
    return new HttpAlchemyProvider({
      baseUrl: apiBaseUrl,
      ...(Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? { timeoutMs: parsedTimeout } : {}),
    })
  } catch {
    return new ContractUnavailableAlchemyProvider('Alchemy API configuration is invalid.')
  }
}

export const installAlchemyProvider = (app: App, provider = createConfiguredAlchemyProvider()) => {
  app.provide(ALCHEMY_PROVIDER_KEY, provider)
}

export const useAlchemyProvider = (): AlchemyProvider => {
  const provider = inject(ALCHEMY_PROVIDER_KEY)
  if (!provider) {
    throw new Error('Alchemy provider was not installed.')
  }
  return provider
}

export const provideAlchemyProviderForTest = (app: App, provider: AlchemyProvider) => {
  app.provide(ALCHEMY_PROVIDER_KEY, provider)
}
