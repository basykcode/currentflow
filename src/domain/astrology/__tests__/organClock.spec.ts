import { describe, expect, it } from 'vitest'

import { getOrganMoment } from '../organClock'

const EXPECTED_KEYS_BY_HOUR = [
  'gallbladder',
  'liver',
  'liver',
  'lung',
  'lung',
  'large-intestine',
  'large-intestine',
  'stomach',
  'stomach',
  'spleen',
  'spleen',
  'heart',
  'heart',
  'small-intestine',
  'small-intestine',
  'bladder',
  'bladder',
  'kidney',
  'kidney',
  'pericardium',
  'pericardium',
  'san-jiao',
  'san-jiao',
  'gallbladder',
] as const

describe('getOrganMoment', () => {
  it.each(EXPECTED_KEYS_BY_HOUR.map((key, hour) => [hour, key] as const))(
    'maps civil hour %i to %s',
    (hour, expectedKey) => {
      expect(getOrganMoment(hour).key).toBe(expectedKey)
    },
  )

  it('rejects hours outside the civil clock', () => {
    expect(() => getOrganMoment(-1)).toThrow()
    expect(() => getOrganMoment(24)).toThrow()
    expect(() => getOrganMoment(12.5)).toThrow()
  })
})
