import { describe, expect, it } from 'vitest'

import {
  createCelestialDevelopmentFixture,
  type CantongQiNodeId,
  type GlobalConditionsSnapshot,
} from '@/domain/current-flow/celestial-instruments'

import knownDates from '../../../fixtures/temporal-hexagram-validation/known-dates.json'

import { LunarScriptCurrentFlowProvider } from '../lunarScriptCurrentFlow'

type CelestialFixtureOptions = NonNullable<Parameters<typeof createCelestialDevelopmentFixture>[0]>

const conditionsAt = (at: Date, options?: CelestialFixtureOptions): GlobalConditionsSnapshot => {
  const fixture = createCelestialDevelopmentFixture(options)
  return Object.freeze({ ...fixture, generatedAtIso: at.toISOString() })
}

const conditionsWithBoundaryEnds = (
  at: Date,
  lunarEndExclusiveUtc: string,
  seasonalEndExclusiveUtc: string,
): GlobalConditionsSnapshot => {
  const fixture = conditionsAt(at)
  if (!fixture.lunar.periodBounds || !fixture.seasonal.periodBounds) {
    throw new Error('The Celestial development fixture requires exact period bounds.')
  }
  return Object.freeze({
    ...fixture,
    lunar: Object.freeze({
      ...fixture.lunar,
      periodBounds: Object.freeze({
        ...fixture.lunar.periodBounds,
        endExclusiveUtc: lunarEndExclusiveUtc,
      }),
    }),
    seasonal: Object.freeze({
      ...fixture.seasonal,
      periodBounds: Object.freeze({
        ...fixture.seasonal.periodBounds,
        endExclusiveUtc: seasonalEndExclusiveUtc,
      }),
    }),
  })
}

describe('LunarScriptCurrentFlowProvider', () => {
  it('validates Ganzhi before mapping each versioned known-date fixture', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const scopes = ['year', 'month', 'day', 'hour'] as const

    for (const fixture of knownDates.fixtures) {
      const snapshot = await provider.getSnapshot(new Date(fixture.input.timestampUtc), {
        timezone: fixture.input.timezone,
      })

      expect(snapshot.provenance.mappingVersion, fixture.id).toBe(knownDates.mappingVersion)
      for (const scope of scopes) {
        expect(snapshot.temporal[scope].ganZhiRaw, `${fixture.id} ${scope} Ganzhi`).toBe(
          fixture.expected[scope].ganZhi,
        )
        expect(snapshot.temporal[scope].hexagram.number, `${fixture.id} ${scope} hexagram`).toBe(
          fixture.expected[scope].hexagramKingWenId,
        )
        expect(snapshot.temporal[scope].numberingSystem).toBe('king-wen')
        expect(snapshot.temporal[scope].mappingVersion).toBe(knownDates.mappingVersion)
      }
    }
  })

  it('matches the 2026 Fire Horse golden snapshot in New York', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const at = new Date('2026-07-23T16:00:00.000Z')
    const snapshot = await provider.getSnapshot(at, {
      timezone: 'America/New_York',
      globalConditions: conditionsAt(at),
    })

    expect(snapshot.status).toBe('computed')
    expect(snapshot.timezone).toBe('America/New_York')
    expect(snapshot.temporal.year.ganZhi).toBe('丙午 · Fire Horse')
    expect(snapshot.temporal.year.hexagram.number).toBe(28)
    expect(snapshot.temporal.month.hexagram.number).toBe(48)
    expect(snapshot.temporal.day.hexagram.number).toBe(15)
    expect(snapshot.temporal.hour.hexagram.number).toBe(50)
    expect(snapshot.temporal.year.timeBoundsLabel).toBe(
      '2026-02-04 04:02:08 → 2027-02-04 09:46:18 · America/New_York',
    )
    expect(snapshot.temporal.month.timeBoundsLabel).toBe(
      '2026-07-07 09:56:57 → 2026-08-07 19:42:43 · America/New_York',
    )
    expect(snapshot.temporal.day.timeBoundsLabel).toBe(
      '2026-07-23 00:00:00 → 2026-07-24 00:00:00 · America/New_York',
    )
    expect(snapshot.temporal.hour.timeBoundsLabel).toBe(
      '2026-07-23 11:00:00 → 2026-07-23 13:00:00 · America/New_York',
    )
    expect(snapshot.organ.key).toBe('heart')
    expect(snapshot.organ.timeRangeLabel).toContain('11:00–13:00')
    expect(snapshot.organ).toMatchObject({
      element: 'fire',
      shichen: { id: 'wu', branchChinese: '午', animalEnglish: 'Horse' },
      hourPhase: {
        macroHour: 'zheng',
        macroSemantic: 'established',
        microHour: 0,
        chineseKeLabel: '初刻',
      },
    })
    expect(snapshot.guidance.status).toBe('available')
    if (snapshot.guidance.status !== 'available') throw new Error('Expected available guidance.')
    expect(snapshot.guidance.intentions).toHaveLength(3)
    expect(snapshot.guidance.executions).toHaveLength(3)
    expect(new Set(snapshot.guidance.executions.map((item) => item.definition.category)).size).toBe(
      3,
    )
    expect(snapshot.guidance.synthesis.operativeWork.activeOrgan.value).toMatchObject({
      key: 'heart',
      element: 'fire',
    })
    expect(
      snapshot.guidance.executions.some(
        (selection) => selection.definition.category === 'fire' && selection.activeOrganMatch,
      ),
    ).toBe(true)
    expect(snapshot.guidance.validityWindow.validUntilUtc).toBe('2026-07-23T17:00:00.000Z')
    expect(snapshot.provenance.notes.join(' ')).toContain(
      'complete profile coverage; missing profiles: none',
    )
    expect(snapshot.relatedHexagrams).toHaveLength(3)
  })

  it('uses the selected timezone for the midnight-spanning organ period', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T04:30:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.organ.key).toBe('gallbladder')
    expect(snapshot.organ.timeRangeLabel).toContain('23:00–01:00')
    expect(snapshot.organ.hourPhase).toMatchObject({
      macroHour: 'zheng',
      microHour: 2,
      chineseKeLabel: '二刻',
    })
    expect(snapshot.temporal.hour.timeBoundsLabel).toBe(
      '2026-07-22 23:00:00 → 2026-07-23 01:00:00 · America/New_York',
    )
  })

  it('expires at civil midnight when the day changes before the two-hour pillar', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T03:30:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.guidance.validityWindow.validUntilUtc).toBe('2026-07-23T04:00:00.000Z')
    expect(snapshot.guidance.validityWindow.boundaryReason).toBe('semantic-classification-change')
  })

  it('expires at an exact solar term when it precedes the next two-hour boundary', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-07T13:50:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.guidance.validityWindow.validUntilUtc).toBe('2026-07-07T13:56:57.000Z')
    expect(snapshot.guidance.validityWindow.boundaryReason).toBe('solar-term-boundary')
  })

  it.each([
    [
      'Cantong qi',
      '2026-08-25T12:10:00.000Z',
      '2026-08-25T12:20:00.000Z',
      '2026-08-25T12:10:00.000Z',
      'lunar-node-change',
    ],
    [
      'Seasonal Current',
      '2026-08-25T12:20:00.000Z',
      '2026-08-25T12:10:00.000Z',
      '2026-08-25T12:10:00.000Z',
      'solar-term-boundary',
    ],
  ] as const)(
    'expires at the exact %s boundary when it is the earliest semantic change',
    async (_label, lunarEnd, seasonalEnd, expectedEnd, expectedReason) => {
      const provider = new LunarScriptCurrentFlowProvider()
      const at = new Date('2026-08-25T12:00:00.000Z')
      const snapshot = await provider.getSnapshot(at, {
        timezone: 'UTC',
        globalConditions: conditionsWithBoundaryEnds(at, lunarEnd, seasonalEnd),
      })

      expect(snapshot.guidance.validityWindow).toMatchObject({
        validUntilUtc: expectedEnd,
        boundaryReason: expectedReason,
      })
    },
  )

  it('rejects a supplied Global Conditions snapshot from a different instant', () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const suppliedInstant = new Date('2026-08-25T12:00:00.000Z')
    const requestedInstant = new Date('2026-08-25T12:01:00.000Z')

    expect(() =>
      provider.getSnapshot(requestedInstant, {
        timezone: 'UTC',
        globalConditions: conditionsAt(suppliedInstant),
      }),
    ).toThrow('Global Conditions and temporal guidance must use the same instant.')
  })

  it('publishes exactly three intentions and executions for another temporal profile', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const at = new Date('2026-07-07T16:00:00.000Z')
    const snapshot = await provider.getSnapshot(at, {
      timezone: 'America/New_York',
      globalConditions: conditionsAt(at),
    })

    expect(snapshot.temporal.day.hexagram.number).toBe(57)
    expect(snapshot.guidance.status).toBe('available')
    if (snapshot.guidance.status !== 'available') throw new Error('Expected available guidance.')
    expect(snapshot.guidance.primaryCurrent.sourceLabel.value).toMatch(/Current Semantic Layer v1/)
    expect(snapshot.guidance.synthesis.evidence.value.length).toBeGreaterThan(0)
    expect(snapshot.guidance.intentions.map((selection) => selection.rank)).toEqual([1, 2, 3])
    expect(snapshot.guidance.executions.map((selection) => selection.rank)).toEqual([1, 2, 3])
  })

  it.each([
    ['zhen-emergence', 'emerging'],
    ['dui-accumulation', 'building'],
    ['qian-culmination', 'culminating'],
    ['xun-distribution', 'releasing'],
    ['gen-consolidation', 'resting'],
    ['kun-concealment', 'threshold'],
  ] as const satisfies readonly (readonly [CantongQiNodeId, string])[])(
    'carries Cantong qi node %s into provider lunar mode %s',
    async (node, expectedMode) => {
      const provider = new LunarScriptCurrentFlowProvider()
      const at = new Date('2026-08-25T12:00:00.000Z')
      const snapshot = await provider.getSnapshot(at, {
        timezone: 'UTC',
        mode: 'selected',
        globalConditions: conditionsAt(at, { cantongQiNodeId: node }),
      })

      expect(snapshot.guidance.status).toBe('available')
      if (snapshot.guidance.status !== 'available') throw new Error('Expected available guidance.')
      expect(snapshot.guidance.synthesis.field.lunarMode.value).toBe(expectedMode)
      expect(snapshot.guidance.intentions).toHaveLength(3)
      expect(snapshot.guidance.executions).toHaveLength(3)
    },
  )

  it('keeps resolved guidance unchanged when only raw celestial measurements change', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const at = new Date('2026-08-25T12:00:00.000Z')
    const firstConditions = conditionsAt(at, {
      lunarElongationDegrees: 45,
      seasonal: { solarLongitudeDegrees: 15 },
    })
    const secondBase = conditionsAt(at, {
      lunarElongationDegrees: 225,
      seasonal: { solarLongitudeDegrees: 285 },
    })
    const secondConditions: GlobalConditionsSnapshot = Object.freeze({
      ...secondBase,
      lunar: Object.freeze({
        ...secondBase.lunar,
        illuminationFraction: 0.01,
        lunationProgress: 0.99,
        waxing: !secondBase.lunar.waxing,
      }),
    })

    const first = await provider.getSnapshot(at, {
      timezone: 'UTC',
      mode: 'selected',
      globalConditions: firstConditions,
    })
    const second = await provider.getSnapshot(at, {
      timezone: 'UTC',
      mode: 'selected',
      globalConditions: secondConditions,
    })

    expect(first.guidance.status).toBe('available')
    expect(second.guidance.status).toBe('available')
    if (first.guidance.status !== 'available' || second.guidance.status !== 'available') {
      throw new Error('Expected available guidance.')
    }
    expect(second.guidance.synthesis.field).toEqual(first.guidance.synthesis.field)
    expect(second.guidance.intentions.map((item) => item.definition.id)).toEqual(
      first.guidance.intentions.map((item) => item.definition.id),
    )
    expect(second.guidance.executions.map((item) => item.definition.category)).toEqual(
      first.guidance.executions.map((item) => item.definition.category),
    )
  })

  it('isolates backward and future selected snapshots from the live guidance cache', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const liveAt = new Date('2026-08-25T12:10:00.000Z')
    const backwardAt = new Date('2026-08-25T12:05:00.000Z')
    const futureAt = new Date('2026-08-25T12:40:00.000Z')
    const returnLiveAt = new Date('2026-08-25T12:11:00.000Z')

    const live = await provider.getSnapshot(liveAt, {
      timezone: 'UTC',
      mode: 'live',
      globalConditions: conditionsAt(liveAt),
    })
    const backward = await provider.getSnapshot(backwardAt, {
      timezone: 'UTC',
      mode: 'selected',
      globalConditions: conditionsAt(backwardAt),
    })
    const future = await provider.getSnapshot(futureAt, {
      timezone: 'UTC',
      mode: 'selected',
      globalConditions: conditionsAt(futureAt),
    })
    const returnLive = await provider.getSnapshot(returnLiveAt, {
      timezone: 'UTC',
      mode: 'live',
      globalConditions: conditionsAt(returnLiveAt),
    })

    expect(live.guidance.status).toBe('available')
    expect(backward.guidance.synthesisId).toBe(live.guidance.synthesisId)
    expect(future.guidance.synthesisId).toBe(live.guidance.synthesisId)
    expect(backward.guidance).not.toBe(live.guidance)
    expect(future.guidance).not.toBe(live.guidance)
    expect(future.guidance).not.toBe(backward.guidance)
    expect(backward.guidance.validityWindow.validFromUtc).toBe(backwardAt.toISOString())
    expect(future.guidance.validityWindow.validFromUtc).toBe(futureAt.toISOString())
    expect(returnLive.guidance).toBe(live.guidance)
  })

  it('reuses available guidance until its next semantic boundary', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const first = await provider.getSnapshot(new Date('2026-07-07T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })
    const nextMinute = await provider.getSnapshot(new Date('2026-07-07T16:01:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(first.guidance.status).toBe('available')
    expect(nextMinute.guidance).toBe(first.guidance)
  })

  it('regenerates cached guidance when an upstream period end is corrected', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const firstAt = new Date('2026-08-25T12:00:00.000Z')
    const secondAt = new Date('2026-08-25T12:01:00.000Z')
    const first = await provider.getSnapshot(firstAt, {
      timezone: 'UTC',
      mode: 'live',
      globalConditions: conditionsWithBoundaryEnds(
        firstAt,
        '2026-08-25T12:20:00.000Z',
        '2026-08-25T13:00:00.000Z',
      ),
    })
    const corrected = await provider.getSnapshot(secondAt, {
      timezone: 'UTC',
      mode: 'live',
      globalConditions: conditionsWithBoundaryEnds(
        secondAt,
        '2026-08-25T12:15:00.000Z',
        '2026-08-25T13:00:00.000Z',
      ),
    })

    expect(corrected.guidance).not.toBe(first.guidance)
    expect(corrected.guidance.synthesisId).not.toBe(first.guidance.synthesisId)
    expect(corrected.guidance.validityWindow).toMatchObject({
      validUntilUtc: '2026-08-25T12:15:00.000Z',
      boundaryReason: 'lunar-node-change',
    })
  })

  it('regenerates guidance at Macro, not Micro, while preserving immediate Hour identity', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const chu = await provider.getSnapshot(new Date('2026-07-07T15:59:00.000Z'), {
      timezone: 'America/New_York',
    })
    const zheng = await provider.getSnapshot(new Date('2026-07-07T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })
    const micro = await provider.getSnapshot(new Date('2026-07-07T16:15:00.000Z'), {
      timezone: 'America/New_York',
    })
    const nextShichen = await provider.getSnapshot(new Date('2026-07-07T17:00:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(chu.guidance.status).toBe('available')
    expect(zheng.guidance.status).toBe('available')
    expect(chu.organ.hourPhase).toMatchObject({ macroHour: 'chu', microHour: 3 })
    expect(zheng.organ.hourPhase).toMatchObject({ macroHour: 'zheng', microHour: 0 })
    expect(micro.organ.hourPhase).toMatchObject({ macroHour: 'zheng', microHour: 1 })
    expect(zheng.organ.key).toBe(chu.organ.key)
    expect(zheng.organ.shichen.id).toBe(chu.organ.shichen.id)
    expect(zheng.temporal.hour.ganZhiRaw).toBe(chu.temporal.hour.ganZhiRaw)
    expect(zheng.temporal.hour.hexagram.number).toBe(chu.temporal.hour.hexagram.number)
    expect(zheng.guidance).not.toBe(chu.guidance)
    expect(zheng.guidance.synthesisId).not.toBe(chu.guidance.synthesisId)
    expect(micro.guidance).toBe(zheng.guidance)
    expect(zheng.guidance.validityWindow).toMatchObject({
      validUntilUtc: '2026-07-07T17:00:00.000Z',
      boundaryReason: 'shichen-change',
    })
    if (zheng.guidance.status !== 'available') throw new Error('Expected available guidance.')
    expect(
      zheng.guidance.synthesis.evidence.value.some(
        (item) => item.source.value.kind === 'macro-hour',
      ),
    ).toBe(true)
    expect(nextShichen.organ.key).not.toBe(zheng.organ.key)
    expect(nextShichen.organ.hourPhase).toMatchObject({ macroHour: 'chu', microHour: 0 })
    expect(nextShichen.guidance).not.toBe(zheng.guidance)
  })

  it('reuses guidance until the next semantic boundary', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const first = await provider.getSnapshot(new Date('2026-07-23T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })
    const nextMinute = await provider.getSnapshot(new Date('2026-07-23T16:01:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(nextMinute.guidance).toBe(first.guidance)
    expect(first.guidance.validityWindow.boundaryReason).toBe('shichen-change')
  })
})
