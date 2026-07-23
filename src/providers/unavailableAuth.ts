import type { AuthService, AuthState } from '@/domain/auth/types'

export class UnavailableAuthService implements AuthService {
  async getState(): Promise<AuthState> {
    return Promise.resolve({ status: 'unavailable', user: null })
  }

  async signOut(): Promise<void> {
    return Promise.resolve()
  }
}
