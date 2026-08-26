import { hasValidSession } from './session.ts'
import type { PromptLabEnv, WorkerContext } from './types.ts'

const JSON_HEADERS = {
  'Cache-Control': 'no-store, private',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export function errorResponse(error: string, status: number) {
  return jsonResponse({ error }, status)
}

export function isAllowedOriginRequest(request: Request, env: PromptLabEnv) {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  const allowedOrigins = new Set(
    (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((allowedOrigin) => allowedOrigin.trim())
      .filter(Boolean),
  )
  return (
    (!fetchSite || ['same-origin', 'same-site', 'none'].includes(fetchSite)) &&
    (!origin || origin === new URL(request.url).origin || allowedOrigins.has(origin))
  )
}

export async function requireSession(context: WorkerContext<PromptLabEnv>) {
  if (!isAllowedOriginRequest(context.request, context.env)) {
    return errorResponse('Cross-origin requests are not allowed.', 403)
  }
  if (!(await hasValidSession(context.request, context.env))) {
    return errorResponse(
      'Your private workspace session has expired. Enter the password again.',
      401,
    )
  }
  return null
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (contentLength > 12_000) {
    throw new Error('Request body is too large.')
  }
  return request.json()
}
