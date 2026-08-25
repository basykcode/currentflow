import { describe, expect, it } from 'vitest'

import { getChuZhengKeMoment, getOrganMoment } from '../organClock'

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

  it.each([
    [11, 0, 'chu', 0, '初初刻', 'Chū Chū Kè', '11:00–11:15', 'Arriving'],
    [11, 15, 'chu', 1, '初一刻', 'Chū Yī Kè', '11:15–11:30', 'Gathering'],
    [11, 30, 'chu', 2, '初二刻', 'Chū Èr Kè', '11:30–11:45', 'Deepening'],
    [11, 45, 'chu', 3, '初三刻', 'Chū Sān Kè', '11:45–12:00', 'Cresting'],
    [12, 0, 'zheng', 0, '正初刻', 'Zhèng Chū Kè', '12:00–12:15', 'Fullness'],
    [12, 15, 'zheng', 1, '正一刻', 'Zhèng Yī Kè', '12:15–12:30', 'Circulating'],
    [12, 30, 'zheng', 2, '正二刻', 'Zhèng Èr Kè', '12:30–12:45', 'Integrating'],
    [12, 45, 'zheng', 3, '正三刻', 'Zhèng Sān Kè', '12:45–13:00', 'Releasing'],
  ] as const)(
    'resolves %i:%i to the exact Chu-Zheng-Ke interval',
    (hour, minute, segment, keIndex, chinese, pinyin, range, phase) => {
      const moment = getChuZhengKeMoment(hour, minute)

      expect(moment).toMatchObject({
        segment,
        keIndex,
        nameChinese: chinese,
        namePinyin: pinyin,
        timeRangeLabel: range,
        cultivationPhase: phase,
        status: 'computed',
        cultivationStatus: 'current-formalization',
      })
    },
  )

  it('wraps quarter bounds across civil midnight', () => {
    expect(getChuZhengKeMoment(23, 45).timeRangeLabel).toBe('23:45–00:00')
  })

  it('rejects invalid civil minutes', () => {
    expect(() => getChuZhengKeMoment(11, -1)).toThrow()
    expect(() => getChuZhengKeMoment(11, 60)).toThrow()
    expect(() => getChuZhengKeMoment(11, 12.5)).toThrow()
  })
})
