import type {
  GeneKeysPromptLabGeneration,
  GeneKeysPromptLabRequest,
} from '@/features/gene-keys-prompt-lab/domain'

type SessionResponse = {
  authenticated: boolean
}

type ApiErrorBody = {
  error?: string
}

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
  const response = await fetch('/api/gene-keys-lab/session', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  const body = await parseResponse<SessionResponse>(response)
  return body.authenticated
}

export async function logInToPromptLab(password: string): Promise<void> {
  const response = await fetch('/api/gene-keys-lab/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ password }),
  })
  await parseResponse<SessionResponse>(response)
}

export async function logOutOfPromptLab(): Promise<void> {
  const response = await fetch('/api/gene-keys-lab/logout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  await parseResponse<SessionResponse>(response)
}

export async function generatePromptLabCommentary(
  request: GeneKeysPromptLabRequest,
): Promise<GeneKeysPromptLabGeneration> {
  const response = await fetch('/api/gene-keys-lab/generate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  return parseResponse<GeneKeysPromptLabGeneration>(response)
}
