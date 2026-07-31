import type {
  AvailableHexagramTransitionSet,
  HexagramTransitionRepository,
  HexagramTransitionSet,
  HexagramTransitionSummary,
  LineChangeNumber,
  TransitionReviewStatus,
} from './types'

const contentModules = import.meta.glob('../../../content/yijing/generated/transitions/*.json', {
  import: 'default',
})

const REVIEW_STATUSES: readonly TransitionReviewStatus[] = [
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

const isLineChangeNumber = (value: unknown): value is LineChangeNumber =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6

const isReviewStatus = (value: unknown): value is TransitionReviewStatus =>
  typeof value === 'string' && REVIEW_STATUSES.includes(value as TransitionReviewStatus)

const validateTransition = (
  value: unknown,
  sourceHexagramNumber: number,
): value is HexagramTransitionSummary => {
  if (!isRecord(value)) return false
  const source = value['source']
  const rights = value['rights']
  const review = value['review']
  return (
    typeof value['schemaVersion'] === 'string' &&
    typeof value['contentVersion'] === 'string' &&
    typeof value['transitionId'] === 'string' &&
    value['sourceHexagramNumber'] === sourceHexagramNumber &&
    typeof value['targetHexagramNumber'] === 'number' &&
    Number.isInteger(value['targetHexagramNumber']) &&
    value['targetHexagramNumber'] >= 1 &&
    value['targetHexagramNumber'] <= 64 &&
    isLineChangeNumber(value['changingLine']) &&
    typeof value['theme'] === 'string' &&
    value['theme'].length > 0 &&
    typeof value['summary'] === 'string' &&
    value['summary'].length > 0 &&
    value['evidenceMode'] === 'single-source-direct' &&
    isRecord(source) &&
    source['sourceId'] === 'transition_1_jiaoshi_yilin_gait' &&
    typeof source['title'] === 'string' &&
    typeof source['titleChinese'] === 'string' &&
    typeof source['translator'] === 'string' &&
    typeof source['sourceLocator'] === 'string' &&
    typeof source['resolvedLocator'] === 'string' &&
    isStringArray(source['crossReferenceChain']) &&
    typeof source['sourcePassageSha256'] === 'string' &&
    /^[a-f0-9]{64}$/.test(source['sourcePassageSha256']) &&
    isRecord(rights) &&
    ['draft-only', 'publishable'].includes(rights['publicationEligibility'] as string) &&
    rights['quotationIncluded'] === false &&
    isRecord(review) &&
    isReviewStatus(review['status']) &&
    isStringArray(review['issues'])
  )
}

const validatePayload = (
  value: unknown,
  expectedSourceHexagramNumber: number,
): Omit<AvailableHexagramTransitionSet, 'status'> => {
  if (
    !isRecord(value) ||
    typeof value['schemaVersion'] !== 'string' ||
    typeof value['contentVersion'] !== 'string' ||
    value['sourceHexagramNumber'] !== expectedSourceHexagramNumber ||
    !Array.isArray(value['transitions']) ||
    value['transitions'].length !== 6 ||
    !value['transitions'].every((transition) =>
      validateTransition(transition, expectedSourceHexagramNumber),
    )
  ) {
    throw new Error(`Malformed transition content for Hexagram ${expectedSourceHexagramNumber}`)
  }

  const transitions = value['transitions']
  const lines = transitions.map((transition) => transition.changingLine)
  const targets = transitions.map((transition) => transition.targetHexagramNumber)
  if (new Set(lines).size !== 6 || new Set(targets).size !== 6) {
    throw new Error(
      `Duplicate line or target in transition content for Hexagram ${expectedSourceHexagramNumber}`,
    )
  }

  return {
    schemaVersion: value['schemaVersion'],
    contentVersion: value['contentVersion'],
    sourceHexagramNumber: expectedSourceHexagramNumber,
    transitions,
  }
}

export const createHexagramTransitionRepository = (
  moduleLoaders: Readonly<Record<string, () => Promise<unknown>>> = contentModules,
): HexagramTransitionRepository => {
  const cache = new Map<number, HexagramTransitionSet>()

  const getLineTransitions = async (
    sourceHexagramNumber: number,
  ): Promise<HexagramTransitionSet> => {
    if (
      !Number.isInteger(sourceHexagramNumber) ||
      sourceHexagramNumber < 1 ||
      sourceHexagramNumber > 64
    ) {
      return {
        status: 'unavailable',
        sourceHexagramNumber,
        reason: 'Transition commentary is available only for King Wen numbers 1–64.',
        transitions: [],
      }
    }

    const cached = cache.get(sourceHexagramNumber)
    if (cached) return cached

    const fileName = `${String(sourceHexagramNumber).padStart(2, '0')}.json`
    const modulePath = `../../../content/yijing/generated/transitions/${fileName}`
    const loader = moduleLoaders[modulePath]
    if (!loader) {
      const unavailable: HexagramTransitionSet = {
        status: 'unavailable',
        sourceHexagramNumber,
        reason: 'No reviewed Forest transition artifact is available for this hexagram.',
        transitions: [],
      }
      cache.set(sourceHexagramNumber, unavailable)
      return unavailable
    }

    try {
      const payload = validatePayload(await loader(), sourceHexagramNumber)
      const available: HexagramTransitionSet = {
        status: 'available',
        ...payload,
      }
      cache.set(sourceHexagramNumber, available)
      return available
    } catch {
      return {
        status: 'unavailable',
        sourceHexagramNumber,
        reason: 'The Forest transition artifact did not pass runtime validation.',
        transitions: [],
      }
    }
  }

  const getTransition = async (
    sourceHexagramNumber: number,
    targetHexagramNumber: number,
  ): Promise<HexagramTransitionSummary | null> => {
    const set = await getLineTransitions(sourceHexagramNumber)
    if (set.status === 'unavailable') return null
    return (
      set.transitions.find(
        (transition) => transition.targetHexagramNumber === targetHexagramNumber,
      ) ?? null
    )
  }

  return { getLineTransitions, getTransition }
}
