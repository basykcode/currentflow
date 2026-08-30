export const API_PREFIX = '/api/v1/'
export const PROMPT_LAB_PREFIX = '/api/gene-keys-lab/'
export const MAX_REQUEST_BODY_BYTES = 1_048_576

export type EndpointClass =
  'public-cacheable' | 'public-uncacheable' | 'private-no-store' | 'health' | 'administrative'

export type RatePolicyClass =
  | 'anonymous-public-read'
  | 'authenticated-read'
  | 'search'
  | 'formula-analysis'
  | 'graph-retrieval'
  | 'future-intelligence'
  | 'administrative-import'

export interface RoutePolicy {
  endpointClass: EndpointClass
  rateClass: RatePolicyClass
}

const HEALTH_PATHS = new Set(['/api/v1/health/live', '/api/v1/health/ready'])
const PRIVATE_PREFIXES = [
  '/api/v1/auth/',
  '/api/v1/private/',
  '/api/v1/users/',
  '/api/v1/profiles/',
  '/api/v1/subscriptions/',
  '/api/v1/memories/',
]
const ADMINISTRATIVE_PREFIXES = ['/api/v1/admin/', '/api/v1/internal/', '/api/v1/imports/']
const INTELLIGENCE_PREFIXES = ['/api/v1/intelligence/', '/api/v1/inquiry/']

const stableRecord = /^\/api\/v1\/(meta|sources|documents|passages)$/
const stableDetail = /^\/api\/v1\/(herbs|formulas|sources|documents|passages)\/[^/]+$/
const graphDetail = /^\/api\/v1\/graph\/entities\/[^/]+\/neighborhood$/
const search = /^\/api\/v1\/(search\/suggest|text\/search|herbs|formulas)$/
const privateBoundedPost = new Set(['/api/v1/explore/query', '/api/v1/retrieval/context'])

const hasPrefix = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))

export function routePolicy(method: string, path: string): RoutePolicy {
  if (path.startsWith(PROMPT_LAB_PREFIX)) {
    return { endpointClass: 'private-no-store', rateClass: 'future-intelligence' }
  }
  if (HEALTH_PATHS.has(path)) {
    return { endpointClass: 'health', rateClass: 'anonymous-public-read' }
  }
  if (hasPrefix(path, ADMINISTRATIVE_PREFIXES)) {
    return { endpointClass: 'administrative', rateClass: 'administrative-import' }
  }
  if (hasPrefix(path, PRIVATE_PREFIXES)) {
    return { endpointClass: 'private-no-store', rateClass: 'authenticated-read' }
  }
  if (hasPrefix(path, INTELLIGENCE_PREFIXES)) {
    return { endpointClass: 'private-no-store', rateClass: 'future-intelligence' }
  }
  if (method === 'POST' && privateBoundedPost.has(path)) {
    return { endpointClass: 'public-uncacheable', rateClass: 'graph-retrieval' }
  }
  if (method === 'POST' && /^\/api\/v1\/formulas\/(analyze|compare)$/.test(path)) {
    return { endpointClass: 'public-uncacheable', rateClass: 'formula-analysis' }
  }
  if (method === 'GET' && search.test(path)) {
    return { endpointClass: 'public-cacheable', rateClass: 'search' }
  }
  if (
    method === 'GET' &&
    (stableRecord.test(path) || stableDetail.test(path) || graphDetail.test(path))
  ) {
    return { endpointClass: 'public-cacheable', rateClass: 'anonymous-public-read' }
  }
  return { endpointClass: 'public-uncacheable', rateClass: 'anonymous-public-read' }
}

export function isPublicCacheCandidate(request: Request, policy: RoutePolicy): boolean {
  const requestCacheControl = request.headers.get('Cache-Control') ?? ''
  return (
    request.method === 'GET' &&
    policy.endpointClass === 'public-cacheable' &&
    !request.headers.has('Authorization') &&
    !request.headers.has('Cookie') &&
    !request.headers.has('Range') &&
    !requestCacheControl.includes('no-cache') &&
    !requestCacheControl.includes('no-store') &&
    request.headers.get('Pragma') !== 'no-cache'
  )
}

export function declaredBodyTooLarge(request: Request): boolean {
  const value = request.headers.get('Content-Length')
  if (value === null) return false
  const bytes = Number(value)
  return !Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_REQUEST_BODY_BYTES
}
