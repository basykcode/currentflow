import type { PromptLabEnv } from './types.ts'

export const SESSION_COOKIE = '__Host-current-gene-keys-lab'
const SESSION_LIFETIME_SECONDS = 12 * 60 * 60
const encoder = new TextEncoder()

type SessionPayload = {
  exp: number
  scope: 'gene-keys-prompt-lab'
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '')
}

const fromBase64Url = (value: string) => {
  const padded = value
    .replace(/-/gu, '+')
    .replace(/_/gu, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function createSessionToken(secret: string, now = Date.now()) {
  const payload: SessionPayload = {
    exp: Math.floor(now / 1_000) + SESSION_LIFETIME_SECONDS,
    scope: 'gene-keys-prompt-lab',
  }
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload))
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string, secret: string, now = Date.now()) {
  const [encodedPayload, encodedSignature, extra] = token.split('.')
  if (!encodedPayload || !encodedSignature || extra) {
    return false
  }

  try {
    const key = await importHmacKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    )
    if (!valid) {
      return false
    }

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload)),
    ) as Partial<SessionPayload>
    return (
      payload.scope === 'gene-keys-prompt-lab' &&
      typeof payload.exp === 'number' &&
      payload.exp > Math.floor(now / 1_000)
    )
  } catch {
    return false
  }
}

export function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  for (const pair of cookieHeader.split(';')) {
    const [cookieName, ...valueParts] = pair.trim().split('=')
    if (cookieName === name) {
      return valueParts.join('=')
    }
  }
  return null
}

export async function hasValidSession(request: Request, env: PromptLabEnv) {
  const token = getCookie(request, SESSION_COOKIE)
  return token ? verifySessionToken(token, env.PROMPT_LAB_SESSION_SECRET) : false
}

export const sessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_LIFETIME_SECONDS}; HttpOnly; Secure; SameSite=Strict`

export const expiredSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`

export async function passwordsMatch(candidate: string, expected: string) {
  const [candidateDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const candidateBytes = new Uint8Array(candidateDigest)
  const expectedBytes = new Uint8Array(expectedDigest)
  let difference = 0
  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= (candidateBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0)
  }
  return difference === 0
}
