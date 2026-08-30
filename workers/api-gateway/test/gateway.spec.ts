import { describe, expect, it, vi } from 'vitest'

import { handleRequest, type GatewayEnvironment } from '../src/index.ts'
import { MAX_REQUEST_BODY_BYTES, routePolicy } from '../src/policy.ts'

class TestCache {
  readonly entries = new Map<string, Response>()

  constructor(private readonly rewriteCacheControl = false) {}

  match(request: Request): Promise<Response | undefined> {
    return Promise.resolve(this.entries.get(request.url)?.clone())
  }

  put(request: Request, response: Response): Promise<void> {
    const cached = response.clone()
    if (this.rewriteCacheControl) cached.headers.set('Cache-Control', 'public, max-age=14400')
    this.entries.set(request.url, cached)
    return Promise.resolve()
  }
}

const environment: GatewayEnvironment = {
  ORIGIN_BASE_URL: 'https://origin.example',
  ALLOWED_ORIGINS: 'https://current-flow.net,https://www.current-flow.net',
  CURRENT_EDGE_ORIGIN_TOKEN: 'test-only-secret',
}

function context(): { pending: Promise<unknown>[]; waitUntil(promise: Promise<unknown>): void } {
  const pending: Promise<unknown>[] = []
  return { pending, waitUntil: (promise) => pending.push(promise) }
}

const silentLogger = (): void => undefined

describe('Cloudflare API gateway', () => {
  it.each(['/api/v1/explore/query', '/api/v1/retrieval/context'])(
    'registers %s as an explicit graph-retrieval POST',
    (path) => {
      const policy = routePolicy('POST', path)
      expect(policy).toEqual({
        endpointClass: 'public-uncacheable',
        rateClass: 'graph-retrieval',
      })
      expect(policy).not.toEqual(routePolicy('POST', '/api/v1/unregistered'))
    },
  )

  it.each(['/api/v1/explore/query', '/api/v1/retrieval/context'])(
    'forces an origin-public response from %s to no-store',
    async (path) => {
      const cache = new TestCache()
      const response = await handleRequest(
        new Request(`https://gateway.example${path}`, { method: 'POST', body: '{}' }),
        environment,
        context(),
        {
          cache,
          logger: silentLogger,
          fetcher: () =>
            Promise.resolve(
              Response.json({ ok: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } }),
            ),
        },
      )

      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Current-Flow-Cache')).toBe('BYPASS')
      expect(cache.entries.size).toBe(0)
    },
  )

  it('proxies public GETs with query, request ID, and canonical origin token', async () => {
    const seen: Request[] = []
    const ctx = context()
    const response = await handleRequest(
      new Request('https://gateway.example/api/v1/meta?locale=en', {
        headers: { 'X-Request-ID': 'test-request' },
      }),
      environment,
      ctx,
      {
        cache: new TestCache(),
        logger: silentLogger,
        fetcher: (request) => {
          seen.push(request)
          return Promise.resolve(
            Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'public' } }),
          )
        },
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Current-Flow-Gateway')).toBe('cloudflare-worker')
    expect(response.headers.get('X-Request-ID')).toBe('test-request')
    expect(seen[0]?.url).toBe('https://origin.example/api/v1/meta?locale=en')
    expect(seen[0]?.headers.get('X-Request-ID')).toBe('test-request')
    expect(seen[0]?.headers.get('X-Current-Flow-Origin-Token')).toBe('test-only-secret')
    await Promise.all(ctx.pending)
  })

  it('caches only registry-approved public GET responses and restores origin policy', async () => {
    const cache = new TestCache(true)
    const fetcher = vi.fn(() =>
      Promise.resolve(
        Response.json({ ok: true }, { headers: { 'Cache-Control': 'public, s-maxage=60' } }),
      ),
    )

    let response: Response | undefined
    for (let index = 0; index < 2; index += 1) {
      const ctx = context()
      response = await handleRequest(
        new Request('https://gateway.example/api/v1/herbs?limit=5'),
        environment,
        ctx,
        { cache, fetcher, logger: silentLogger },
      )
      await Promise.all(ctx.pending)
    }
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(response?.headers.get('X-Current-Flow-Cache')).toBe('HIT')
    expect(response?.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(response?.headers.get('Cache-Control')).toBe('public, s-maxage=60')
    expect(response?.headers.get('X-Current-Flow-Origin-Cache-Control')).toBeNull()
  })

  it.each([
    ['authorization', { Authorization: 'Bearer private' }],
    ['cookie', { Cookie: 'session=private' }],
    ['range', { Range: 'bytes=0-10' }],
    ['no-cache', { 'Cache-Control': 'no-cache' }],
  ])('bypasses cache for %s requests', async (_name, headers) => {
    const response = await handleRequest(
      new Request('https://gateway.example/api/v1/herbs', { headers }),
      environment,
      context(),
      {
        cache: new TestCache(),
        logger: silentLogger,
        fetcher: () =>
          Promise.resolve(Response.json({ ok: true }, { headers: { 'Cache-Control': 'public' } })),
      },
    )
    expect(response.headers.get('X-Current-Flow-Cache')).toBe('BYPASS')
  })

  it('keeps health, private routes, writes, errors, and Set-Cookie responses out of cache', async () => {
    const cache = new TestCache()
    const cases = [
      new Request('https://gateway.example/api/v1/health/ready'),
      new Request('https://gateway.example/api/v1/users/me'),
      new Request('https://gateway.example/api/v1/formulas/analyze', {
        method: 'POST',
        body: '{}',
      }),
    ]
    for (const request of cases) {
      const response = await handleRequest(request, environment, context(), {
        cache,
        logger: silentLogger,
        fetcher: () =>
          Promise.resolve(Response.json({ ok: true }, { headers: { 'Cache-Control': 'public' } })),
      })
      expect(response.headers.get('X-Current-Flow-Cache')).toBe('BYPASS')
      expect(response.headers.get('Cache-Control')).not.toMatch(/^public/)
    }

    for (const responseFactory of [
      () => Response.json({ error: true }, { status: 500, headers: { 'Cache-Control': 'public' } }),
      () =>
        Response.json(
          { ok: true },
          { headers: { 'Cache-Control': 'public', 'Set-Cookie': 'private=1' } },
        ),
    ]) {
      const response = await handleRequest(
        new Request('https://gateway.example/api/v1/meta'),
        environment,
        context(),
        { cache, logger: silentLogger, fetcher: () => Promise.resolve(responseFactory()) },
      )
      expect(response.headers.get('Cache-Control')).not.toMatch(/^public/)
    }
    expect(cache.entries.size).toBe(0)
  })

  it('reapplies allowlisted CORS without caching an origin-specific response', async () => {
    const cache = new TestCache()
    const fetcher = (): Promise<Response> =>
      Promise.resolve(
        Response.json(
          { ok: true },
          {
            headers: {
              'Access-Control-Allow-Origin': 'https://current-flow.net',
              'Cache-Control': 'public',
              Vary: 'Accept-Encoding, Origin',
            },
          },
        ),
      )

    for (const origin of ['https://current-flow.net', 'https://www.current-flow.net']) {
      const ctx = context()
      const response = await handleRequest(
        new Request('https://gateway.example/api/v1/meta', { headers: { Origin: origin } }),
        environment,
        ctx,
        { cache, fetcher, logger: silentLogger },
      )
      await Promise.all(ctx.pending)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      expect(response.headers.get('Vary')).toContain('Origin')
    }
  })

  it('rejects oversized declarations, recursion, and paths outside the API boundary', async () => {
    const oversized = await handleRequest(
      new Request('https://gateway.example/api/v1/formulas/analyze', {
        method: 'POST',
        headers: { 'Content-Length': String(MAX_REQUEST_BODY_BYTES + 1) },
      }),
      environment,
      context(),
      { cache: new TestCache(), logger: silentLogger },
    )
    expect(oversized.status).toBe(413)

    const streamedRequest = new Request('https://gateway.example/api/v1/formulas/analyze', {
      method: 'POST',
      body: 'x'.repeat(MAX_REQUEST_BODY_BYTES + 1),
    })
    expect(streamedRequest.headers.has('Content-Length')).toBe(false)
    const streamedOversized = await handleRequest(streamedRequest, environment, context(), {
      cache: new TestCache(),
      logger: silentLogger,
    })
    expect(streamedOversized.status).toBe(413)

    const recursion = await handleRequest(
      new Request('https://gateway.example/api/v1/meta'),
      { ORIGIN_BASE_URL: 'https://gateway.example' },
      context(),
      { cache: new TestCache(), logger: silentLogger },
    )
    expect(recursion.status).toBe(500)
    expect(await recursion.json()).toMatchObject({ code: 'gateway_origin_recursion' })

    const outside = await handleRequest(
      new Request('https://gateway.example/private'),
      environment,
      context(),
      { cache: new TestCache(), logger: silentLogger },
    )
    expect(outside.status).toBe(404)
  })

  it('normalizes malformed request IDs and returns bounded origin failures', async () => {
    const response = await handleRequest(
      new Request('https://gateway.example/api/v1/health/ready', {
        headers: { 'X-Request-ID': 'not safe whitespace' },
      }),
      environment,
      context(),
      {
        cache: new TestCache(),
        logger: silentLogger,
        fetcher: () => Promise.reject(new Error('private origin detail')),
      },
    )
    expect(response.status).toBe(502)
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(await response.text()).not.toContain('private origin detail')
  })

  it('publishes the same private and search classes used by edge configuration', () => {
    expect(routePolicy('GET', '/api/v1/private/profile').endpointClass).toBe('private-no-store')
    expect(routePolicy('GET', '/api/v1/text/search').rateClass).toBe('search')
    expect(routePolicy('POST', '/api/v1/formulas/compare').rateClass).toBe('formula-analysis')
    expect(routePolicy('POST', '/api/gene-keys-lab/generate')).toEqual({
      endpointClass: 'private-no-store',
      rateClass: 'future-intelligence',
    })
  })

  it('serves credentialed Prompt Lab routes at the edge without contacting Render', async () => {
    const origin = 'https://current-flow.net'
    const promptLabEnvironment: GatewayEnvironment = {
      ALLOWED_ORIGINS: 'https://current-flow.net,https://www.current-flow.net',
      PROMPT_LAB_SESSION_SECRET: 'a-test-secret-that-is-longer-than-32-characters',
    }
    const fetcher = vi.fn(() => Promise.reject(new Error('Render must not be contacted')))
    const platform = { cache: new TestCache(), fetcher, logger: silentLogger }

    const session = await handleRequest(
      new Request('https://api.current-flow.net/api/gene-keys-lab/session', {
        headers: { Origin: origin },
      }),
      promptLabEnvironment,
      context(),
      platform,
    )
    expect(session.status).toBe(200)
    expect(session.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(session.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    expect(session.headers.get('X-Current-Flow-Cache')).toBe('BYPASS')
    expect(session.headers.get('Cache-Control')).toContain('no-store')
    await expect(session.json()).resolves.toEqual({ authenticated: false })

    const preflight = await handleRequest(
      new Request('https://api.current-flow.net/api/gene-keys-lab/generate', {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
      }),
      promptLabEnvironment,
      context(),
      platform,
    )
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
