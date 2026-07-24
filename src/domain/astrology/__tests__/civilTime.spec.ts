import { describe, expect, it } from 'vitest'

import { getZonedCivilTime } from '../civilTime'

describe('getZonedCivilTime', () => {
  it('projects an instant into the requested IANA timezone', () => {
    const civil = getZonedCivilTime(new Date('2026-07-23T16:05:06.000Z'), 'America/New_York')

    expect(civil).toMatchObject({
      year: 2026,
      month: 7,
      day: 23,
      hour: 12,
      minute: 5,
      second: 6,
      timezone: 'America/New_York',
      usedTimezoneFallback: false,
    })
  })

  it('falls back instead of passing an invalid timezone into calculations', () => {
    const civil = getZonedCivilTime(new Date('2026-07-23T16:05:06.000Z'), 'Not/A_Zone')

    expect(civil.usedTimezoneFallback).toBe(true)
    expect(civil.timezone).not.toBe('Not/A_Zone')
  })
})
