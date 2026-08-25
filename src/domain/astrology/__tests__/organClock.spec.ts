import { describe, expect, it } from 'vitest'

import { getOrganMoment } from '../organClock'

const EXPECTED_BY_HOUR = [
  ['gallbladder', 'wood'],
  ['liver', 'wood'],
  ['liver', 'wood'],
  ['lung', 'metal'],
  ['lung', 'metal'],
  ['large-intestine', 'metal'],
  ['large-intestine', 'metal'],
  ['stomach', 'earth'],
  ['stomach', 'earth'],
  ['spleen', 'earth'],
  ['spleen', 'earth'],
  ['heart', 'fire'],
  ['heart', 'fire'],
  ['small-intestine', 'fire'],
  ['small-intestine', 'fire'],
  ['bladder', 'water'],
  ['bladder', 'water'],
  ['kidney', 'water'],
  ['kidney', 'water'],
  ['pericardium', 'fire'],
  ['pericardium', 'fire'],
  ['san-jiao', 'fire'],
  ['san-jiao', 'fire'],
  ['gallbladder', 'wood'],
] as const

describe('getOrganMoment', () => {
  it.each(EXPECTED_BY_HOUR.map(([key, element], hour) => [hour, key, element] as const))(
    'maps civil hour %i to %s and its element',
    (hour, expectedKey, expectedElement) => {
      expect(getOrganMoment(hour)).toMatchObject({ key: expectedKey, element: expectedElement })
    },
  )

  it('rejects hours outside the civil clock', () => {
    expect(() => getOrganMoment(-1)).toThrow()
    expect(() => getOrganMoment(24)).toThrow()
    expect(() => getOrganMoment(12.5)).toThrow()
  })
})
