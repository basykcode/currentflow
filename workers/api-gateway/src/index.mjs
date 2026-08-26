import { handlePromptLabRequest } from '../../../server/gene-keys-prompt-lab/worker.ts'

const API_PREFIX = '/api/v1/'
const PROMPT_LAB_PREFIX = '/api/gene-keys-lab/'
const HEALTH_PATHS = new Set(['/api/v1/health/live', '/api/v1/health/ready'])
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

function problem(status, code, title, detail, requestId) {
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

function requestId(request) {
  const incoming = request.headers.get('X-Request-ID') ?? ''
  return /^[A-Za-z0-9._:-]{1,128}$/.test(incoming) ? incoming : crypto.randomUUID()
}

function isPublicCacheCandidate(request, url) {
  const requestCacheControl = request.headers.get('Cache-Control') ?? ''
  return (
    request.method === 'GET' &&
    !HEALTH_PATHS.has(url.pathname) &&
    !request.headers.has('Authorization') &&
    !request.headers.has('Cookie') &&
    !request.headers.has('Range') &&
    !requestCacheControl.includes('no-cache') &&
    !requestCacheControl.includes('no-store') &&
    request.headers.get('Pragma') !== 'no-cache'
  )
}

function allowedOrigins(env) {
  return new Set(
    (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

function varyWithoutOrigin(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== 'origin')
    .join(', ')
}

function applyCors(response, request, env) {
  const origin = request.headers.get('Origin')
  if (origin && allowedOrigins(env).has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    const vary = response.headers.get('Vary')
    response.headers.set('Vary', vary ? `${vary}, Origin` : 'Origin')
  }
  return response
}

function applyPromptLabCors(response, request, env) {
  const origin = request.headers.get('Origin')
  if (origin && allowedOrigins(env).has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    const vary = response.headers.get('Vary')
    response.headers.set('Vary', vary ? `${vary}, Origin` : 'Origin')
  }
  response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
  response.headers.set('X-Current-Flow-Cache', 'BYPASS')
  return response
}

function promptLabPreflight(request, env) {
  const origin = request.headers.get('Origin')
  if (!origin || !allowedOrigins(env).has(origin)) {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }

  return applyPromptLabCors(
    new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '600',
        'Cache-Control': 'no-store',
      },
    }),
    request,
    env,
  )
}

function removeOriginSpecificHeaders(response) {
  response.headers.delete('Access-Control-Allow-Credentials')
  response.headers.delete('Access-Control-Allow-Origin')
  const vary = response.headers.get('Vary')
  if (vary) {
    const sanitized = varyWithoutOrigin(vary)
    if (sanitized) response.headers.set('Vary', sanitized)
    else response.headers.delete('Vary')
  }
}

function originHeaders(request, env, id) {
  const headers = new Headers(request.headers)
  for (const name of HOP_BY_HOP_HEADERS) headers.delete(name)
  headers.set('X-Request-ID', id)
  headers.delete('X-Current-Flow-Origin-Token')
  if (env.ORIGIN_TOKEN) headers.set('X-Current-Flow-Origin-Token', env.ORIGIN_TOKEN)
  return headers
}

export async function handleRequest(request, env, ctx, platform = {}) {
  const id = requestId(request)
  const incomingUrl = new URL(request.url)
  if (incomingUrl.pathname.startsWith(PROMPT_LAB_PREFIX)) {
    if (request.method === 'OPTIONS') {
      return promptLabPreflight(request, env)
    }

    try {
      const response = await handlePromptLabRequest({ request, env })
      return applyPromptLabCors(response, request, env)
    } catch {
      return applyPromptLabCors(
        new Response(
          JSON.stringify({ error: 'The private workspace is temporarily unavailable.' }),
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json; charset=utf-8',
            },
          },
        ),
        request,
        env,
      )
    }
  }

  if (!incomingUrl.pathname.startsWith(API_PREFIX)) {
    return problem(
      404,
      'gateway_route_not_found',
      'Gateway route not found',
      'Only /api/v1 routes are available.',
      id,
    )
  }

  let originBase
  try {
    originBase = new URL(env.ORIGIN_BASE_URL)
  } catch {
    return problem(
      500,
      'gateway_configuration_error',
      'Gateway configuration error',
      'The API origin is not configured.',
      id,
    )
  }
  const originUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, originBase)
  const cache = platform.cache ?? caches.default
  const fetcher = platform.fetcher ?? fetch
  const cacheKey = new Request(incomingUrl.toString(), { method: 'GET' })
  const cacheCandidate = isPublicCacheCandidate(request, incomingUrl)

  if (cacheCandidate) {
    const cached = await cache.match(cacheKey)
    if (cached) {
      const response = new Response(cached.body, cached)
      const originCacheControl = response.headers.get(STORED_CACHE_CONTROL_HEADER)
      if (originCacheControl) response.headers.set('Cache-Control', originCacheControl)
      response.headers.delete(STORED_CACHE_CONTROL_HEADER)
      response.headers.set('X-Current-Flow-Cache', 'HIT')
      response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
      return applyCors(response, request, env)
    }
  }

  let originResponse
  try {
    originResponse = await fetcher(
      new Request(originUrl.toString(), {
        method: request.method,
        headers: originHeaders(request, env, id),
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      }),
    )
  } catch {
    return problem(
      502,
      'origin_unavailable',
      'API origin unavailable',
      'The gateway could not reach the API origin.',
      id,
    )
  }

  const response = new Response(originResponse.body, originResponse)
  removeOriginSpecificHeaders(response)
  response.headers.set('X-Current-Flow-Gateway', 'cloudflare-worker')
  response.headers.set('X-Current-Flow-Cache', cacheCandidate ? 'MISS' : 'BYPASS')
  response.headers.delete(STORED_CACHE_CONTROL_HEADER)
  response.headers.delete('Server')

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
  return applyCors(response, request, env)
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx)
  },
}
