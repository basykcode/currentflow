export type TransitionReviewStatus =
  'generated' | 'qa-passed' | 'human-approved' | 'needs-revision' | 'blocked'

export type LineChangeNumber = 1 | 2 | 3 | 4 | 5 | 6

export type HexagramTransitionSummary = {
  schemaVersion: string
  contentVersion: string
  transitionId: string
  sourceHexagramNumber: number
  targetHexagramNumber: number
  changingLine: LineChangeNumber
  theme: string
  summary: string
  evidenceMode: 'single-source-direct'
  source: {
    sourceId: 'transition_1_jiaoshi_yilin_gait'
    title: string
    titleChinese: string
    translator: string
    sourceLocator: string
    resolvedLocator: string
    crossReferenceChain: readonly string[]
    sourcePassageSha256: string
  }
  rights: {
    publicationEligibility: 'draft-only' | 'publishable'
    quotationIncluded: false
  }
  review: {
    status: TransitionReviewStatus
    issues: readonly string[]
  }
}

export type AvailableHexagramTransitionSet = {
  status: 'available'
  schemaVersion: string
  contentVersion: string
  sourceHexagramNumber: number
  transitions: readonly HexagramTransitionSummary[]
}

export type UnavailableHexagramTransitionSet = {
  status: 'unavailable'
  sourceHexagramNumber: number
  reason: string
  transitions: readonly []
}

export type HexagramTransitionSet =
  AvailableHexagramTransitionSet | UnavailableHexagramTransitionSet

export interface HexagramTransitionRepository {
  getLineTransitions(sourceHexagramNumber: number): Promise<HexagramTransitionSet>
  getTransition(
    sourceHexagramNumber: number,
    targetHexagramNumber: number,
  ): Promise<HexagramTransitionSummary | null>
}
