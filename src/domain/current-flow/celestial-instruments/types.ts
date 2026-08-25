export type InstrumentDataStatus = 'verified' | 'computed' | 'partial' | 'unavailable'

export type LunarPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Third Quarter'
  | 'Waning Crescent'

export type CantongQiNodeId =
  | 'zhen-emergence'
  | 'dui-accumulation'
  | 'qian-culmination'
  | 'xun-distribution'
  | 'gen-consolidation'
  | 'kun-concealment'

export type CantongQiCharacter = '震' | '兌' | '乾' | '巽' | '艮' | '坤'

export type LunarYinYangMovement =
  'Yang Emerging' | 'Yang Growing' | 'Yang Full' | 'Yin Emerging' | 'Yin Growing' | 'Yin Full'

export type ChineseSolarSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter'

export type AnnualYinYangMovement =
  | 'Yang Returning'
  | 'Yang Emerging'
  | 'Yang Growing'
  | 'Yang Full'
  | 'Yang Descending'
  | 'Yin Emerging'
  | 'Yin Growing'
  | 'Yin Full'

export type EarthlyBranchCharacter =
  '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'

export type EarthlyBranchIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export interface SolarTermDisplayDefinition {
  readonly id: string
  readonly chineseTraditional: string
  readonly chineseSimplified?: string
  readonly pinyin: string
  readonly contextualEnglish: string
  readonly literalEnglish?: string
  readonly solarLongitudeDegrees: number
  readonly displayTableVersion: string
}

export interface CantongQiDisplayDefinition {
  readonly nodeId: CantongQiNodeId
  readonly character: CantongQiCharacter
  readonly pinyin: string
  readonly englishLabel: string
  readonly yinYangMovement: LunarYinYangMovement
  readonly index: 0 | 1 | 2 | 3 | 4 | 5
}

export interface BranchMonthDefinition {
  readonly character: EarthlyBranchCharacter
  readonly pinyin: string
  readonly animalEnglish: string
  readonly index: EarthlyBranchIndex
}

export interface CelestialRingLabel {
  readonly character: string
  readonly accessibleLabel: string
}

export interface LunarCurrentSource {
  readonly status: InstrumentDataStatus
  readonly phaseName: LunarPhaseName | null
  readonly elongationDegrees: number | null
  readonly lunationProgress: number | null
  readonly illuminationFraction: number | null
  readonly waxing: boolean | null
  readonly cantongQiNodeId: CantongQiNodeId | null
  readonly methodology: {
    readonly astronomyMethodId: string
    readonly calendarMethodId: string
    readonly cantongQiMethodId: string
  }
  readonly warnings: readonly string[]
}

export interface SeasonalCurrentSource {
  readonly status: InstrumentDataStatus
  readonly solarLongitudeDegrees: number | null
  readonly solarTermId: string | null
  readonly season: ChineseSolarSeason | null
  readonly branchMonth: BranchMonthDefinition | null
  readonly yinYangMovement: AnnualYinYangMovement | null
  readonly methodology: {
    readonly astronomyMethodId: string
    readonly solarTermTableVersion: string
    readonly seasonMethodVersion: string
    readonly yinYangMovementVersion: string
  }
  readonly warnings: readonly string[]
}

/**
 * Required upstream seam. This repository currently defines the contract but does not own an
 * astronomical implementation. Production callers must supply reviewed Global Conditions data.
 */
export interface GlobalConditionsSnapshot {
  readonly generatedAtIso: string
  readonly lunar: LunarCurrentSource
  readonly seasonal: SeasonalCurrentSource
}

export interface LunarHomeInstrumentViewModel {
  readonly status: InstrumentDataStatus
  readonly phaseName: LunarPhaseName | 'Lunar data unavailable'
  readonly cantongQi: CantongQiDisplayDefinition | null
  readonly yinYangMovement: LunarYinYangMovement | null
  readonly elongationDegrees: number | null
  readonly lunationProgress: number | null
  readonly illuminationFraction: number | null
  readonly waxing: boolean | null
  readonly activeNodeIndex: 0 | 1 | 2 | 3 | 4 | 5 | null
  readonly markerAngleDegrees: number | null
  readonly detailsTarget: { readonly kind: 'lunar-current' }
  readonly methodology: {
    readonly astronomyMethodId: string
    readonly calendarMethodId: string
    readonly cantongQiMethodId: string
    readonly presenterVersion: string
  }
  readonly warnings: readonly string[]
}

export interface SolarHomeInstrumentViewModel {
  readonly status: InstrumentDataStatus
  readonly season: ChineseSolarSeason | null
  readonly solarTerm: SolarTermDisplayDefinition | null
  readonly yinYangMovement: AnnualYinYangMovement | null
  readonly solarLongitudeDegrees: number | null
  readonly branchMonth: BranchMonthDefinition | null
  readonly markerAngleDegrees: number | null
  readonly detailsTarget: { readonly kind: 'seasonal-current' }
  readonly methodology: {
    readonly astronomyMethodId: string
    readonly solarTermTableVersion: string
    readonly seasonMethodVersion: string
    readonly yinYangMovementVersion: string
    readonly presenterVersion: string
  }
  readonly warnings: readonly string[]
}

export type CelestialDetailsTarget =
  LunarHomeInstrumentViewModel['detailsTarget'] | SolarHomeInstrumentViewModel['detailsTarget']

export class CelestialPresenterConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CelestialPresenterConflictError'
  }
}
