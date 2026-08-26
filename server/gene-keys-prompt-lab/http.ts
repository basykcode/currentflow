import { hasValidSession } from './session'
import type { PagesFunctionContext, PromptLabEnv } from './types'

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

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  return (
    (!fetchSite || fetchSite === 'same-origin' || fetchSite === 'none') &&
    (!origin || origin === new URL(request.url).origin)
  )
}

export async function requireSession(context: PagesFunctionContext<PromptLabEnv>) {
  if (!isSameOriginRequest(context.request)) {
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
