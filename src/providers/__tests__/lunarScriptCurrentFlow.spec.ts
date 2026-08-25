import { describe, expect, it } from 'vitest'

import knownDates from '../../../fixtures/temporal-hexagram-validation/known-dates.json'

import { LunarScriptCurrentFlowProvider } from '../lunarScriptCurrentFlow'

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
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T16:00:00.000Z'), {
      timezone: 'America/New_York',
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
    expect(snapshot.organ.chuZhengKe).toMatchObject({
      nameChinese: '正初刻',
      namePinyin: 'Zhèng Chū Kè',
      timeRangeLabel: '12:00–12:15',
      cultivationPhase: 'Fullness',
      cultivationStatus: 'current-formalization',
    })
    expect(snapshot.guidance.status).toBe('unavailable')
    expect(snapshot.guidance.executions).toHaveLength(0)
    expect(snapshot.guidance.validityWindow.validUntilUtc).toBe('2026-07-23T17:00:00.000Z')
    expect(snapshot.relatedHexagrams).toHaveLength(3)
  })

  it('uses the selected timezone for the midnight-spanning organ period', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T04:30:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.organ.key).toBe('gallbladder')
    expect(snapshot.organ.timeRangeLabel).toContain('23:00–01:00')
    expect(snapshot.organ.chuZhengKe).toMatchObject({
      nameChinese: '正二刻',
      timeRangeLabel: '00:30–00:45',
      cultivationPhase: 'Integrating',
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

  it('publishes guidance when the operative day has an eligible Current semantic profile', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-07T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.temporal.day.hexagram.number).toBe(57)
    expect(snapshot.guidance.status).toBe('available')
    if (snapshot.guidance.status !== 'available') throw new Error('Expected available guidance.')
    expect(snapshot.guidance.primaryCurrent.sourceLabel.value).toMatch(/Current Semantic Layer v1/)
    expect(snapshot.guidance.synthesis.evidence.value.length).toBeGreaterThan(0)
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

  it('reuses guidance until the next semantic boundary', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const first = await provider.getSnapshot(new Date('2026-07-23T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })
    const nextMinute = await provider.getSnapshot(new Date('2026-07-23T16:01:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(nextMinute.guidance).toBe(first.guidance)
    expect(first.guidance.validityWindow.boundaryReason).toBe('earthly-branch-hour-change')
  })
})
