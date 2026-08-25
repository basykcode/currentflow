import { describe, expect, it } from 'vitest'

import {
  calculateChineseLunarCalendar,
  resolveCantongQiNodeId,
} from '../chineseCalendar'

describe('Asia/Shanghai Chinese lunar calendar adapter', () => {
  it('returns explicit lunar date, leap status, month length, and Month Pillar Branch', () => {
    const calendar = calculateChineseLunarCalendar('2026-08-25T12:00:00Z')
    expect(calendar).toEqual(
      expect.objectContaining({
        referenceTimeZone: 'Asia/Shanghai',
        lunarYear: 2026,
        lunarMonth: 7,
        lunarDay: 13,
        isLeapMonth: false,
        monthLength: 29,
        monthPillarBranch: '申',
      }),
    )
  })

  it('does not depend on the process or viewer timezone', () => {
    const original = process.env['TZ']
    process.env['TZ'] = 'America/Los_Angeles'
    const losAngeles = calculateChineseLunarCalendar('2026-08-25T16:30:00Z')
    process.env['TZ'] = 'Pacific/Auckland'
    const auckland = calculateChineseLunarCalendar('2026-08-25T16:30:00Z')
    process.env['TZ'] = original
    expect(auckland).toEqual(losAngeles)
  })

  it('retains leap-month identity and a real 29-day month', () => {
    const leap = calculateChineseLunarCalendar('2025-07-30T12:00:00Z')
    expect(leap.isLeapMonth).toBe(true)
    expect(leap.lunarMonth).toBe(6)

    const shortMonth = calculateChineseLunarCalendar('2026-08-25T12:00:00Z')
    expect(shortMonth.monthLength).toBe(29)
    expect(shortMonth.lunarDay).toBeLessThanOrEqual(29)
  })

  it.each([
    [1, 'zhen-emergence'],
    [5, 'zhen-emergence'],
    [6, 'dui-accumulation'],
    [10, 'dui-accumulation'],
    [11, 'qian-culmination'],
    [15, 'qian-culmination'],
    [16, 'xun-distribution'],
    [20, 'xun-distribution'],
    [21, 'gen-consolidation'],
    [25, 'gen-consolidation'],
    [26, 'kun-concealment'],
    [29, 'kun-concealment'],
    [30, 'kun-concealment'],
  ] as const)('maps lunar day %i to %s', (day, node) => {
    expect(resolveCantongQiNodeId(day)).toBe(node)
  })
})
