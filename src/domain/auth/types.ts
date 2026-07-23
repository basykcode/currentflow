export type AuthStatus = 'unauthenticated' | 'authenticated' | 'unavailable'

export type UserIdentity = {
  id: string
  displayName: string
}

export type AuthState = {
  status: AuthStatus
  user: UserIdentity | null
}

export interface AuthService {
  getState(): Promise<AuthState>
  signOut(): Promise<void>
}
