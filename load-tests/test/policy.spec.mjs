import assert from 'node:assert/strict'
import test from 'node:test'

import { loadOptions, loadProfiles, targetPolicy, thresholds } from '../policy.mjs'

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
