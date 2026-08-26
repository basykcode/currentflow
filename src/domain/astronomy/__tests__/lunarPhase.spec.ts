import { describe, expect, it } from 'vitest'

import { classifyLunarMotion, classifyLunarPhase } from '../lunarPhase'

describe('astronomical lunar phase policy', () => {
  it.each([
    [0, 'New Moon'],
    [22.499, 'New Moon'],
    [22.5, 'Waxing Crescent'],
    [67.499, 'Waxing Crescent'],
    [67.5, 'First Quarter'],
    [112.499, 'First Quarter'],
    [112.5, 'Waxing Gibbous'],
    [157.499, 'Waxing Gibbous'],
    [157.5, 'Full Moon'],
    [202.499, 'Full Moon'],
    [202.5, 'Waning Gibbous'],
    [247.499, 'Waning Gibbous'],
    [247.5, 'Third Quarter'],
    [292.499, 'Third Quarter'],
    [292.5, 'Waning Crescent'],
    [337.499, 'Waning Crescent'],
    [337.5, 'New Moon'],
    [359.999, 'New Moon'],
  ] as const)('classifies %s° as %s', (elongation, phase) => {
    expect(classifyLunarPhase(elongation)).toBe(phase)
  })

  it('distinguishes waxing, waning, and exact cardinal turns', () => {
    expect(classifyLunarMotion(0)).toBe('turning-at-new')
    expect(classifyLunarMotion(45)).toBe('waxing')
    expect(classifyLunarMotion(180)).toBe('turning-at-full')
    expect(classifyLunarMotion(225)).toBe('waning')
    expect(classifyLunarMotion(360)).toBe('turning-at-new')
  })
})
