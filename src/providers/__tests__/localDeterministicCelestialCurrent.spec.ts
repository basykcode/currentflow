import { SearchSunLongitude } from 'astronomy-engine'
import { describe, expect, it, vi } from 'vitest'

import { AstronomyEngineCelestialProvider } from '@/domain/astronomy'

import { LocalDeterministicCelestialCurrentProvider } from '../localDeterministicCelestialCurrent'

describe('LocalDeterministicCelestialCurrentProvider', () => {
  it('feeds real physical and calendar data through the existing Home presenters', () => {
    const provider = new LocalDeterministicCelestialCurrentProvider()
    const snapshot = provider.calculate(new Date('2026-08-25T12:00:00Z'), { mode: 'selected' })

    expect(snapshot.instantUtc).toBe('2026-08-25T12:00:00.000Z')
    expect(snapshot.status).toBe('computed')
    expect(snapshot.lunarHome.phaseName).toBe(snapshot.astronomy.lunar?.phaseName)
    expect(snapshot.lunarHome.markerAngleDegrees).toBe(snapshot.astronomy.lunar?.elongationDegrees)
    expect(snapshot.lunarHome.cantongQi?.character).toBe('乾')
    expect(snapshot.lunarHome.periodBounds).toEqual({
      startUtc: '2026-08-22T16:00:00.000Z',
      endExclusiveUtc: '2026-08-27T16:00:00.000Z',
      basisTimeZone: 'Asia/Shanghai',
    })
    expect(snapshot.solarHome.solarTerm?.id).toBe('chushu')
    expect(snapshot.solarHome.season).toBe('Autumn')
    expect(snapshot.solarHome.branchMonth?.character).toBe('申')
    expect(snapshot.solarHome.yinYangMovement).toBe('Yang Descending')
    expect(snapshot.solarHome.periodBounds).toEqual({
      startUtc: snapshot.astronomy.solar?.currentSolarTerm.instantUtc,
      endExclusiveUtc: snapshot.astronomy.solar?.nextSolarTerm.instantUtc,
      basisTimeZone: 'UTC',
    })
    expect(JSON.stringify(snapshot.lunarHome)).not.toContain('%')
    expect(JSON.stringify(snapshot.solarHome)).not.toContain('°')
  })

  it('uses bounded live presentation caches but bypasses them for selected-time jumps', () => {
    const provider = new LocalDeterministicCelestialCurrentProvider()
    const first = provider.calculate(new Date('2026-08-25T12:10:00Z'))
    const minuteLater = provider.calculate(new Date('2026-08-25T12:11:00Z'))
    const selected = provider.calculate(new Date('2026-08-25T12:11:00Z'), { mode: 'selected' })

    expect(minuteLater.lunarHome).toBe(first.lunarHome)
    expect(minuteLater.solarHome).toBe(first.solarHome)
    expect(selected.lunarHome).not.toBe(first.lunarHome)
    expect(selected.solarHome).not.toBe(first.solarHome)
    expect(first.nextRecommendedUpdateUtc).not.toBeNull()
    expect(selected.nextRecommendedUpdateUtc).toBeNull()
  })

  it('keeps Sun available when Moon calculation fails', () => {
    const real = new AstronomyEngineCelestialProvider()
    const provider = new LocalDeterministicCelestialCurrentProvider({
      providerId: 'astronomy-engine',
      providerVersion: '2.1.19',
      calculateLunar: () => {
        throw new Error('hidden dependency detail')
      },
      calculateSolar: (instantUtc) => real.calculateSolar(instantUtc),
    })
    const snapshot = provider.calculate(new Date('2026-08-25T12:00:00Z'))

    expect(snapshot.status).toBe('partial')
    expect(snapshot.lunarHome.status).toBe('unavailable')
    expect(snapshot.solarHome.status).toBe('computed')
    expect(snapshot.warnings.join(' ')).not.toContain('hidden dependency detail')
  })

  it('makes no astronomy network request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    new LocalDeterministicCelestialCurrentProvider().calculate(new Date('2026-08-25T12:00:00Z'))
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('warns instead of hiding a narrow ephemeris Month-Branch discrepancy', () => {
    const liChun = SearchSunLongitude(315, new Date('2026-01-25T00:00:00Z'), 20)
    expect(liChun).not.toBeNull()
    const snapshot = new LocalDeterministicCelestialCurrentProvider().calculate(liChun!.date, {
      mode: 'selected',
    })

    expect(snapshot.solarHome.branchMonth?.character).toBe('寅')
    expect(snapshot.chineseCalendar?.monthPillarBranch).toBe('丑')
    expect(snapshot.solarHome.warnings.join(' ')).toContain('differs')
  })

  it.each([
    [315, '寅', '2026-01-25T00:00:00Z'],
    [345, '卯', '2026-02-25T00:00:00Z'],
    [15, '辰', '2026-03-25T00:00:00Z'],
    [45, '巳', '2026-04-25T00:00:00Z'],
    [75, '午', '2026-05-25T00:00:00Z'],
    [105, '未', '2026-06-25T00:00:00Z'],
    [135, '申', '2026-07-25T00:00:00Z'],
    [165, '酉', '2026-08-25T00:00:00Z'],
    [195, '戌', '2026-09-25T00:00:00Z'],
    [225, '亥', '2026-10-25T00:00:00Z'],
    [255, '子', '2026-11-25T00:00:00Z'],
    [285, '丑', '2025-12-25T00:00:00Z'],
  ] as const)(
    'activates Branch %s at the exact %i° Jie and records any Month-Pillar difference',
    (target, expectedBranch, searchStart) => {
      const crossing = SearchSunLongitude(target, new Date(searchStart), 20)
      expect(crossing).not.toBeNull()
      const provider = new LocalDeterministicCelestialCurrentProvider()
      const before = provider.calculate(new Date(crossing!.date.getTime() - 1_000), {
        mode: 'selected',
      })
      const at = provider.calculate(crossing!.date, { mode: 'selected' })

      expect(before.solarHome.branchMonth?.character).not.toBe(expectedBranch)
      expect(at.solarHome.branchMonth?.character).toBe(expectedBranch)
      if (at.chineseCalendar?.monthPillarBranch === expectedBranch) {
        expect(at.solarHome.warnings.join(' ')).not.toContain('differs')
      } else {
        expect(at.solarHome.warnings.join(' ')).toContain('differs')
      }
    },
  )
})
