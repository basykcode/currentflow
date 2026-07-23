import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { AuthState } from '@/domain/auth/types'

export const useIdentityStore = defineStore('identity', () => {
  const state = ref<AuthState>({ status: 'unauthenticated', user: null })

  return { state }
})
