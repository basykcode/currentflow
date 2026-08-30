export const loadProfiles = Object.freeze({
  smoke: Object.freeze({ executor: 'constant-vus', vus: 3, duration: '30s' }),
  baseline: Object.freeze({
    executor: 'constant-arrival-rate',
    rate: 10,
    timeUnit: '1s',
    duration: '15m',
    preAllocatedVUs: 10,
    maxVUs: 50,
  }),
  medium: Object.freeze({
    executor: 'constant-arrival-rate',
    rate: 20,
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 20,
    maxVUs: 100,
  }),
  burst: Object.freeze({
    executor: 'constant-arrival-rate',
    rate: 50,
    timeUnit: '1s',
    duration: '30s',
    preAllocatedVUs: 25,
    maxVUs: 150,
  }),
  concurrency: Object.freeze({ executor: 'constant-vus', vus: 100, duration: '2m' }),
})

export const thresholds = Object.freeze({
  http_req_failed: ['rate<0.01'],
  'http_req_duration{workload:cached_public}': ['p(95)<250'],
  'http_req_duration{workload:indexed_graph}': ['p(95)<750'],
  'http_req_duration{workload:complex_bounded}': ['p(95)<2000'],
})

export function targetPolicy(target, environment = {}) {
  const parsed = new URL(target)
  const local = new Set(['localhost', '127.0.0.1', '::1']).has(parsed.hostname)
  const production = ['api.current-flow.net', 'current-flow-alchemy-api.onrender.com'].includes(
    parsed.hostname,
  )
  if (!local && environment.ALLOW_REMOTE_LOAD !== '1') {
    throw new Error('Remote load targets require ALLOW_REMOTE_LOAD=1.')
  }
  if (production && environment.ALLOW_PRODUCTION_LOAD !== '1') {
    throw new Error('Production load targets require ALLOW_PRODUCTION_LOAD=1.')
  }
  const directRenderOrigin = parsed.hostname === 'current-flow-alchemy-api.onrender.com'
  return Object.freeze({ origin: parsed.origin, local, production, directRenderOrigin })
}

export function originRequestHeaders(policy, environment = {}) {
  const token = environment.ALCHEMY_ORIGIN_TOKEN
  if (!policy.directRenderOrigin || typeof token !== 'string' || token.length === 0)
    return undefined
  return Object.freeze({ 'X-Current-Flow-Origin-Token': token })
}

export function loadOptions(profileName) {
  const profile = loadProfiles[profileName]
  if (!profile) throw new Error(`Unknown LOAD_PROFILE '${profileName}'.`)
  return {
    discardResponseBodies: true,
    scenarios: { alchemy: { ...profile, exec: 'alchemyWorkload' } },
    thresholds,
  }
}
