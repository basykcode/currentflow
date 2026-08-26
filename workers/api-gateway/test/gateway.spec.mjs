import assert from 'node:assert/strict'
import test from 'node:test'

import { handleRequest } from '../src/index.mjs'

class TestCache {
  constructor({ rewriteCacheControl = false } = {}) {
    this.entries = new Map()
    this.rewriteCacheControl = rewriteCacheControl
  }

  async match(request) {
    return this.entries.get(request.url)?.clone()
  }

  async put(request, response) {
    const cached = response.clone()
    if (this.rewriteCacheControl) {
      cached.headers.set('Cache-Control', 'public, max-age=14400')
    }
    this.entries.set(request.url, cached)
  }
}

function context() {
  const pending = []
  return {
    pending,
    waitUntil(promise) {
      pending.push(promise)
    },
  }
}

test('proxies public API GETs with request and origin tokens', async () => {
  const seen = []
  const ctx = context()
  const response = await handleRequest(
    new Request('https://gateway.example/api/v1/meta', {
      headers: { 'X-Request-ID': 'test-request' },
    }),
    { ORIGIN_BASE_URL: 'https://origin.example', ORIGIN_TOKEN: 'secret' },
    ctx,
    {
      cache: new TestCache(),
      async fetcher(request) {
        seen.push(request)
        return Response.json(
          { status: 'ok' },
          { headers: { 'Cache-Control': 'public, max-age=60' } },
        )
      },
    },
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Current-Flow-Gateway'), 'cloudflare-worker')
  assert.equal(seen[0].url, 'https://origin.example/api/v1/meta')
  assert.equal(seen[0].headers.get('X-Request-ID'), 'test-request')
  assert.equal(seen[0].headers.get('X-Current-Flow-Origin-Token'), 'secret')
  await Promise.all(ctx.pending)
})

test('caches only eligible public GET responses', async () => {
  const cache = new TestCache({ rewriteCacheControl: true })
  let calls = 0
  const fetcher = async () => {
    calls += 1
    return Response.json({ calls }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  let cachedResponse
  for (let index = 0; index < 2; index += 1) {
    const ctx = context()
    cachedResponse = await handleRequest(
      new Request('https://gateway.example/api/v1/herbs?limit=5'),
      { ORIGIN_BASE_URL: 'https://origin.example' },
      ctx,
      { cache, fetcher },
    )
    await Promise.all(ctx.pending)
    assert.equal(cachedResponse.status, 200)
  }
  assert.equal(calls, 1)
  assert.equal(cachedResponse.headers.get('Cache-Control'), 'public, max-age=60')
  assert.equal(cachedResponse.headers.get('X-Current-Flow-Origin-Cache-Control'), null)

  const ctx = context()
  await handleRequest(
    new Request('https://gateway.example/api/v1/herbs?limit=5', {
      headers: { Authorization: 'Bearer private' },
    }),
    { ORIGIN_BASE_URL: 'https://origin.example' },
    ctx,
    { cache, fetcher },
  )
  assert.equal(calls, 2)

  const bypassContext = context()
  const bypass = await handleRequest(
    new Request('https://gateway.example/api/v1/herbs?limit=5', {
      headers: { 'Cache-Control': 'no-cache' },
    }),
    { ORIGIN_BASE_URL: 'https://origin.example' },
    bypassContext,
    { cache, fetcher },
  )
  assert.equal(bypass.headers.get('X-Current-Flow-Cache'), 'BYPASS')
  assert.equal(calls, 3)
})

test('reapplies allowlisted CORS headers without caching an origin-specific response', async () => {
  const cache = new TestCache()
  const env = {
    ORIGIN_BASE_URL: 'https://origin.example',
    ALLOWED_ORIGINS: 'https://current-flow.net,https://www.current-flow.net',
  }
  const fetcher = async () =>
    Response.json(
      { ok: true },
      {
        headers: {
          'Access-Control-Allow-Origin': 'https://current-flow.net',
          'Cache-Control': 'public, max-age=60',
          Vary: 'Accept-Encoding, Origin',
        },
      },
    )

  for (const origin of ['https://current-flow.net', 'https://www.current-flow.net']) {
    const ctx = context()
    const response = await handleRequest(
      new Request('https://gateway.example/api/v1/meta', { headers: { Origin: origin } }),
      env,
      ctx,
      { cache, fetcher },
    )
    await Promise.all(ctx.pending)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
    assert.match(response.headers.get('Vary'), /Origin/)
  }
})

test('bypasses health caching and returns bounded origin failures', async () => {
  const cache = new TestCache()
  let calls = 0
  const fetcher = async () => {
    calls += 1
    throw new Error('origin unavailable')
  }
  const ctx = context()
  const response = await handleRequest(
    new Request('https://gateway.example/api/v1/health/ready'),
    { ORIGIN_BASE_URL: 'https://origin.example' },
    ctx,
    { cache, fetcher },
  )

  assert.equal(calls, 1)
  assert.equal(response.status, 502)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal((await response.json()).code, 'origin_unavailable')
})

test('rejects paths outside the API boundary without contacting the origin', async () => {
  const response = await handleRequest(
    new Request('https://gateway.example/private'),
    { ORIGIN_BASE_URL: 'https://origin.example' },
    context(),
    {
      cache: new TestCache(),
      async fetcher() {
        assert.fail('origin should not be called')
      },
    },
  )
  assert.equal(response.status, 404)
})

test('serves credentialed Prompt Lab routes at the edge without contacting Render', async () => {
  const env = {
    ALLOWED_ORIGINS: 'https://current-flow.net,https://www.current-flow.net',
    PROMPT_LAB_SESSION_SECRET: 'a-test-secret-that-is-longer-than-32-characters',
  }
  const origin = 'https://current-flow.net'
  const platform = {
    cache: new TestCache(),
    async fetcher() {
      assert.fail('Prompt Lab routes must not contact the Render origin')
    },
  }

  const session = await handleRequest(
    new Request('https://api.current-flow.net/api/gene-keys-lab/session', {
      headers: { Origin: origin },
    }),
    env,
    context(),
    platform,
  )
  assert.equal(session.status, 200)
  assert.equal(session.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(session.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.equal(session.headers.get('X-Current-Flow-Cache'), 'BYPASS')
  assert.deepEqual(await session.json(), { authenticated: false })

  const preflight = await handleRequest(
    new Request('https://api.current-flow.net/api/gene-keys-lab/generate', {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
    }),
    env,
    context(),
    platform,
  )
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /POST/)
})
