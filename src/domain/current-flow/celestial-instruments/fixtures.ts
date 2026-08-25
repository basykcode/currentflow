import { EARTHLY_BRANCH_MONTH_DEFINITIONS } from './labels'
import type {
  CantongQiNodeId,
  GlobalConditionsSnapshot,
  LunarPhaseName,
  SeasonalCurrentSource,
} from './types'

const fixtureMethodology = Object.freeze({
  astronomyMethodId: 'development-fixture:not-production-astronomy',
  calendarMethodId: 'development-fixture:not-production-calendar',
  cantongQiMethodId: 'development-fixture:not-production-cantongqi',
})

const fixtureSeasonalMethodology = Object.freeze({
  astronomyMethodId: 'development-fixture:not-production-astronomy',
  solarTermTableVersion: 'solar-term-display-labels:current-en-v1',
  seasonMethodVersion: 'chinese-solar-season-boundaries:v1',
  yinYangMovementVersion: 'development-fixture:not-production-seasonal-semantics',
})

const phaseForElongation = (elongationDegrees: number): LunarPhaseName => {
  const normalized = ((elongationDegrees % 360) + 360) % 360
  if (normalized < 22.5 || normalized >= 337.5) return 'New Moon'
  if (normalized < 67.5) return 'Waxing Crescent'
  if (normalized < 112.5) return 'First Quarter'
  if (normalized < 157.5) return 'Waxing Gibbous'
  if (normalized < 202.5) return 'Full Moon'
  if (normalized < 247.5) return 'Waning Gibbous'
  if (normalized < 292.5) return 'Third Quarter'
  return 'Waning Crescent'
}

const illuminationForElongation = (elongationDegrees: number) =>
  (1 - Math.cos((elongationDegrees * Math.PI) / 180)) / 2

export const createCelestialDevelopmentFixture = (options?: {
  readonly lunarElongationDegrees?: number
  readonly cantongQiNodeId?: CantongQiNodeId
  readonly seasonal?: Partial<SeasonalCurrentSource>
}): GlobalConditionsSnapshot => {
  const elongationDegrees = options?.lunarElongationDegrees ?? 225
  const seasonalDefaults: SeasonalCurrentSource = {
    status: 'computed',
    solarLongitudeDegrees: 150,
    solarTermId: 'chushu',
    season: 'Autumn',
    branchMonth: EARTHLY_BRANCH_MONTH_DEFINITIONS[8],
    yinYangMovement: 'Yang Descending',
    periodBounds: {
      startUtc: '2026-08-23T02:18:58.000Z',
      endExclusiveUtc: '2026-09-07T14:41:44.000Z',
      basisTimeZone: 'UTC',
    },
    methodology: fixtureSeasonalMethodology,
    warnings: ['Development fixture only; not production astronomical data.'],
  }

  const snapshot: GlobalConditionsSnapshot = {
    generatedAtIso: '2026-08-25T12:00:00.000Z',
    lunar: {
      status: 'computed',
      phaseName: phaseForElongation(elongationDegrees),
      elongationDegrees,
      lunationProgress: (((elongationDegrees % 360) + 360) % 360) / 360,
      illuminationFraction: illuminationForElongation(elongationDegrees),
      waxing: ((elongationDegrees % 360) + 360) % 360 < 180,
      cantongQiNodeId: options?.cantongQiNodeId ?? 'xun-distribution',
      periodBounds: {
        startUtc: '2026-08-27T16:00:00.000Z',
        endExclusiveUtc: '2026-09-01T16:00:00.000Z',
        basisTimeZone: 'Asia/Shanghai',
      },
      methodology: fixtureMethodology,
      warnings: ['Development fixture only; not production astronomical data.'],
    },
    seasonal: { ...seasonalDefaults, ...options?.seasonal },
  }
  return Object.freeze(snapshot)
}
