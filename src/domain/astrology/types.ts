export type DataStatus = 'demo' | 'computed' | 'unavailable'

export type LinePolarity = 'yin' | 'yang'

export type HexagramLines = readonly [
  LinePolarity,
  LinePolarity,
  LinePolarity,
  LinePolarity,
  LinePolarity,
  LinePolarity,
]

export type Hexagram = {
  number: number | null
  nameEnglish: string
  nameChinese?: string
  /** Traditional construction order: index 0 is the bottom line. */
  linesBottomToTop: HexagramLines
}

export type TemporalScope = 'year' | 'month' | 'day' | 'hour'

export type TemporalHexagram = {
  scope: TemporalScope
  label: string
  hexagram: Hexagram
  ganZhi?: string
  status: DataStatus
  sourceLabel: string
}

export type OrganMoment = {
  key: string
  nameEnglish: string
  nameChinese?: string
  timeRangeLabel: string
  status: DataStatus
  sourceLabel: string
}

export type ExecutionFriction = 'lower' | 'neutral' | 'higher'

export type ExecutionItem = {
  label: string
  friction: ExecutionFriction
  rationale?: string
}

export type RelatedHexagram = {
  hexagram: Hexagram
  relationshipLabel: string
  status: DataStatus
  sourceLabel: string
}

export type CurrentFlowSnapshot = {
  generatedAtIso: string
  timezone: string
  locationLabel?: string
  status: DataStatus
  temporal: {
    year: TemporalHexagram
    month: TemporalHexagram
    day: TemporalHexagram
    hour: TemporalHexagram
  }
  organ: OrganMoment
  synthesis: {
    status: DataStatus
    sourceLabel: string
    oltr: string
    recommendedIntention: string
    recommendedExecution: readonly ExecutionItem[]
    relatedHexagrams: readonly RelatedHexagram[]
  }
  provenance: {
    providerId: string
    modelVersion: string
    factors: readonly string[]
    notes: readonly string[]
  }
}
