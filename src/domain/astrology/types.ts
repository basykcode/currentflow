export type DataStatus = 'demo' | 'computed' | 'curated' | 'unavailable'

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

export type TrigramKey = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun'

export type Trigram = {
  key: TrigramKey
  nameEnglish: string
  nameChinese: string
  namePinyin: string
  imageEnglish: string
  linesBottomToTop: readonly [LinePolarity, LinePolarity, LinePolarity]
}

export type GeneKeySpectrum = {
  title: string
  shadow: string
  gift: string
  siddhi: string
  status: Extract<DataStatus, 'curated'>
  sourceLabel: string
  sourceUrl: string
}

export type HexagramReference = Hexagram & {
  number: number
  nameChinese: string
  namePinyin: string
  lowerTrigram: Trigram
  upperTrigram: Trigram
  geneKey: GeneKeySpectrum
  status: Extract<DataStatus, 'curated'>
  sourceLabel: string
}

export type TemporalScope = 'year' | 'month' | 'day' | 'hour'

export type TemporalHexagram = {
  scope: TemporalScope
  label: string
  timeBoundsLabel: string
  hexagram: Hexagram
  ganZhi?: string
  status: DataStatus
  sourceLabel: string
}

export type OrganKey =
  | 'gallbladder'
  | 'liver'
  | 'lung'
  | 'large-intestine'
  | 'stomach'
  | 'spleen'
  | 'heart'
  | 'small-intestine'
  | 'bladder'
  | 'kidney'
  | 'pericardium'
  | 'san-jiao'

export type OrganMoment = {
  key: OrganKey
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
