import { describe, expect, it } from 'vitest'

import { getZonedCivilTime } from '@/domain/astrology/civilTime'
import { getOrganMoment } from '@/domain/astrology/organClock'
import { resolveLocalCivilShichenPhase } from '@/domain/astrology/shichenPhaseCoordinate'
import type { OrganMoment } from '@/domain/astrology/types'
import {
  createCelestialDevelopmentFixture,
  type AnnualYinYangMovement,
  type CantongQiNodeId,
  type ChineseSolarSeason,
  type GlobalConditionsSnapshot,
  type InstrumentDataStatus,
} from '@/domain/current-flow/celestial-instruments'
import type { GuidanceDirection } from '@/domain/guidance/types'

import { GUIDANCE_ENVIRONMENT_VERSION, resolveGuidanceEnvironment } from '../guidanceEnvironment'

const FIXTURE_INSTANT = new Date('2026-08-25T12:00:00.000Z')

const createOrgan = (at = FIXTURE_INSTANT, timezone = 'UTC'): OrganMoment => {
  const civil = getZonedCivilTime(at, timezone)
  const phase = resolveLocalCivilShichenPhase(at, civil.timezone)
  return Object.freeze({
    ...getOrganMoment(civil.hour),
    shichen: phase.shichen,
    nextShichen: phase.nextShichen,
    hourPhase: phase.hourPhase,
  })
}

const withStatuses = (status: InstrumentDataStatus): GlobalConditionsSnapshot => {
  const fixture = createCelestialDevelopmentFixture()
  return Object.freeze({
    ...fixture,
    lunar: Object.freeze({ ...fixture.lunar, status }),
    seasonal: Object.freeze({ ...fixture.seasonal, status }),
  })
}

describe('resolveGuidanceEnvironment', () => {
  it.each([
    ['zhen-emergence', 'emerging'],
    ['dui-accumulation', 'building'],
    ['qian-culmination', 'culminating'],
    ['xun-distribution', 'releasing'],
    ['gen-consolidation', 'resting'],
    ['kun-concealment', 'threshold'],
  ] as const)('maps Cantong qi node %s to lunar mode %s', (node, expectedMode) => {
    const result = resolveGuidanceEnvironment(
      createOrgan(),
      createCelestialDevelopmentFixture({ cantongQiNodeId: node }),
    )

    const lunarEvidence = result.environment.evidence?.find(
      (item) => item.source.kind === 'lunar-current',
    )
    expect(result.environment.lunarMode).toBe(expectedMode)
    expect(lunarEvidence).toMatchObject({
      source: { id: `lunar-current-${node}` },
    })
    expect(lunarEvidence?.semanticClaim).toContain(expectedMode)
    expect(result.identityKey).toContain(`lunar-${node}`)
  })

  it.each([
    ['Yang Returning', 'circulating'],
    ['Yang Emerging', 'forward'],
    ['Yang Growing', 'forward'],
    ['Yang Full', 'closing'],
    ['Yang Descending', 'closing'],
    ['Yin Emerging', 'circulating'],
    ['Yin Growing', 'inward'],
    ['Yin Full', 'stabilizing'],
  ] as const satisfies readonly (readonly [AnnualYinYangMovement, GuidanceDirection])[])(
    'maps annual movement %s to subordinate direction %s',
    (movement, expectedDirection) => {
      const result = resolveGuidanceEnvironment(
        createOrgan(),
        createCelestialDevelopmentFixture({
          seasonal: { yinYangMovement: movement },
        }),
      )

      expect(result.environment.secondaryDirection).toBe(expectedDirection)
      expect(result.environment.backgroundThemes?.[0]?.label).toContain(movement)
    },
  )

  it.each([
    ['Spring', ['advance', 'adapt', 'clarify'], ['maintain-rhythm', 'allow-space']],
    ['Summer', ['advance', 'clarify', 'complete'], ['restore-circulation', 'maintain-rhythm']],
    ['Autumn', ['complete', 'release', 'clarify'], ['settle', 'allow-space']],
    ['Winter', ['gather', 'nourish', 'pause'], ['settle', 'reduce-pace']],
  ] as const satisfies readonly (readonly [
    ChineseSolarSeason,
    readonly string[],
    readonly string[],
  ])[])('maps %s to its Current seasonal work background', (season, strategic, somatic) => {
    const result = resolveGuidanceEnvironment(
      createOrgan(),
      createCelestialDevelopmentFixture({ seasonal: { season } }),
    )

    const seasonalTheme = result.environment.backgroundThemes?.[0]
    expect(seasonalTheme).toMatchObject({
      kind: 'seasonal-current',
      strategicVectors: strategic,
      somaticVectors: somatic,
    })
    expect(seasonalTheme?.label).toContain(season)
  })

  it.each([
    'verified',
    'computed',
    'partial',
    'unavailable',
  ] as const satisfies readonly InstrumentDataStatus[])(
    'preserves %s Global Conditions evidence status',
    (status) => {
      const result = resolveGuidanceEnvironment(createOrgan(), withStatuses(status))
      const lunar = result.environment.evidence?.find(
        (item) => item.source.kind === 'lunar-current',
      )
      const seasonal = result.environment.evidence?.find(
        (item) => item.source.kind === 'seasonal-current',
      )

      expect(lunar?.provenance.status).toBe(status)
      expect(seasonal?.provenance.status).toBe(status)
    },
  )

  it('propagates the active Organ identity and element with Current methodology', () => {
    const organ = createOrgan()
    const result = resolveGuidanceEnvironment(organ, createCelestialDevelopmentFixture())

    expect(result.environment.version).toBe(GUIDANCE_ENVIRONMENT_VERSION)
    expect(organ).toMatchObject({ key: 'heart', nameEnglish: 'Heart period', element: 'fire' })
    expect(result.environment.activeOrgan).toEqual({
      key: 'heart',
      nameEnglish: 'Heart',
      nameChinese: '心',
      element: 'fire',
      sourceLabel: organ.sourceLabel,
      methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
    })
    expect(
      result.environment.evidence?.find((item) => item.source.kind === 'active-organ'),
    ).toMatchObject({
      source: { id: 'active-organ-heart' },
      provenance: { methodologyId: GUIDANCE_ENVIRONMENT_VERSION },
    })
  })

  it('preserves active Organ evidence status and cache identity inputs', () => {
    const computedOrgan = createOrgan()
    const demoOrgan: OrganMoment = Object.freeze({
      ...computedOrgan,
      status: 'demo',
      sourceLabel: 'Explicit demo organ fixture',
    })
    const computed = resolveGuidanceEnvironment(computedOrgan, createCelestialDevelopmentFixture())
    const demo = resolveGuidanceEnvironment(demoOrgan, createCelestialDevelopmentFixture())
    const demoEvidence = demo.environment.evidence?.find(
      (item) => item.source.kind === 'active-organ',
    )

    expect(demoEvidence?.provenance.status).toBe('demo')
    expect(demo.identityKey).not.toBe(computed.identityKey)
  })

  it('emits exact Cantong and Solar Term semantic boundaries', () => {
    const fixture = createCelestialDevelopmentFixture()
    const result = resolveGuidanceEnvironment(createOrgan(), fixture)

    expect(result.boundaries).toEqual([
      {
        atUtc: fixture.lunar.periodBounds?.endExclusiveUtc,
        reason: 'lunar-node-change',
      },
      {
        atUtc: fixture.seasonal.periodBounds?.endExclusiveUtc,
        reason: 'solar-term-boundary',
      },
    ])
  })

  it('does not derive semantics from raw lunar or solar measurements', () => {
    const first = createCelestialDevelopmentFixture({
      lunarElongationDegrees: 45,
      seasonal: { solarLongitudeDegrees: 15 },
    })
    const secondBase = createCelestialDevelopmentFixture({
      lunarElongationDegrees: 225,
      seasonal: { solarLongitudeDegrees: 285 },
    })
    const second: GlobalConditionsSnapshot = Object.freeze({
      ...secondBase,
      lunar: Object.freeze({
        ...secondBase.lunar,
        illuminationFraction: 0.01,
        lunationProgress: 0.99,
        waxing: !secondBase.lunar.waxing,
      }),
    })

    const firstResolution = resolveGuidanceEnvironment(createOrgan(), first)
    const secondResolution = resolveGuidanceEnvironment(createOrgan(), second)

    expect(secondResolution.environment).toEqual(firstResolution.environment)
    expect(secondResolution.boundaries).toEqual(firstResolution.boundaries)
    expect(secondResolution.identityKey).toBe(firstResolution.identityKey)
  })

  it('keys annual movement independently when a seasonal label is unavailable', () => {
    const first = createCelestialDevelopmentFixture({
      seasonal: { season: null, solarTermId: null, yinYangMovement: 'Yang Emerging' },
    })
    const second = createCelestialDevelopmentFixture({
      seasonal: { season: null, solarTermId: null, yinYangMovement: 'Yin Full' },
    })
    const firstResolution = resolveGuidanceEnvironment(createOrgan(), first)
    const secondResolution = resolveGuidanceEnvironment(createOrgan(), second)

    expect(firstResolution.environment.secondaryDirection).toBe('forward')
    expect(secondResolution.environment.secondaryDirection).toBe('stabilizing')
    const movementEvidence = firstResolution.environment.evidence?.find((item) =>
      item.source.id.startsWith('annual-movement-'),
    )
    expect(movementEvidence?.semanticClaim).toContain('forward subordinate direction')
    expect(movementEvidence?.provenance.methodologyId).toBe(GUIDANCE_ENVIRONMENT_VERSION)
    expect(movementEvidence?.provenance.sourceIds).toContain('Yang Emerging')
    expect(secondResolution.identityKey).not.toBe(firstResolution.identityKey)
  })

  it('keys the seasonal label separately from the solar-term identity', () => {
    const first = createCelestialDevelopmentFixture({ seasonal: { season: 'Autumn' } })
    const second = createCelestialDevelopmentFixture({ seasonal: { season: 'Winter' } })

    expect(first.seasonal.solarTermId).toBe(second.seasonal.solarTermId)
    expect(resolveGuidanceEnvironment(createOrgan(), second).identityKey).not.toBe(
      resolveGuidanceEnvironment(createOrgan(), first).identityKey,
    )
  })

  it('includes contributing seasonal methodology in the cache identity', () => {
    const first = createCelestialDevelopmentFixture()
    const second: GlobalConditionsSnapshot = Object.freeze({
      ...first,
      seasonal: Object.freeze({
        ...first.seasonal,
        methodology: Object.freeze({
          ...first.seasonal.methodology,
          astronomyMethodId: 'corrected-seasonal-astronomy@test',
        }),
      }),
    })

    expect(resolveGuidanceEnvironment(createOrgan(), second).identityKey).not.toBe(
      resolveGuidanceEnvironment(createOrgan(), first).identityKey,
    )
  })

  it('labels missing environment signals and retains only the bounded profile fallback', () => {
    const result = resolveGuidanceEnvironment(createOrgan())
    const lunar = result.environment.evidence?.find((item) => item.source.kind === 'lunar-current')
    const seasonal = result.environment.evidence?.find(
      (item) => item.source.kind === 'seasonal-current',
    )

    expect(result.environment.lunarMode).toBeUndefined()
    expect(result.environment.secondaryDirection).toBeUndefined()
    expect(result.environment.backgroundThemes).toBeUndefined()
    expect(result.boundaries).toEqual([])
    expect(lunar).toMatchObject({ provenance: { status: 'unavailable' } })
    expect(seasonal).toMatchObject({ provenance: { status: 'unavailable' } })
    expect(result.identityKey).toContain('lunar-profile-fallback-unavailable-unbounded-unbounded')
  })

  it('uses only declared Cantong and seasonal classifications', () => {
    const nodes: readonly CantongQiNodeId[] = [
      'zhen-emergence',
      'dui-accumulation',
      'qian-culmination',
      'xun-distribution',
      'gen-consolidation',
      'kun-concealment',
    ]

    expect(
      nodes.map(
        (node) =>
          resolveGuidanceEnvironment(
            createOrgan(),
            createCelestialDevelopmentFixture({ cantongQiNodeId: node }),
          ).environment.lunarMode,
      ),
    ).toEqual(['emerging', 'building', 'culminating', 'releasing', 'resting', 'threshold'])
  })
})
