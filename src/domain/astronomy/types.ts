export type CalculationStatus =
  | 'verified'
  | 'computed'
  | 'partial'
  | 'unavailable'
  | 'invalid-input'

export type LunarPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Third Quarter'
  | 'Waning Crescent'

export type LunarMotion = 'waxing' | 'waning' | 'turning-at-new' | 'turning-at-full'

export type LunarQuarterName = 'new' | 'first-quarter' | 'full' | 'third-quarter'

export interface MethodologyMetadata {
  readonly methodId: string
  readonly providerId: 'astronomy-engine'
  readonly providerVersion: string
}

export interface LunarQuarterEvent {
  readonly quarter: LunarQuarterName
  readonly instantUtc: string
}

export interface SolarTermEvent {
  readonly id: string
  readonly targetLongitudeDegrees: number
  readonly instantUtc: string
}

export interface LunarAstronomySnapshot {
  readonly elongationDegrees: number
  readonly illuminationFraction: number
  readonly phaseName: LunarPhaseName
  readonly motion: LunarMotion
  readonly previousNewMoonUtc: string
  readonly nextNewMoonUtc: string
  readonly nextQuarter: LunarQuarterEvent
  readonly lunarAgeDays: number
  readonly lunationDurationDays: number
  readonly lunationProgress: number
  readonly methodology: {
    readonly ephemeris: MethodologyMetadata
    readonly elongationMethodId: string
    readonly illuminationMethodId: string
    readonly eventSearchMethodId: string
    readonly phasePolicyId: string
  }
}

export interface SolarAstronomySnapshot {
  readonly apparentSolarLongitudeDegrees: number
  readonly currentSolarTerm: SolarTermEvent
  readonly previousSolarTerm: SolarTermEvent
  readonly nextSolarTerm: SolarTermEvent
  readonly methodology: {
    readonly ephemeris: MethodologyMetadata
    readonly longitudeMethodId: string
    readonly eventSearchMethodId: string
  }
}

export interface CelestialEphemerisSnapshot {
  readonly instantUtc: string
  readonly lunar: LunarAstronomySnapshot
  readonly solar: SolarAstronomySnapshot
  readonly provider: {
    readonly id: 'astronomy-engine'
    readonly version: string
  }
  readonly status: CalculationStatus
  readonly warnings: readonly string[]
}

export interface CelestialEphemerisProvider {
  readonly providerId: 'astronomy-engine'
  readonly providerVersion: string
  calculate(instantUtc: string): CelestialEphemerisSnapshot
}

export type CelestialCalculationErrorCode =
  | 'invalid-celestial-instant'
  | 'astronomy-engine-failure'
  | 'moon-phase-search-failure'
  | 'solar-longitude-search-failure'
  | 'solar-term-resolution-failure'

export class CelestialCalculationError extends Error {
  readonly cause?: unknown

  constructor(
    readonly code: CelestialCalculationErrorCode,
    message: string,
    options?: Readonly<{ cause?: unknown }>,
  ) {
    super(message)
    this.name = 'CelestialCalculationError'
    this.cause = options?.cause
  }
}
