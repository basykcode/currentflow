import type { GuidanceBundle } from '@/domain/guidance/types'

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

export type TemporalHexagramMappingSystem = 'liu-shi-jiazi-peigua' | 'demo-fixture'

export type TemporalHexagram = {
  scope: TemporalScope
  label: string
  timeBoundsLabel: string
  hexagram: HexagramReference
  ganZhiRaw?: string
  ganZhi?: string
  numberingSystem: 'king-wen'
  mappingSystem: TemporalHexagramMappingSystem
  mappingVersion: string
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

export type ChuZhengKeMoment = {
  segment: 'chu' | 'zheng'
  keIndex: 0 | 1 | 2 | 3
  nameChinese: string
  namePinyin: string
  meaningEnglish: string
  timeRangeLabel: string
  cultivationPhase: string
  cultivationGuidance: string
  status: Extract<DataStatus, 'computed'>
  sourceLabel: string
  cultivationStatus: 'current-formalization'
  cultivationSourceLabel: string
}

export type OrganMoment = {
  key: OrganKey
  nameEnglish: string
  nameChinese?: string
  timeRangeLabel: string
  chuZhengKe?: ChuZhengKeMoment
  status: DataStatus
  sourceLabel: string
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
  guidance: GuidanceBundle
  relatedHexagrams: readonly RelatedHexagram[]
  provenance: {
    providerId: string
    modelVersion: string
    mappingVersion: string
    factors: readonly string[]
    notes: readonly string[]
  }
}
