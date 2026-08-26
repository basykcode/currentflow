import {
  Body,
  Illumination,
  MoonPhase,
  SearchMoonPhase,
  SearchMoonQuarter,
  SearchSunLongitude,
  SunPosition,
  type AstroTime,
  type MoonQuarter,
} from 'astronomy-engine'

import {
  getSolarTermDisplayDefinitionByLongitude,
  SOLAR_TERM_DISPLAY_DEFINITIONS,
} from '@/domain/current-flow/celestial-instruments/labels'

import { classifyLunarMotion, classifyLunarPhase, CARDINAL_EVENT_EPSILON_DEGREES } from './lunarPhase'
import { ASTRONOMY_ENGINE_VERSION, CELESTIAL_ASTRONOMY_METHODOLOGY } from './methodology'
import { angularDistanceDegrees, normalizeDegrees, parseAbsoluteUtcInstant } from './normalization'
import {
  CelestialCalculationError,
  type CelestialEphemerisProvider,
  type CelestialEphemerisSnapshot,
  type LunarAstronomySnapshot,
  type LunarQuarterEvent,
  type LunarQuarterName,
  type SolarAstronomySnapshot,
  type SolarTermEvent,
} from './types'

const DAY_MS = 86_400_000
const EVENT_SEARCH_EPSILON_MS = 1_000
const LUNAR_SEARCH_DAYS = 40
const SOLAR_SEARCH_DAYS = 24
const MAX_CACHE_ENTRIES = 12

const QUARTER_NAMES: readonly LunarQuarterName[] = [
  'new',
  'first-quarter',
  'full',
  'third-quarter',
]

type LunarEventBracket = Readonly<{
  previousNewMoonUtc: string
  nextNewMoonUtc: string
  previousMs: number
  nextMs: number
}>

type QuarterCacheEntry = Readonly<{
  validFromMs: number
  validUntilMs: number
  event: LunarQuarterEvent
}>

type SolarTermBracket = Readonly<{
  previousSolarTerm: SolarTermEvent
  currentSolarTerm: SolarTermEvent
  nextSolarTerm: SolarTermEvent
  validFromMs: number
  validUntilMs: number
}>

const freezeEvent = (event: SolarTermEvent) => Object.freeze(event)

const trimCache = <T>(cache: T[]) => {
  if (cache.length > MAX_CACHE_ENTRIES) cache.splice(0, cache.length - MAX_CACHE_ENTRIES)
}

const requireSearchResult = (
  result: AstroTime | null,
  code: 'moon-phase-search-failure' | 'solar-longitude-search-failure',
  message: string,
) => {
  if (!result) throw new CelestialCalculationError(code, message)
  return result
}

const quarterEvent = (value: MoonQuarter): LunarQuarterEvent => {
  const quarter = QUARTER_NAMES[value.quarter]
  if (!quarter) {
    throw new CelestialCalculationError(
      'moon-phase-search-failure',
      `Astronomy Engine returned unsupported Moon quarter index ${value.quarter}.`,
    )
  }
  return Object.freeze({ quarter, instantUtc: value.time.date.toISOString() })
}

const eventFor = (targetLongitudeDegrees: number, instantUtc: string): SolarTermEvent => {
  const definition = getSolarTermDisplayDefinitionByLongitude(targetLongitudeDegrees)
  if (!definition) {
    throw new CelestialCalculationError(
      'solar-term-resolution-failure',
      `No reviewed Solar Term exists at ${targetLongitudeDegrees} degrees.`,
    )
  }
  return freezeEvent({
    id: definition.id,
    targetLongitudeDegrees: definition.solarLongitudeDegrees,
    instantUtc,
  })
}

const searchSolarCrossing = (targetLongitudeDegrees: number, startMs: number) =>
  requireSearchResult(
    SearchSunLongitude(targetLongitudeDegrees, new Date(startMs), SOLAR_SEARCH_DAYS),
    'solar-longitude-search-failure',
    `Unable to find the ${targetLongitudeDegrees}-degree Solar Term crossing in the bounded search window.`,
  )

const candidateSolarTermLongitude = (longitudeDegrees: number) => {
  const longitude = normalizeDegrees(longitudeDegrees)
  const nearest = normalizeDegrees(Math.round(longitude / 15) * 15)
  if (angularDistanceDegrees(longitude, nearest) <= CARDINAL_EVENT_EPSILON_DEGREES) return nearest
  return Math.floor(longitude / 15) * 15
}

const snapSolarTermBoundary = (longitudeDegrees: number) => {
  const longitude = normalizeDegrees(longitudeDegrees)
  const nearest = normalizeDegrees(Math.round(longitude / 15) * 15)
  return angularDistanceDegrees(longitude, nearest) <= CARDINAL_EVENT_EPSILON_DEGREES
    ? nearest
    : longitude
}

export class AstronomyEngineCelestialProvider implements CelestialEphemerisProvider {
  readonly providerId = 'astronomy-engine' as const
  readonly providerVersion = ASTRONOMY_ENGINE_VERSION

  private readonly lunarEventCache: LunarEventBracket[] = []
  private readonly quarterCache: QuarterCacheEntry[] = []
  private readonly solarTermCache: SolarTermBracket[] = []

  calculate(instantUtc: string): CelestialEphemerisSnapshot {
    const parsed = parseAbsoluteUtcInstant(instantUtc)
    try {
      return Object.freeze({
        instantUtc: parsed.instantUtc,
        lunar: this.calculateLunarAt(parsed.time),
        solar: this.calculateSolarAt(parsed.time),
        provider: Object.freeze({ id: this.providerId, version: this.providerVersion }),
        status: 'computed',
        warnings: Object.freeze([]),
      })
    } catch (error) {
      if (error instanceof CelestialCalculationError) throw error
      throw new CelestialCalculationError(
        'astronomy-engine-failure',
        'The local astronomy engine could not calculate the requested instant.',
        { cause: error },
      )
    }
  }

  calculateLunar(instantUtc: string): LunarAstronomySnapshot {
    const { time } = parseAbsoluteUtcInstant(instantUtc)
    try {
      return this.calculateLunarAt(time)
    } catch (error) {
      if (error instanceof CelestialCalculationError) throw error
      throw new CelestialCalculationError(
        'astronomy-engine-failure',
        'The local astronomy engine could not calculate lunar conditions.',
        { cause: error },
      )
    }
  }

  calculateSolar(instantUtc: string): SolarAstronomySnapshot {
    const { time } = parseAbsoluteUtcInstant(instantUtc)
    try {
      return this.calculateSolarAt(time)
    } catch (error) {
      if (error instanceof CelestialCalculationError) throw error
      throw new CelestialCalculationError(
        'astronomy-engine-failure',
        'The local astronomy engine could not calculate solar conditions.',
        { cause: error },
      )
    }
  }

  private calculateLunarAt(time: AstroTime): LunarAstronomySnapshot {
    const elongationDegrees = normalizeDegrees(MoonPhase(time))
    const illuminationFraction = Illumination(Body.Moon, time).phase_fraction
    if (!(illuminationFraction >= 0 && illuminationFraction <= 1)) {
      throw new CelestialCalculationError(
        'astronomy-engine-failure',
        'Astronomy Engine returned Moon illumination outside [0, 1].',
      )
    }

    const bracket = this.resolveLunarEvents(time)
    const nextQuarter = this.resolveNextQuarter(time)
    const instantMs = time.date.getTime()
    const lunarAgeDays = (instantMs - bracket.previousMs) / DAY_MS
    const lunationDurationDays = (bracket.nextMs - bracket.previousMs) / DAY_MS
    const lunationProgress = lunarAgeDays / lunationDurationDays

    if (
      lunarAgeDays < 0 ||
      lunationDurationDays <= 0 ||
      lunationProgress < 0 ||
      lunationProgress >= 1
    ) {
      throw new CelestialCalculationError(
        'moon-phase-search-failure',
        'The bounded New Moon events did not form a valid lunation around the requested instant.',
      )
    }

    return Object.freeze({
      elongationDegrees,
      illuminationFraction,
      phaseName: classifyLunarPhase(elongationDegrees),
      motion: classifyLunarMotion(elongationDegrees),
      previousNewMoonUtc: bracket.previousNewMoonUtc,
      nextNewMoonUtc: bracket.nextNewMoonUtc,
      nextQuarter,
      lunarAgeDays,
      lunationDurationDays,
      lunationProgress,
      methodology: Object.freeze({
        ephemeris: Object.freeze({
          methodId: CELESTIAL_ASTRONOMY_METHODOLOGY.ephemeris,
          providerId: this.providerId,
          providerVersion: this.providerVersion,
        }),
        elongationMethodId: CELESTIAL_ASTRONOMY_METHODOLOGY.lunarElongation,
        illuminationMethodId: CELESTIAL_ASTRONOMY_METHODOLOGY.lunarIllumination,
        eventSearchMethodId: CELESTIAL_ASTRONOMY_METHODOLOGY.lunarEvents,
        phasePolicyId: CELESTIAL_ASTRONOMY_METHODOLOGY.lunarPhasePolicy,
      }),
    })
  }

  private calculateSolarAt(time: AstroTime): SolarAstronomySnapshot {
    const apparentSolarLongitudeDegrees = snapSolarTermBoundary(SunPosition(time).elon)
    const bracket = this.resolveSolarTerms(time, apparentSolarLongitudeDegrees)
    return Object.freeze({
      apparentSolarLongitudeDegrees,
      currentSolarTerm: bracket.currentSolarTerm,
      previousSolarTerm: bracket.previousSolarTerm,
      nextSolarTerm: bracket.nextSolarTerm,
      methodology: Object.freeze({
        ephemeris: Object.freeze({
          methodId: CELESTIAL_ASTRONOMY_METHODOLOGY.ephemeris,
          providerId: this.providerId,
          providerVersion: this.providerVersion,
        }),
        longitudeMethodId: CELESTIAL_ASTRONOMY_METHODOLOGY.solarLongitude,
        eventSearchMethodId: CELESTIAL_ASTRONOMY_METHODOLOGY.solarTermEvents,
      }),
    })
  }

  private resolveLunarEvents(time: AstroTime): LunarEventBracket {
    const instantMs = time.date.getTime()
    const cached = this.lunarEventCache.find(
      ({ previousMs, nextMs }) => previousMs <= instantMs && instantMs < nextMs,
    )
    if (cached) return cached

    const previous = requireSearchResult(
      SearchMoonPhase(0, new Date(instantMs + EVENT_SEARCH_EPSILON_MS), -LUNAR_SEARCH_DAYS),
      'moon-phase-search-failure',
      'Unable to find the preceding New Moon in the bounded search window.',
    )
    const next = requireSearchResult(
      SearchMoonPhase(0, new Date(instantMs + EVENT_SEARCH_EPSILON_MS), LUNAR_SEARCH_DAYS),
      'moon-phase-search-failure',
      'Unable to find the following New Moon in the bounded search window.',
    )
    const previousMs = previous.date.getTime()
    const nextMs = next.date.getTime()
    if (previousMs > instantMs || nextMs <= instantMs || previousMs === nextMs) {
      throw new CelestialCalculationError(
        'moon-phase-search-failure',
        'New Moon searches did not return distinct events bracketing the requested instant.',
      )
    }

    const bracket = Object.freeze({
      previousNewMoonUtc: previous.date.toISOString(),
      nextNewMoonUtc: next.date.toISOString(),
      previousMs,
      nextMs,
    })
    this.lunarEventCache.push(bracket)
    trimCache(this.lunarEventCache)
    return bracket
  }

  private resolveNextQuarter(time: AstroTime): LunarQuarterEvent {
    const instantMs = time.date.getTime()
    const cached = this.quarterCache.find(
      ({ validFromMs, validUntilMs }) => validFromMs <= instantMs && instantMs < validUntilMs,
    )
    if (cached) return cached.event

    const event = quarterEvent(SearchMoonQuarter(new Date(instantMs + EVENT_SEARCH_EPSILON_MS)))
    const validUntilMs = new Date(event.instantUtc).getTime()
    if (validUntilMs <= instantMs) {
      throw new CelestialCalculationError(
        'moon-phase-search-failure',
        'The next Moon quarter was not strictly after the requested instant.',
      )
    }
    this.quarterCache.push(Object.freeze({ validFromMs: instantMs, validUntilMs, event }))
    trimCache(this.quarterCache)
    return event
  }

  private resolveSolarTerms(time: AstroTime, longitudeDegrees: number): SolarTermBracket {
    const instantMs = time.date.getTime()
    const cached = this.solarTermCache.find(
      ({ validFromMs, validUntilMs }) => validFromMs <= instantMs && instantMs < validUntilMs,
    )
    if (cached) return cached

    let currentTarget = candidateSolarTermLongitude(longitudeDegrees)
    let current = searchSolarCrossing(currentTarget, instantMs - 20 * DAY_MS)
    if (current.date.getTime() > instantMs) {
      currentTarget = normalizeDegrees(currentTarget - 15)
      current = searchSolarCrossing(currentTarget, instantMs - 20 * DAY_MS)
    }
    if (current.date.getTime() > instantMs) {
      throw new CelestialCalculationError(
        'solar-term-resolution-failure',
        'The candidate Solar Term crossing occurred after the requested instant.',
      )
    }

    const previousTarget = normalizeDegrees(currentTarget - 15)
    const nextTarget = normalizeDegrees(currentTarget + 15)
    const previous = searchSolarCrossing(previousTarget, current.date.getTime() - 20 * DAY_MS)
    const next = searchSolarCrossing(nextTarget, current.date.getTime() + EVENT_SEARCH_EPSILON_MS)
    const validFromMs = current.date.getTime()
    const validUntilMs = next.date.getTime()
    if (!(previous.date.getTime() < validFromMs && validFromMs <= instantMs && instantMs < validUntilMs)) {
      throw new CelestialCalculationError(
        'solar-term-resolution-failure',
        'Solar Term searches did not return ordered events around the requested instant.',
      )
    }

    const bracket = Object.freeze({
      previousSolarTerm: eventFor(previousTarget, previous.date.toISOString()),
      currentSolarTerm: eventFor(currentTarget, current.date.toISOString()),
      nextSolarTerm: eventFor(nextTarget, next.date.toISOString()),
      validFromMs,
      validUntilMs,
    })
    this.solarTermCache.push(bracket)
    trimCache(this.solarTermCache)
    return bracket
  }
}

if (SOLAR_TERM_DISPLAY_DEFINITIONS.length !== 24) {
  throw new Error('The astronomy adapter requires the reviewed 24-term registry.')
}
