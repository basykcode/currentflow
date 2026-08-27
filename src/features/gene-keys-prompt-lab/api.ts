import type {
  GeneKeysPromptLabGeneration,
  GeneKeysPromptLabRequest,
  GeneKeysPromptLabUser,
} from '@/features/gene-keys-prompt-lab/domain'

export type GeneKeysPromptLabWorkspace = {
  users: GeneKeysPromptLabUser[]
  history: GeneKeysPromptLabGeneration[]
}

type SessionResponse = {
  authenticated: boolean
}

type ApiErrorBody = {
  error?: string
}

const API_ORIGIN = (import.meta.env.VITE_PROMPT_LAB_API_BASE_URL ?? '').replace(/\/$/u, '')
const endpoint = (path: string) => `${API_ORIGIN}/api/gene-keys-lab/${path}`

export class GeneKeysPromptLabApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GeneKeysPromptLabApiError'
    this.status = status
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'The prompt lab could not complete that request.'

    try {
      const body = (await response.json()) as ApiErrorBody
      if (typeof body.error === 'string' && body.error.trim()) {
        message = body.error
      }
    } catch {
      // Preserve the safe fallback when a proxy returns non-JSON error text.
    }

    throw new GeneKeysPromptLabApiError(message, response.status)
  }

  return (await response.json()) as T
}

export async function getPromptLabSession(): Promise<boolean> {
  const response = await fetch(endpoint('session'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  const body = await parseResponse<SessionResponse>(response)
  return body.authenticated
}

export async function logInToPromptLab(password: string): Promise<void> {
  const response = await fetch(endpoint('login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ password }),
  })
  await parseResponse<SessionResponse>(response)
}

export async function logOutOfPromptLab(): Promise<void> {
  const response = await fetch(endpoint('logout'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await parseResponse<SessionResponse>(response)
}

export async function generatePromptLabCommentary(
  request: GeneKeysPromptLabRequest,
): Promise<GeneKeysPromptLabGeneration> {
  const response = await fetch(endpoint('generate'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  return parseResponse<GeneKeysPromptLabGeneration>(response)
}

export async function getPromptLabWorkspace(): Promise<GeneKeysPromptLabWorkspace> {
  const response = await fetch(endpoint('workspace'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  return parseResponse<GeneKeysPromptLabWorkspace>(response)
}

export async function createPromptLabUser(name: string): Promise<GeneKeysPromptLabUser> {
  const response = await fetch(endpoint('users'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name }),
  })
  return parseResponse<GeneKeysPromptLabUser>(response)
}
