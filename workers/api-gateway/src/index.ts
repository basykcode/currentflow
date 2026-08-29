import { handlePromptLabRequest } from '../../../server/gene-keys-prompt-lab/worker.ts'
import type { PromptLabEnv } from '../../../server/gene-keys-prompt-lab/types.ts'

import {
  API_PREFIX,
  MAX_REQUEST_BODY_BYTES,
  PROMPT_LAB_PREFIX,
  declaredBodyTooLarge,
  isPublicCacheCandidate,
  routePolicy,
  type RoutePolicy,
} from './policy.ts'

const STORED_CACHE_CONTROL_HEADER = 'X-Current-Flow-Origin-Cache-Control'
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

export type GatewayEnvironment = Partial<PromptLabEnv> & {
  ORIGIN_BASE_URL?: string
  CURRENT_EDGE_ORIGIN_TOKEN?: string
  ORIGIN_TOKEN?: string
}

interface CacheLike {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void
}

interface GatewayPlatform {
  cache?: CacheLike
  fetcher?: (request: Request) => Promise<Response>
  logger?: (event: Readonly<Record<string, unknown>>) => void
}

interface CloudflareCacheStorage extends CacheStorage {
  readonly default: Cache
}

type BoundedBodyResult =
  { status: 'ok'; body: ArrayBuffer | null } | { status: 'too-large' } | { status: 'unreadable' }

async function boundedRequestBody(request: Request): Promise<BoundedBodyResult> {
  if (request.method === 'GET' || request.method === 'HEAD' || request.body === null) {
    return { status: 'ok', body: null }
  }
  const chunks: Uint8Array[] = []
  const reader = request.body.getReader()
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel()
        return { status: 'too-large' }
      }
      chunks.push(value)
    }
  } catch {
    return { status: 'unreadable' }
  }

  const body = new ArrayBuffer(total)
  const bytes = new Uint8Array(body)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { status: 'ok', body }
}

function problem(
  status: number,
  code: string,
  title: string,
  detail: string,
  requestId: string,
): Response {
  return new Response(
    JSON.stringify({
      type: `https://current-flow.net/problems/${code}`,
      title,
      status,
      code,
      detail,
      requestId,
      errors: [],
    }),
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/problem+json',
        'X-Request-ID': requestId,
        'X-Current-Flow-Gateway': 'cloudflare-worker',
      },
    },
  )
}

function requestId(request: Request): string {
  const incoming = request.headers.get('X-Request-ID') ?? ''
  return /^[A-Za-z0-9._:-]{1,128}$/.test(incoming) ? incoming : crypto.randomUUID()
}

function allowedOrigins(env: GatewayEnvironment): ReadonlySet<string> {
  return new Set(
    (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

function varyWithoutOrigin(value: string): string {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== 'origin')
    .join(', ')
}

function applyCors(response: Response, request: Request, env: GatewayEnvironment): Response {
  const origin = request.headers.get('Origin')
  if (origin && allowedOrigins(env).has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    const vary = response.headers.get('Vary')
    const values = new Set(
      (vary ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
    values.add('Origin')
    response.headers.set('Vary', [...values].join(', '))
  }
  return response
}

function applyPromptLabCors(
  response: Response,
  request: Request,
  env: GatewayEnvironment,
): Response {
  applyCors(response, request, env)
  if (response.headers.has('Access-Control-Allow-Origin')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

function promptLabPreflight(request: Request, env: GatewayEnvironment): Response {
  const origin = request.headers.get('Origin')
  if (!origin || !allowedOrigins(env).has(origin)) {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '600',
      'Cache-Control': 'no-store',
    },
  })
}

function removeOriginSpecificHeaders(response: Response): void {
  response.headers.delete('Access-Control-Allow-Credentials')
  response.headers.delete('Access-Control-Allow-Origin')
  const vary = response.headers.get('Vary')
  if (vary) {
    const sanitized = varyWithoutOrigin(vary)
    if (sanitized) response.headers.set('Vary', sanitized)
    else response.headers.delete('Vary')
  }
}

function stripHopByHop(headers: Headers): void {
  for (const name of HOP_BY_HOP_HEADERS) headers.delete(name)
}

function applySecurityHeaders(response: Response): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Frame-Options', 'DENY')
}

function originHeaders(request: Request, env: GatewayEnvironment, id: string): Headers {
  const headers = new Headers(request.headers)
  stripHopByHop(headers)
  headers.set('X-Request-ID', id)
  headers.delete('X-Current-Flow-Origin-Token')
  const originToken = env.CURRENT_EDGE_ORIGIN_TOKEN ?? env.ORIGIN_TOKEN
  if (originToken) headers.set('X-Current-Flow-Origin-Token', originToken)
  return headers
}

function effectiveCacheControl(request: Request, response: Response, policy: RoutePolicy): string {
  if (response.status >= 400) return 'no-store'
  if (
    request.headers.has('Authorization') ||
    request.headers.has('Cookie') ||
    response.headers.has('Set-Cookie') ||
    policy.endpointClass === 'private-no-store' ||
    policy.endpointClass === 'administrative'
  ) {
    return 'private, no-store'
  }
  if (policy.endpointClass !== 'public-cacheable') return 'no-store'
  return response.headers.get('Cache-Control') ?? 'no-store'
}

function emitLog(
  logger: (event: Readonly<Record<string, unknown>>) => void,
  started: number,
  request: Request,
  requestIdValue: string,
  policy: RoutePolicy,
  response: Response,
): void {
  logger({
    timestamp: new Date().toISOString(),
    service: 'current-flow-api-gateway',
    requestId: requestIdValue,
    method: request.method,
    status: response.status,
    durationMs: Math.round((performance.now() - started) * 1000) / 1000,
    cacheStatus: response.headers.get('X-Current-Flow-Cache') ?? 'BYPASS',
    endpointClass: policy.endpointClass,
    ratePolicyClass: policy.rateClass,
  })
}

const defaultLogger = (event: Readonly<Record<string, unknown>>): void => {
  console.log(JSON.stringify(event))
}

export async function handleRequest(
  request: Request,
  env: GatewayEnvironment,
  ctx: ExecutionContextLike,
  platform: GatewayPlatform = {},
): Promise<Response> {
  const started = performance.now()
  const id = requestId(request)
  const incomingUrl = new URL(request.url)
  const policy = routePolicy(request.method, incomingUrl.pathname)
  const logger = platform.logger ?? defaultLogger

  const finish = (response: Response): Response => {
    response.headers.set('X-Request-ID', id)
    applyCors(response, request, env)
    applySecurityHeaders(response)
    emitLog(logger, started, request, id, policy, response)
    return response
  }

  const finishPromptLab = (response: Response): Response => {
    response.headers.set('X-Request-ID', id)
    response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
    response.headers.set('X-Current-Flow-Cache', 'BYPASS')
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'private, no-store')
    }
    applyPromptLabCors(response, request, env)
    applySecurityHeaders(response)
    emitLog(logger, started, request, id, policy, response)
    return response
  }

  if (incomingUrl.pathname.startsWith(PROMPT_LAB_PREFIX)) {
    if (request.method === 'OPTIONS') {
      return finishPromptLab(promptLabPreflight(request, env))
    }
    try {
      const response = await handlePromptLabRequest({
        request,
        env: env as PromptLabEnv,
      })
      return finishPromptLab(response)
    } catch {
      return finishPromptLab(
        Response.json(
          { error: 'The private workspace is temporarily unavailable.' },
          {
            status: 503,
            headers: { 'Cache-Control': 'private, no-store' },
          },
        ),
      )
    }
  }

  if (!incomingUrl.pathname.startsWith(API_PREFIX)) {
    return finish(
      problem(
        404,
        'gateway_route_not_found',
        'Gateway route not found',
        'Only Current Flow API routes are available.',
        id,
      ),
    )
  }
  if (declaredBodyTooLarge(request)) {
    return finish(
      problem(
        413,
        'request_too_large',
        'Request body is too large',
        'The declared request body exceeds the gateway limit.',
        id,
      ),
    )
  }
  const requestBody = await boundedRequestBody(request)
  if (requestBody.status === 'too-large') {
    return finish(
      problem(
        413,
        'request_too_large',
        'Request body is too large',
        'The streamed request body exceeds the gateway limit.',
        id,
      ),
    )
  }
  if (requestBody.status === 'unreadable') {
    return finish(
      problem(
        400,
        'request_body_unreadable',
        'Request body is unreadable',
        'The gateway could not read the request body.',
        id,
      ),
    )
  }

  const configuredOrigin = env.ORIGIN_BASE_URL
  if (!configuredOrigin) {
    return finish(
      problem(
        500,
        'gateway_configuration_error',
        'Gateway configuration error',
        'The API origin is not configured.',
        id,
      ),
    )
  }

  let originBase: URL
  try {
    originBase = new URL(configuredOrigin)
  } catch {
    return finish(
      problem(
        500,
        'gateway_configuration_error',
        'Gateway configuration error',
        'The API origin is not configured.',
        id,
      ),
    )
  }
  if (originBase.host === incomingUrl.host) {
    return finish(
      problem(
        500,
        'gateway_origin_recursion',
        'Gateway configuration error',
        'The API origin cannot be the public gateway hostname.',
        id,
      ),
    )
  }

  const originUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, originBase)
  const cache = platform.cache ?? (caches as CloudflareCacheStorage).default
  const fetcher = platform.fetcher ?? fetch
  const cacheKey = new Request(incomingUrl.toString(), { method: 'GET' })
  const cacheCandidate = isPublicCacheCandidate(request, policy)

  if (cacheCandidate) {
    const cached = await cache.match(cacheKey)
    if (cached) {
      const response = new Response(cached.body, cached)
      const originCacheControl = response.headers.get(STORED_CACHE_CONTROL_HEADER)
      if (originCacheControl) response.headers.set('Cache-Control', originCacheControl)
      response.headers.delete(STORED_CACHE_CONTROL_HEADER)
      response.headers.set('X-Current-Flow-Cache', 'HIT')
      response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
      return finish(response)
    }
  }

  let originResponse: Response
  try {
    const originRequest: RequestInit = {
      method: request.method,
      headers: originHeaders(request, env, id),
      redirect: 'manual',
    }
    if (requestBody.body !== null) originRequest.body = requestBody.body
    originResponse = await fetcher(new Request(originUrl.toString(), originRequest))
  } catch {
    return finish(
      problem(
        502,
        'origin_unavailable',
        'API origin unavailable',
        'The gateway could not reach the API origin.',
        id,
      ),
    )
  }

  const response = new Response(originResponse.body, originResponse)
  removeOriginSpecificHeaders(response)
  stripHopByHop(response.headers)
  response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
  response.headers.set('X-Current-Flow-Cache', cacheCandidate ? 'MISS' : 'BYPASS')
  response.headers.delete(STORED_CACHE_CONTROL_HEADER)
  response.headers.delete('Server')
  response.headers.set('Cache-Control', effectiveCacheControl(request, response, policy))

  const cacheControl = response.headers.get('Cache-Control') ?? ''
  if (
    cacheCandidate &&
    originResponse.status === 200 &&
    cacheControl.startsWith('public') &&
    !response.headers.has('Set-Cookie')
  ) {
    const cachedResponse = response.clone()
    cachedResponse.headers.set(STORED_CACHE_CONTROL_HEADER, cacheControl)
    ctx.waitUntil(cache.put(cacheKey, cachedResponse))
  }
  return finish(response)
}

export default {
  fetch(request: Request, env: GatewayEnvironment, ctx: ExecutionContextLike): Promise<Response> {
    return handleRequest(request, env, ctx)
  },
}
