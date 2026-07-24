import type { InjectionKey, Ref } from 'vue'
import { computed, inject, provide, readonly } from 'vue'

import type { AlchemyProvider } from '../domain/provider'
import type {
  AlchemyProviderCapabilities,
  AlchemyProviderStatus,
  AlchemyUiError,
} from '../domain/types'
import { useAsyncResource } from './useAsyncResource'

export type AlchemyEnvironment = {
  status: Readonly<Ref<AlchemyProviderStatus | null>>
  capabilities: Readonly<Ref<AlchemyProviderCapabilities | null>>
  error: Readonly<Ref<AlchemyUiError | null>>
  loading: Readonly<Ref<boolean>>
  refresh: () => Promise<void>
}

const ALCHEMY_ENVIRONMENT_KEY: InjectionKey<AlchemyEnvironment> = Symbol('AlchemyEnvironment')

export const provideAlchemyEnvironment = (provider: AlchemyProvider): AlchemyEnvironment => {
  const resource = useAsyncResource<{
    status: AlchemyProviderStatus
    capabilities: AlchemyProviderCapabilities
  }>()

  const refresh = async () => {
    await resource.run(async (signal) => {
      const [status, capabilities] = await Promise.all([
        provider.getStatus(signal),
        provider.getCapabilities(signal),
      ])
      return { status, capabilities }
    })
  }

  const environment: AlchemyEnvironment = {
    status: computed(() => resource.data.value?.status ?? null),
    capabilities: computed(() => resource.data.value?.capabilities ?? null),
    error: readonly(resource.error),
    loading: readonly(resource.loading),
    refresh,
  }

  provide(ALCHEMY_ENVIRONMENT_KEY, environment)
  return environment
}

export const useAlchemyEnvironment = (): AlchemyEnvironment => {
  const environment = inject(ALCHEMY_ENVIRONMENT_KEY)
  if (!environment) throw new Error('Alchemy environment was not provided.')
  return environment
}
