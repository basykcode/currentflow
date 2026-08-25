import { describe, expect, it } from 'vitest'

import { calculateHourPhase, InvalidShichenPhaseCoordinateError } from '../calculator'
import type { ShichenPhaseCoordinate } from '../types'

const coordinateAt = (elapsedBasisMinutes: number): ShichenPhaseCoordinate => ({
  timeBasis: 'local-civil',
  elapsedBasisMinutes,
  totalBasisMinutes: 120,
  startUtc: '2026-08-25T18:00:00.000Z',
  endUtc: '2026-08-25T20:00:00.000Z',
  nextMinuteBoundaryUtc: '2026-08-25T18:01:00.000Z',
  nextMicroBoundaryUtc: '2026-08-25T18:15:00.000Z',
  nextMacroBoundaryUtc: '2026-08-25T19:00:00.000Z',
  nextShichenBoundaryUtc: '2026-08-25T20:00:00.000Z',
  warnings: [],
})

describe('calculateHourPhase', () => {
  it.each([
    [0, 'chu', 'entering', 0, '初刻'],
    [14 + 59.999 / 60, 'chu', 'entering', 0, '初刻'],
    [15, 'chu', 'entering', 1, '一刻'],
    [29 + 59.999 / 60, 'chu', 'entering', 1, '一刻'],
    [30, 'chu', 'entering', 2, '二刻'],
    [44 + 59.999 / 60, 'chu', 'entering', 2, '二刻'],
    [45, 'chu', 'entering', 3, '三刻'],
    [59 + 59.999 / 60, 'chu', 'entering', 3, '三刻'],
    [60, 'zheng', 'established', 0, '初刻'],
    [74 + 59.999 / 60, 'zheng', 'established', 0, '初刻'],
    [75, 'zheng', 'established', 1, '一刻'],
    [89 + 59.999 / 60, 'zheng', 'established', 1, '一刻'],
    [90, 'zheng', 'established', 2, '二刻'],
    [104 + 59.999 / 60, 'zheng', 'established', 2, '二刻'],
    [105, 'zheng', 'established', 3, '三刻'],
    [119 + 59.999 / 60, 'zheng', 'established', 3, '三刻'],
  ] as const)(
    'classifies exact basis position %s',
    (elapsed, macroHour, macroSemantic, microHour, chineseKeLabel) => {
      expect(calculateHourPhase(coordinateAt(elapsed))).toMatchObject({
        methodologyId: 'temporal-hour-phase:chu-zheng-ke-96-v1',
        macroHour,
        macroSemantic,
        microHour,
        chineseKeLabel,
      })
    },
  )

  it('uses exact position for phase and whole minutes only for the marker target', () => {
    const phase = calculateHourPhase(coordinateAt(60.999))

    expect(phase.macroHour).toBe('zheng')
    expect(phase.shichenElapsedWholeMinutes).toBe(60)
    expect(phase.timelinePosition).toBe(0.5)
  })

  it('rejects a stale coordinate at the previous Shíchen end', () => {
    expect(() => calculateHourPhase(coordinateAt(120))).toThrow(InvalidShichenPhaseCoordinateError)
  })
})
