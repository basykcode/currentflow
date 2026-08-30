import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  loadOptions,
  loadProfiles,
  originRequestHeaders,
  targetPolicy,
  thresholds,
} from '../policy.mjs'

test('all locked load profiles are present and bounded', () => {
  assert.deepEqual(Object.keys(loadProfiles), [
    'smoke',
    'baseline',
    'medium',
    'burst',
    'concurrency',
  ])
  assert.equal(loadProfiles.baseline.rate, 10)
  assert.equal(loadProfiles.medium.rate, 20)
  assert.equal(loadProfiles.burst.rate, 50)
  assert.equal(loadProfiles.concurrency.vus, 100)
  assert.equal(loadOptions('smoke').scenarios.alchemy.vus, 3)
  assert.throws(() => loadOptions('unbounded'), /Unknown LOAD_PROFILE/)
})

test('latency and error thresholds remain explicit', () => {
  assert.deepEqual(thresholds.http_req_failed, ['rate<0.01'])
  assert.deepEqual(thresholds['http_req_duration{workload:cached_public}'], ['p(95)<250'])
  assert.deepEqual(thresholds['http_req_duration{workload:indexed_graph}'], ['p(95)<750'])
  assert.deepEqual(thresholds['http_req_duration{workload:complex_bounded}'], ['p(95)<2000'])
})

test('remote and production targets require independent explicit opt-ins', () => {
  assert.equal(targetPolicy('http://127.0.0.1:8000').local, true)
  assert.throws(() => targetPolicy('https://staging.example'), /ALLOW_REMOTE_LOAD=1/)
  assert.equal(
    targetPolicy('https://staging.example', { ALLOW_REMOTE_LOAD: '1' }).production,
    false,
  )
  assert.throws(
    () => targetPolicy('https://api.current-flow.net', { ALLOW_REMOTE_LOAD: '1' }),
    /ALLOW_PRODUCTION_LOAD=1/,
  )
  assert.equal(
    targetPolicy('https://api.current-flow.net', {
      ALLOW_REMOTE_LOAD: '1',
      ALLOW_PRODUCTION_LOAD: '1',
    }).production,
    true,
  )
})

test('origin token headers are scoped to explicitly authorized direct Render runs', () => {
  const authorization = { ALLOW_REMOTE_LOAD: '1', ALLOW_PRODUCTION_LOAD: '1' }
  const withToken = { ...authorization, ALCHEMY_ORIGIN_TOKEN: 'test-only' }
  assert.throws(
    () => targetPolicy('https://current-flow-alchemy-api.onrender.com', authorization),
    /require ALCHEMY_ORIGIN_TOKEN/,
  )
  const renderPolicy = targetPolicy('https://current-flow-alchemy-api.onrender.com', withToken)
  assert.deepEqual(originRequestHeaders(renderPolicy, withToken), {
    'X-Current-Flow-Origin-Token': 'test-only',
  })

  for (const rejectedTarget of [
    'http://current-flow-alchemy-api.onrender.com',
    'https://current-flow-alchemy-api.onrender.com:8443',
    'https://api.current-flow.net',
    'http://127.0.0.1:8000',
    'https://current-flow-alchemy-api.onrender.com.example',
  ]) {
    assert.throws(
      () => targetPolicy(rejectedTarget, withToken),
      /ALCHEMY_ORIGIN_TOKEN is allowed only/,
      rejectedTarget,
    )
  }
})

test('manual direct-origin workflow passes the secret by variable name only', () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/load-test.yml'),
    'utf8',
  )

  assert.match(workflow, /ALCHEMY_ORIGIN_TOKEN: \$\{\{ secrets\.ALCHEMY_ORIGIN_TOKEN \}\}/)
  assert.match(workflow, /^\s+-e ALCHEMY_ORIGIN_TOKEN$/m)
  assert.doesNotMatch(workflow, /-e ALCHEMY_ORIGIN_TOKEN=/)
  assert.doesNotMatch(workflow, /echo[^\n]*ALCHEMY_ORIGIN_TOKEN/i)
})
