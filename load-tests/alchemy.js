import execution from 'k6/execution'
import http from 'k6/http'
import { check, fail } from 'k6'

import { loadOptions, targetPolicy } from './policy.mjs'

export const options = loadOptions(__ENV.LOAD_PROFILE ?? 'smoke')

export function setup() {
  const policy = targetPolicy(__ENV.TARGET_URL ?? 'http://127.0.0.1:8000', __ENV)
  return {
    target: policy.origin,
    herbId: __ENV.HERB_ID ?? '',
    formulaId: __ENV.FORMULA_ID ?? '',
    comparisonBody: __ENV.FORMULA_COMPARISON_BODY ?? '',
    canonSearchPath: __ENV.CANON_SEARCH_PATH ?? '',
  }
}

function expectSuccess(response, name) {
  check(response, {
    [`${name} returned 2xx`]: (result) => result.status >= 200 && result.status < 300,
  })
}

export function alchemyWorkload(data) {
  const iteration = execution.scenario.iterationInTest % 8
  if (iteration === 0) {
    expectSuccess(
      http.get(`${data.target}/api/v1/health/live`, { tags: { workload: 'health' } }),
      'liveness',
    )
    return
  }
  if (iteration === 1) {
    expectSuccess(
      http.get(`${data.target}/api/v1/health/ready`, { tags: { workload: 'health' } }),
      'readiness',
    )
    return
  }
  if (iteration === 2) {
    expectSuccess(
      http.get(`${data.target}/api/v1/herbs?query=a&offset=0&limit=10`, {
        tags: { workload: 'indexed_graph' },
      }),
      'herb search',
    )
    return
  }
  if (iteration === 3 && data.herbId) {
    expectSuccess(
      http.get(`${data.target}/api/v1/herbs/${encodeURIComponent(data.herbId)}`, {
        tags: { workload: 'cached_public' },
      }),
      'herb monograph',
    )
    return
  }
  if (iteration === 4 && data.formulaId) {
    expectSuccess(
      http.get(`${data.target}/api/v1/formulas/${encodeURIComponent(data.formulaId)}`, {
        tags: { workload: 'cached_public' },
      }),
      'formula profile',
    )
    return
  }
  if (iteration === 5 && data.comparisonBody) {
    let body
    try {
      body = JSON.parse(data.comparisonBody)
    } catch {
      fail('FORMULA_COMPARISON_BODY must be valid JSON.')
    }
    expectSuccess(
      http.post(`${data.target}/api/v1/formulas/compare`, JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
        tags: { workload: 'complex_bounded' },
      }),
      'formula comparison',
    )
    return
  }
  if (iteration === 6) {
    expectSuccess(
      http.get(`${data.target}/api/v1/sources?offset=0&limit=25`, {
        tags: { workload: 'cached_public' },
      }),
      'source list',
    )
    return
  }
  if (iteration === 7 && data.canonSearchPath) {
    expectSuccess(
      http.get(`${data.target}${data.canonSearchPath}`, { tags: { workload: 'indexed_graph' } }),
      'future Canon search',
    )
    return
  }
  expectSuccess(
    http.get(`${data.target}/api/v1/meta`, { tags: { workload: 'cached_public' } }),
    'metadata fallback',
  )
}
