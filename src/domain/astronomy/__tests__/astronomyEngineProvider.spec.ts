import {
  MoonPhase,
  SearchMoonPhase,
  SearchSunLongitude,
  SunPosition,
} from 'astronomy-engine'
import { describe, expect, it } from 'vitest'

import { AstronomyEngineCelestialProvider } from '../astronomyEngineProvider'
import { angularDistanceDegrees } from '../normalization'
import { CelestialCalculationError } from '../types'

const provider = new AstronomyEngineCelestialProvider()

describe('AstronomyEngineCelestialProvider', () => {
  it.each(['1900-01-01T00:00:00Z', '2026-08-25T12:00:00+00:00', '2099-12-31T23:59:59Z'])(
    'returns bounded physical values for %s',
    (instantUtc) => {
      const snapshot = provider.calculate(instantUtc)
      expect(snapshot.instantUtc).toBe(new Date(instantUtc).toISOString())
      expect(snapshot.lunar.elongationDegrees).toBeGreaterThanOrEqual(0)
      expect(snapshot.lunar.elongationDegrees).toBeLessThan(360)
      expect(snapshot.lunar.illuminationFraction).toBeGreaterThanOrEqual(0)
      expect(snapshot.lunar.illuminationFraction).toBeLessThanOrEqual(1)
      expect(snapshot.solar.apparentSolarLongitudeDegrees).toBeGreaterThanOrEqual(0)
      expect(snapshot.solar.apparentSolarLongitudeDegrees).toBeLessThan(360)
      expect(snapshot.provider).toEqual({ id: 'astronomy-engine', version: '2.1.19' })
    },
  )

  it('rejects ambiguous local-only and invalid inputs', () => {
    expect(() => provider.calculate('2026-08-25T12:00:00')).toThrow(CelestialCalculationError)
    expect(() => provider.calculate('not-a-dateZ')).toThrow(CelestialCalculationError)
  })

  it.each([0, 90, 180, 270])('resolves an exact %i° lunar event', (target) => {
    const event = SearchMoonPhase(target, new Date('2026-01-01T00:00:00Z'), 40)
    expect(event).not.toBeNull()
    expect(angularDistanceDegrees(MoonPhase(event!), target)).toBeLessThan(1e-6)
  })

  it.each([0, 90, 150, 180, 270, 315])('resolves an exact %i° solar crossing', (target) => {
    const approximateStarts: Readonly<Record<number, string>> = {
      0: '2026-03-15T00:00:00Z',
      90: '2026-06-15T00:00:00Z',
      150: '2026-08-15T00:00:00Z',
      180: '2026-09-15T00:00:00Z',
      270: '2026-12-15T00:00:00Z',
      315: '2026-01-25T00:00:00Z',
    }
    const event = SearchSunLongitude(target, new Date(approximateStarts[target]!), 20)
    expect(event).not.toBeNull()
    expect(angularDistanceDegrees(SunPosition(event!).elon, target)).toBeLessThan(1e-6)
  })

  it('brackets one lunation and keeps the next quarter strictly in the future', () => {
    const instant = '2026-08-25T12:00:00.000Z'
    const lunar = provider.calculateLunar(instant)
    expect(new Date(lunar.previousNewMoonUtc).getTime()).toBeLessThanOrEqual(
      new Date(instant).getTime(),
    )
    expect(new Date(lunar.nextNewMoonUtc).getTime()).toBeGreaterThan(new Date(instant).getTime())
    expect(new Date(lunar.nextQuarter.instantUtc).getTime()).toBeGreaterThan(
      new Date(instant).getTime(),
    )
    expect(lunar.lunarAgeDays).toBeGreaterThanOrEqual(0)
    expect(lunar.lunationDurationDays).toBeGreaterThan(25)
    expect(lunar.lunationDurationDays).toBeLessThan(35)
    expect(lunar.lunationProgress).toBeGreaterThanOrEqual(0)
    expect(lunar.lunationProgress).toBeLessThan(1)
  })

  it('does not duplicate the same New Moon around an exact event input', () => {
    const event = SearchMoonPhase(0, new Date('2026-08-01T00:00:00Z'), 40)
    expect(event).not.toBeNull()
    const lunar = provider.calculateLunar(event!.date.toISOString())
    expect(lunar.previousNewMoonUtc).toBe(event!.date.toISOString())
    expect(new Date(lunar.nextNewMoonUtc).getTime()).toBeGreaterThan(event!.date.getTime())
  })

  it('activates the new Solar Term at its exact crossing and orders adjacent terms', () => {
    const event = SearchSunLongitude(315, new Date('2026-01-25T00:00:00Z'), 20)
    expect(event).not.toBeNull()
    const solar = provider.calculateSolar(event!.date.toISOString())
    expect(solar.currentSolarTerm.id).toBe('lichun')
    expect(solar.currentSolarTerm.instantUtc).toBe(event!.date.toISOString())
    expect(new Date(solar.previousSolarTerm.instantUtc).getTime()).toBeLessThan(event!.date.getTime())
    expect(new Date(solar.nextSolarTerm.instantUtc).getTime()).toBeGreaterThan(event!.date.getTime())
  })

  it('is deterministic for identical input', () => {
    const instant = '2026-08-25T12:00:00.000Z'
    expect(provider.calculate(instant)).toEqual(provider.calculate(instant))
  })
})
