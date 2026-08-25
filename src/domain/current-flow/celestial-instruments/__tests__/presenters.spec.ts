import { describe, expect, it } from 'vitest'

import { createCelestialDevelopmentFixture } from '../fixtures'
import { presentLunarHomeInstrument } from '../lunarHomePresenter'
import { presentSolarHomeInstrument } from '../solarHomePresenter'
import { CelestialPresenterConflictError } from '../types'

describe('lunar Home presenter', () => {
  it.each([
    [0, 'New Moon'],
    [45, 'Waxing Crescent'],
    [90, 'First Quarter'],
    [135, 'Waxing Gibbous'],
    [180, 'Full Moon'],
    [225, 'Waning Gibbous'],
    [270, 'Third Quarter'],
    [315, 'Waning Crescent'],
  ] as const)('preserves the authoritative %s phase at %i°', (elongation, phase) => {
    const source = createCelestialDevelopmentFixture({ lunarElongationDegrees: elongation }).lunar
    expect(presentLunarHomeInstrument(source).phaseName).toBe(phase)
  })

  it('keeps astronomical marker position independent from traditional node state', () => {
    const source = createCelestialDevelopmentFixture({
      lunarElongationDegrees: 45,
      cantongQiNodeId: 'kun-concealment',
    }).lunar
    const viewModel = presentLunarHomeInstrument(source)

    expect(viewModel.markerAngleDegrees).toBe(45)
    expect(viewModel.activeNodeIndex).toBe(5)
    expect(viewModel.cantongQi).toEqual(
      expect.objectContaining({ character: '坤', pinyin: 'Kūn', englishLabel: 'Concealment' }),
    )
    expect(viewModel.yinYangMovement).toBe('Yin Full')
  })

  it('does not generate movement when the traditional node is unavailable', () => {
    const base = createCelestialDevelopmentFixture().lunar
    const viewModel = presentLunarHomeInstrument({ ...base, cantongQiNodeId: null })

    expect(viewModel.status).toBe('partial')
    expect(viewModel.yinYangMovement).toBeNull()
    expect(viewModel.warnings.join(' ')).toContain('no lunar movement was inferred')
  })

  it('does not generate visible percentage labels', () => {
    const viewModel = presentLunarHomeInstrument(createCelestialDevelopmentFixture().lunar)
    expect(JSON.stringify(viewModel)).not.toContain('%')
  })

  it('fails closed when Moon astronomy is absent', () => {
    const viewModel = presentLunarHomeInstrument(null)
    expect(viewModel.status).toBe('unavailable')
    expect(viewModel.phaseName).toBe('Lunar data unavailable')
    expect(viewModel.markerAngleDegrees).toBeNull()
  })
})

describe('solar Home presenter', () => {
  it('maps reviewed term display metadata and passes through semantic movement', () => {
    const source = createCelestialDevelopmentFixture().seasonal
    const viewModel = presentSolarHomeInstrument(source)

    expect(viewModel.season).toBe('Autumn')
    expect(viewModel.solarTerm).toEqual(
      expect.objectContaining({
        chineseTraditional: '處暑',
        pinyin: 'Chǔshǔ',
        contextualEnglish: 'Limit of Heat',
      }),
    )
    expect(viewModel.branchMonth).toEqual(
      expect.objectContaining({ character: '申', pinyin: 'Shēn' }),
    )
    expect(viewModel.yinYangMovement).toBe('Yang Descending')
    expect(viewModel.markerAngleDegrees).toBe(240)
  })

  it('does not infer unavailable Branch or annual movement', () => {
    const base = createCelestialDevelopmentFixture().seasonal
    const viewModel = presentSolarHomeInstrument({
      ...base,
      branchMonth: null,
      yinYangMovement: null,
    })

    expect(viewModel.status).toBe('partial')
    expect(viewModel.branchMonth).toBeNull()
    expect(viewModel.yinYangMovement).toBeNull()
  })

  it('rejects a source season that conflicts with the reviewed longitude boundary', () => {
    const base = createCelestialDevelopmentFixture().seasonal
    expect(() => presentSolarHomeInstrument({ ...base, season: 'Winter' })).toThrow(
      CelestialPresenterConflictError,
    )
  })

  it('rejects a source Branch that conflicts with the reviewed sector boundary', () => {
    const fixture = createCelestialDevelopmentFixture()
    expect(() =>
      presentSolarHomeInstrument({
        ...fixture.seasonal,
        branchMonth: { character: '酉', pinyin: 'Yǒu', animalEnglish: 'Rooster', index: 9 },
      }),
    ).toThrow(CelestialPresenterConflictError)
  })

  it('fails closed without Seasonal Current astronomy', () => {
    const viewModel = presentSolarHomeInstrument(null)
    expect(viewModel.status).toBe('unavailable')
    expect(viewModel.season).toBeNull()
    expect(viewModel.markerAngleDegrees).toBeNull()
  })
})
