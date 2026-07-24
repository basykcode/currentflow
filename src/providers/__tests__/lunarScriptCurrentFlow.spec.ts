import { describe, expect, it } from 'vitest'

import { LunarScriptCurrentFlowProvider } from '../lunarScriptCurrentFlow'

describe('LunarScriptCurrentFlowProvider', () => {
  it('matches the 2026 Fire Horse golden snapshot in New York', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T16:00:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.status).toBe('computed')
    expect(snapshot.timezone).toBe('America/New_York')
    expect(snapshot.temporal.year.ganZhi).toBe('丙午 · Yang Fire Horse')
    expect(snapshot.temporal.year.hexagram.number).toBe(28)
    expect(snapshot.temporal.month.hexagram.number).toBe(48)
    expect(snapshot.temporal.day.hexagram.number).toBe(15)
    expect(snapshot.temporal.hour.hexagram.number).toBe(50)
    expect(snapshot.organ.key).toBe('heart')
    expect(snapshot.organ.timeRangeLabel).toContain('11:00–13:00')
    expect(snapshot.synthesis.status).toBe('unavailable')
    expect(snapshot.synthesis.recommendedExecution).toHaveLength(0)
    expect(snapshot.synthesis.relatedHexagrams).toHaveLength(3)
  })

  it('uses the selected timezone for the midnight-spanning organ period', async () => {
    const provider = new LunarScriptCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-07-23T04:30:00.000Z'), {
      timezone: 'America/New_York',
    })

    expect(snapshot.organ.key).toBe('gallbladder')
    expect(snapshot.organ.timeRangeLabel).toContain('23:00–01:00')
  })
})
