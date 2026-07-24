import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

import { normalizeAlchemyError } from '../domain/errors'
import type { AlchemyUiError } from '../domain/types'

export type AsyncResourceState = 'idle' | 'loading' | 'success' | 'error'

export const useAsyncResource = <T>() => {
  const data = shallowRef<T | null>(null)
  const error = shallowRef<AlchemyUiError | null>(null)
  const state = ref<AsyncResourceState>('idle')
  let controller: AbortController | null = null
  let requestSequence = 0

  const run = async (loader: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    controller?.abort()
    controller = new AbortController()
    const requestId = ++requestSequence
    state.value = 'loading'
    error.value = null

    try {
      const result = await loader(controller.signal)
      if (requestId !== requestSequence) return null
      data.value = result
      state.value = 'success'
      return result
    } catch (caughtError) {
      if (requestId !== requestSequence) return null
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        state.value = data.value ? 'success' : 'idle'
        return null
      }
      error.value = normalizeAlchemyError(caughtError)
      state.value = 'error'
      return null
    }
  }

  const cancel = () => {
    requestSequence += 1
    controller?.abort()
    controller = null
    if (state.value === 'loading') state.value = data.value ? 'success' : 'idle'
  }

  const clear = () => {
    cancel()
    data.value = null
    error.value = null
    state.value = 'idle'
  }

  onBeforeUnmount(cancel)

  return {
    data,
    error,
    state,
    loading: computed(() => state.value === 'loading'),
    hasData: computed(() => data.value !== null),
    run,
    cancel,
    clear,
  }
}
