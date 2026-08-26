import { describe, expect, it } from 'vitest'

import { calculateHourPhase } from '../calculator'
import { classifyTemporalClockEvent, temporalEventRefreshesGuidance } from '../events'
import type { ShichenClockState, ShichenPhaseCoordinate } from '../types'

const stateAt = (elapsed: number, shichenId = 'wu', start = '2026-08-25T18:00:00.000Z') => {
  const coordinate: ShichenPhaseCoordinate = {
    timeBasis: 'local-civil',
    elapsedBasisMinutes: elapsed,
    totalBasisMinutes: 120,
    startUtc: start,
    endUtc: '2026-08-25T20:00:00.000Z',
    nextMinuteBoundaryUtc: '2026-08-25T18:01:00.000Z',
    nextMicroBoundaryUtc: '2026-08-25T18:15:00.000Z',
    nextMacroBoundaryUtc: '2026-08-25T19:00:00.000Z',
    nextShichenBoundaryUtc: '2026-08-25T20:00:00.000Z',
    warnings: [],
  }
  return { shichenId, hourPhase: calculateHourPhase(coordinate) } satisfies ShichenClockState
}

describe('classifyTemporalClockEvent', () => {
  it.each([
    [stateAt(1), stateAt(2), 'minute-passage'],
    [stateAt(14.99), stateAt(15), 'micro-hour-change'],
    [stateAt(59.99), stateAt(60), 'macro-hour-change'],
    [stateAt(119.99), stateAt(0, 'wei', '2026-08-25T20:00:00.000Z'), 'shichen-change'],
  ] as const)('classifies the highest transition', (previous, next, event) => {
    expect(classifyTemporalClockEvent(previous, next)).toBe(event)
  })

  it('gives Shíchen identity/start priority over simultaneous phase resets', () => {
    expect(
      classifyTemporalClockEvent(stateAt(60), stateAt(0, 'wu', '2026-08-25T20:00:00.000Z')),
    ).toBe('shichen-change')
  })

  it('gives Macro priority over the simultaneous Micro reset', () => {
    expect(classifyTemporalClockEvent(stateAt(59.99), stateAt(60))).toBe('macro-hour-change')
  })

  it('refreshes guidance only for Macro and Shíchen changes', () => {
    expect(temporalEventRefreshesGuidance('minute-passage')).toBe(false)
    expect(temporalEventRefreshesGuidance('micro-hour-change')).toBe(false)
    expect(temporalEventRefreshesGuidance('macro-hour-change')).toBe(true)
    expect(temporalEventRefreshesGuidance('shichen-change')).toBe(true)
  })
})
