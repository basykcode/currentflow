import {
  AstronomyEngineCelestialProvider,
  CelestialCalculationError,
  type LunarAstronomySnapshot,
  type SolarAstronomySnapshot,
} from '@/domain/astronomy'
import { getZonedCivilTime, zonedWallTimeToUtc } from '@/domain/astrology/civilTime'
import {
  calculateChineseLunarCalendar,
  CELESTIAL_INSTRUMENT_METHODOLOGY,
  CHINESE_CALENDAR_REFERENCE_TIME_ZONE,
  presentLunarHomeInstrument,
  presentSolarHomeInstrument,
  resolveAnnualYinYangMovement,
  resolveBranchMonthFromSolarLongitude,
  resolveCantongQiNodeId,
  resolveChineseSolarSeason,
  type CelestialCurrentSnapshot,
  type ChineseLunarCalendarSnapshot,
  type GlobalConditionsSnapshot,
  type LunarCurrentSource,
  type LunarHomeInstrumentViewModel,
  type SeasonalCurrentSource,
  type SolarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

const HOUR_MS = 3_600_000
const UNAVAILABLE_METHOD = 'unavailable:local-celestial-calculation-failure'

export type CelestialPresentationMode = 'live' | 'selected'

type HomeCache<T> = Readonly<{
  validFromMs: number
  validUntilMs: number
  viewModel: T
}>

type EphemerisAdapter = Readonly<{
  providerId: 'astronomy-engine'
  providerVersion: string
  calculateLunar: (instantUtc: string) => LunarAstronomySnapshot
  calculateSolar: (instantUtc: string) => SolarAstronomySnapshot
}>

const nextWholeHourMs = (instantMs: number) =>
  Math.floor(instantMs / HOUR_MS) * HOUR_MS + HOUR_MS

const nextShanghaiMidnightMs = (instant: Date) => {
  const civil = getZonedCivilTime(instant, CHINESE_CALENDAR_REFERENCE_TIME_ZONE)
  const nextDate = new Date(Date.UTC(civil.year, civil.month - 1, civil.day + 1))
  return new Date(
    zonedWallTimeToUtc(
      {
        year: nextDate.getUTCFullYear(),
        month: nextDate.getUTCMonth() + 1,
        day: nextDate.getUTCDate(),
        hour: 0,
        minute: 0,
        second: 0,
      },
      CHINESE_CALENDAR_REFERENCE_TIME_ZONE,
    ),
  ).getTime()
}

const safeWarning = (scope: 'Moon' | 'Sun' | 'Chinese calendar', error: unknown) => {
  const code =
    error instanceof CelestialCalculationError
      ? error.code
      : error instanceof Error && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'celestial-provider-failure'
  return `${scope} unavailable (${code}); no replacement value was inferred.`
}

const statusFrom = (
  lunar: LunarAstronomySnapshot | null,
  solar: SolarAstronomySnapshot | null,
  calendar: ChineseLunarCalendarSnapshot | null,
) => {
  if (!lunar && !solar) return 'unavailable' as const
  if (!lunar || !solar || !calendar) return 'partial' as const
  return 'computed' as const
}

export class LocalDeterministicCelestialCurrentProvider {
  private lunarHomeCache: HomeCache<LunarHomeInstrumentViewModel> | null = null
  private solarHomeCache: HomeCache<SolarHomeInstrumentViewModel> | null = null

  constructor(
    private readonly ephemeris: EphemerisAdapter = new AstronomyEngineCelestialProvider(),
  ) {}

  calculate(
    at: Date,
    options: Readonly<{ mode?: CelestialPresentationMode }> = {},
  ): CelestialCurrentSnapshot {
    if (Number.isNaN(at.getTime())) throw new Error('A valid instant is required for Celestial Current.')
    const instantUtc = at.toISOString()
    const instantMs = at.getTime()
    const mode = options.mode ?? 'live'
    const warnings: string[] = []

    let lunar: LunarAstronomySnapshot | null = null
    let solar: SolarAstronomySnapshot | null = null
    let chineseCalendar: ChineseLunarCalendarSnapshot | null = null

    try {
      lunar = this.ephemeris.calculateLunar(instantUtc)
    } catch (error) {
      warnings.push(safeWarning('Moon', error))
    }
    try {
      solar = this.ephemeris.calculateSolar(instantUtc)
    } catch (error) {
      warnings.push(safeWarning('Sun', error))
    }
    try {
      chineseCalendar = calculateChineseLunarCalendar(instantUtc)
    } catch (error) {
      warnings.push(safeWarning('Chinese calendar', error))
    }

    const lunarSource = this.createLunarSource(lunar, chineseCalendar, warnings)
    const solarSource = this.createSolarSource(solar, chineseCalendar, warnings)
    const globalConditions: GlobalConditionsSnapshot = Object.freeze({
      generatedAtIso: instantUtc,
      lunar: lunarSource,
      seasonal: solarSource,
    })
    const lunarHome = this.presentLunar(lunarSource, lunar, instantMs, mode)
    const solarHome = this.presentSolar(solarSource, solar, at, mode)
    const updateCandidates = [
      lunar ? nextWholeHourMs(instantMs) : Number.POSITIVE_INFINITY,
      lunar ? new Date(lunar.nextQuarter.instantUtc).getTime() : Number.POSITIVE_INFINITY,
      solar ? nextShanghaiMidnightMs(at) : Number.POSITIVE_INFINITY,
      solar ? new Date(solar.nextSolarTerm.instantUtc).getTime() : Number.POSITIVE_INFINITY,
    ].filter((value) => Number.isFinite(value) && value > instantMs)
    const nextRecommendedUpdateUtc =
      mode === 'selected' || updateCandidates.length === 0
        ? null
        : new Date(Math.min(...updateCandidates)).toISOString()

    return Object.freeze({
      instantUtc,
      astronomy: Object.freeze({ lunar, solar }),
      chineseCalendar,
      globalConditions,
      lunarHome,
      solarHome,
      methodology: Object.freeze({
        astronomyProviderId: this.ephemeris.providerId,
        astronomyProviderVersion: this.ephemeris.providerVersion,
        chineseCalendarProviderId: 'lunar-javascript',
        chineseCalendarProviderVersion: '1.7.7',
        snapshotVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.celestialSnapshot,
      }),
      status: statusFrom(lunar, solar, chineseCalendar),
      warnings: Object.freeze([...warnings]),
      nextRecommendedUpdateUtc,
    })
  }

  private createLunarSource(
    lunar: LunarAstronomySnapshot | null,
    calendar: ChineseLunarCalendarSnapshot | null,
    warnings: readonly string[],
  ): LunarCurrentSource {
    return Object.freeze({
      status: lunar ? (calendar ? 'computed' : 'partial') : 'unavailable',
      phaseName: lunar?.phaseName ?? null,
      elongationDegrees: lunar?.elongationDegrees ?? null,
      lunationProgress: lunar?.lunationProgress ?? null,
      illuminationFraction: lunar?.illuminationFraction ?? null,
      waxing: lunar ? lunar.elongationDegrees < 180 : null,
      cantongQiNodeId: calendar ? resolveCantongQiNodeId(calendar.lunarDay) : null,
      methodology: Object.freeze({
        astronomyMethodId:
          lunar?.methodology.ephemeris.methodId ?? UNAVAILABLE_METHOD,
        calendarMethodId:
          calendar?.methodologyId ?? UNAVAILABLE_METHOD,
        cantongQiMethodId: CELESTIAL_INSTRUMENT_METHODOLOGY.lunarLabels,
      }),
      warnings: Object.freeze([...warnings]),
    })
  }

  private createSolarSource(
    solar: SolarAstronomySnapshot | null,
    calendar: ChineseLunarCalendarSnapshot | null,
    warnings: string[],
  ): SeasonalCurrentSource {
    const longitude = solar?.apparentSolarLongitudeDegrees ?? null
    const branchMonth = longitude === null ? null : resolveBranchMonthFromSolarLongitude(longitude)
    if (branchMonth && calendar && branchMonth.character !== calendar.monthPillarBranch) {
      warnings.push(
        `Astronomical Branch ${branchMonth.character} differs from the lunar-javascript exact Month Pillar Branch ${calendar.monthPillarBranch} at this instant.`,
      )
    }
    const solarTermId = solar?.currentSolarTerm.id ?? null
    return Object.freeze({
      status: solar ? 'computed' : 'unavailable',
      solarLongitudeDegrees: longitude,
      solarTermId,
      season: longitude === null ? null : resolveChineseSolarSeason(longitude),
      branchMonth,
      yinYangMovement: solarTermId ? resolveAnnualYinYangMovement(solarTermId) : null,
      methodology: Object.freeze({
        astronomyMethodId: solar?.methodology.ephemeris.methodId ?? UNAVAILABLE_METHOD,
        solarTermTableVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.solarTermDisplay,
        seasonMethodVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.chineseSolarSeason,
        yinYangMovementVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.annualMovement,
      }),
      warnings: Object.freeze([...warnings]),
    })
  }

  private presentLunar(
    source: LunarCurrentSource,
    astronomy: LunarAstronomySnapshot | null,
    instantMs: number,
    mode: CelestialPresentationMode,
  ) {
    if (
      mode === 'live' &&
      astronomy &&
      this.lunarHomeCache &&
      this.lunarHomeCache.validFromMs <= instantMs &&
      instantMs < this.lunarHomeCache.validUntilMs
    ) {
      return this.lunarHomeCache.viewModel
    }
    const viewModel = presentLunarHomeInstrument(source)
    if (mode === 'live' && astronomy) {
      this.lunarHomeCache = Object.freeze({
        validFromMs: instantMs,
        validUntilMs: Math.min(
          nextWholeHourMs(instantMs),
          new Date(astronomy.nextQuarter.instantUtc).getTime(),
        ),
        viewModel,
      })
    }
    return viewModel
  }

  private presentSolar(
    source: SeasonalCurrentSource,
    astronomy: SolarAstronomySnapshot | null,
    instant: Date,
    mode: CelestialPresentationMode,
  ) {
    const instantMs = instant.getTime()
    if (
      mode === 'live' &&
      astronomy &&
      this.solarHomeCache &&
      this.solarHomeCache.validFromMs <= instantMs &&
      instantMs < this.solarHomeCache.validUntilMs
    ) {
      return this.solarHomeCache.viewModel
    }
    const viewModel = presentSolarHomeInstrument(source)
    if (mode === 'live' && astronomy) {
      this.solarHomeCache = Object.freeze({
        validFromMs: instantMs,
        validUntilMs: Math.min(
          nextShanghaiMidnightMs(instant),
          new Date(astronomy.nextSolarTerm.instantUtc).getTime(),
        ),
        viewModel,
      })
    }
    return viewModel
  }
}

export const celestialCurrentProvider = new LocalDeterministicCelestialCurrentProvider()
