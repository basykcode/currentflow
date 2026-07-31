import schoolRegistryData from '../../../content/yijing/school-registry.json'

import type {
  CommentaryReviewStatus,
  EvidenceMode,
  HexagramCommentaryRepository,
  HexagramCommentarySet,
  PublicationEligibility,
  SchoolDescriptor,
  SchoolHexagramSummary,
  SchoolId,
} from './types'

const contentModules = import.meta.glob('../../../content/yijing/generated/hexagrams/*.json', {
  import: 'default',
})

export const SCHOOL_IDS: readonly SchoolId[] = [
  'daoist',
  'buddhist',
  'confucian',
  'psychological',
  'human-design',
  'gene-keys',
]

const EVIDENCE_MODES: readonly EvidenceMode[] = [
  'multi-source-direct',
  'single-source-direct',
  'direct-plus-framework',
  'framework-applied',
  'insufficient',
]

const PUBLICATION_ELIGIBILITIES: readonly PublicationEligibility[] = [
  'publishable',
  'draft-only',
  'internal-only',
  'blocked',
]

const REVIEW_STATUSES: readonly CommentaryReviewStatus[] = [
  'generated',
  'qa-passed',
  'human-approved',
  'needs-revision',
  'blocked',
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isSchoolId = (value: unknown): value is SchoolId =>
  typeof value === 'string' && SCHOOL_IDS.includes(value as SchoolId)

const isEvidenceMode = (value: unknown): value is EvidenceMode =>
  typeof value === 'string' && EVIDENCE_MODES.includes(value as EvidenceMode)

const isPublicationEligibility = (value: unknown): value is PublicationEligibility =>
  typeof value === 'string' &&
  PUBLICATION_ELIGIBILITIES.includes(value as PublicationEligibility)

const isReviewStatus = (value: unknown): value is CommentaryReviewStatus =>
  typeof value === 'string' && REVIEW_STATUSES.includes(value as CommentaryReviewStatus)

const validateSource = (value: unknown): boolean => {
  if (!isRecord(value)) return false
  return (
    typeof value['sourceId'] === 'string' &&
    typeof value['title'] === 'string' &&
    isStringArray(value['contributors']) &&
    typeof value['contribution'] === 'string' &&
    typeof value['evidenceMode'] === 'string' &&
    typeof value['locatorCount'] === 'number' &&
    isStringArray(value['chunkIds'])
  )
}

const validateSummary = (value: unknown, hexagramNumber: number): value is SchoolHexagramSummary => {
  if (!isRecord(value)) return false
  const rights = value['rights']
  const review = value['review']
  const generation = value['generation']
  if (
    value['hexagramNumber'] !== hexagramNumber ||
    !isSchoolId(value['schoolId']) ||
    !isEvidenceMode(value['evidenceMode']) ||
    typeof value['essence'] !== 'string' ||
    typeof value['summary'] !== 'string' ||
    !Array.isArray(value['sourcesUsed']) ||
    !value['sourcesUsed'].every(validateSource) ||
    !Array.isArray(value['sentenceSupport']) ||
    !isRecord(value['coverage']) ||
    !isRecord(rights) ||
    !isPublicationEligibility(rights['publicationEligibility']) ||
    rights['quotationIncluded'] !== false ||
    !isRecord(review) ||
    !isReviewStatus(review['status']) ||
    !isStringArray(review['issues']) ||
    !isRecord(generation) ||
    generation['generatorKind'] !== 'codex-assisted' ||
    typeof generation['sourceDigest'] !== 'string'
  ) {
    return false
  }
  if (value['evidenceMode'] === 'insufficient') {
    return value['essence'] === '' && value['summary'] === ''
  }
  return value['essence'].length > 0 && value['summary'].length > 0
}

const validatePayload = (
  value: unknown,
  expectedHexagramNumber: number,
): Omit<HexagramCommentarySet & { status: 'available' }, 'status'> => {
  if (
    !isRecord(value) ||
    value['hexagramNumber'] !== expectedHexagramNumber ||
    typeof value['schemaVersion'] !== 'string' ||
    typeof value['contentVersion'] !== 'string' ||
    !Array.isArray(value['summaries']) ||
    value['summaries'].length !== SCHOOL_IDS.length ||
    !value['summaries'].every((summary) =>
      validateSummary(summary, expectedHexagramNumber),
    )
  ) {
    throw new Error(`Malformed commentary content for Hexagram ${expectedHexagramNumber}`)
  }
  const summaries = value['summaries']
  const schoolIds = summaries.map((summary) => summary.schoolId)
  if (new Set(schoolIds).size !== SCHOOL_IDS.length) {
    throw new Error(`Duplicate commentary school for Hexagram ${expectedHexagramNumber}`)
  }
  return {
    schemaVersion: value['schemaVersion'],
    contentVersion: value['contentVersion'],
    hexagramNumber: expectedHexagramNumber,
    summaries,
  }
}

const schoolRegistry = schoolRegistryData.schools
  .map((school): SchoolDescriptor => {
    if (
      !isSchoolId(school.id) ||
      !['classical', 'modern', 'modern-system'].includes(school.classification)
    ) {
      throw new Error('Malformed commentary school registry')
    }
    return {
      id: school.id,
      displayLabel: school.displayLabel,
      description: school.description,
      classification: school.classification as SchoolDescriptor['classification'],
      defaultDisplayOrder: school.defaultDisplayOrder,
    }
  })
  .sort((left, right) => left.defaultDisplayOrder - right.defaultDisplayOrder)

export const HEXAGRAM_COMMENTARY_SCHOOLS: readonly SchoolDescriptor[] = Object.freeze(
  schoolRegistry.map((school) => Object.freeze(school)),
)

export const createHexagramCommentaryRepository = (
  moduleLoaders: Readonly<Record<string, () => Promise<unknown>>> = contentModules,
): HexagramCommentaryRepository => {
  const cache = new Map<number, HexagramCommentarySet>()

  const getHexagramCommentaries = async (
    hexagramNumber: number,
  ): Promise<HexagramCommentarySet> => {
    if (!Number.isInteger(hexagramNumber) || hexagramNumber < 1 || hexagramNumber > 64) {
      return {
        status: 'unavailable',
        hexagramNumber,
        reason: 'Commentary is available only for King Wen numbers 1–64.',
        summaries: [],
      }
    }
    const cached = cache.get(hexagramNumber)
    if (cached) return cached

    const fileName = `${String(hexagramNumber).padStart(2, '0')}.json`
    const modulePath = `../../../content/yijing/generated/hexagrams/${fileName}`
    const loader = moduleLoaders[modulePath]
    if (!loader) {
      const unavailable: HexagramCommentarySet = {
        status: 'unavailable',
        hexagramNumber,
        reason: 'No reviewed commentary artifact is available for this hexagram.',
        summaries: [],
      }
      cache.set(hexagramNumber, unavailable)
      return unavailable
    }

    try {
      const payload = validatePayload(await loader(), hexagramNumber)
      const available: HexagramCommentarySet = { status: 'available', ...payload }
      cache.set(hexagramNumber, available)
      return available
    } catch {
      return {
        status: 'unavailable',
        hexagramNumber,
        reason: 'The commentary artifact did not pass runtime validation.',
        summaries: [],
      }
    }
  }

  const getSchoolSummary = async (
    hexagramNumber: number,
    schoolId: SchoolId,
  ): Promise<SchoolHexagramSummary | null> => {
    const set = await getHexagramCommentaries(hexagramNumber)
    if (set.status === 'unavailable') return null
    return set.summaries.find((summary) => summary.schoolId === schoolId) ?? null
  }

  return { getHexagramCommentaries, getSchoolSummary }
}
