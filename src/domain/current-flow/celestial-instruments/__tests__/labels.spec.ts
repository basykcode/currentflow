import { describe, expect, it } from 'vitest'

import {
  CANTONG_QI_DISPLAY_DEFINITIONS,
  EARTHLY_BRANCH_MONTH_DEFINITIONS,
  SOLAR_TERM_DISPLAY_DEFINITIONS,
  resolveAnnualYinYangMovement,
} from '../labels'

describe('celestial display registries', () => {
  it('locks all six Cantong qi home glosses and movements', () => {
    expect(CANTONG_QI_DISPLAY_DEFINITIONS).toEqual([
      expect.objectContaining({
        character: '震',
        pinyin: 'Zhèn',
        englishLabel: 'Emergence',
        yinYangMovement: 'Yang Emerging',
      }),
      expect.objectContaining({
        character: '兌',
        pinyin: 'Duì',
        englishLabel: 'Accumulation',
        yinYangMovement: 'Yang Growing',
      }),
      expect.objectContaining({
        character: '乾',
        pinyin: 'Qián',
        englishLabel: 'Culmination',
        yinYangMovement: 'Yang Full',
      }),
      expect.objectContaining({
        character: '巽',
        pinyin: 'Xùn',
        englishLabel: 'Distribution',
        yinYangMovement: 'Yin Emerging',
      }),
      expect.objectContaining({
        character: '艮',
        pinyin: 'Gèn',
        englishLabel: 'Consolidation',
        yinYangMovement: 'Yin Growing',
      }),
      expect.objectContaining({
        character: '坤',
        pinyin: 'Kūn',
        englishLabel: 'Concealment',
        yinYangMovement: 'Yin Full',
      }),
    ])
  })

  it('contains all twelve Branches in clockwise ring order', () => {
    expect(EARTHLY_BRANCH_MONTH_DEFINITIONS.map(({ character }) => character).join('')).toBe(
      '子丑寅卯辰巳午未申酉戌亥',
    )
  })

  it('locks all twenty-four Solar Terms with complete display metadata', () => {
    expect(SOLAR_TERM_DISPLAY_DEFINITIONS).toHaveLength(24)
    expect(new Set(SOLAR_TERM_DISPLAY_DEFINITIONS.map(({ id }) => id)).size).toBe(24)
    expect(
      SOLAR_TERM_DISPLAY_DEFINITIONS.map(({ solarLongitudeDegrees }) => solarLongitudeDegrees).sort(
        (a, b) => a - b,
      ),
    ).toEqual(Array.from({ length: 24 }, (_, index) => index * 15))

    for (const definition of SOLAR_TERM_DISPLAY_DEFINITIONS) {
      expect(definition.chineseTraditional).not.toBe('')
      expect(definition.pinyin).not.toBe('')
      expect(definition.contextualEnglish).not.toBe('')
      expect(definition.displayTableVersion).toBe('solar-term-display-labels:current-en-v1')
    }
  })

  it('uses the reviewed Chushu display label', () => {
    expect(SOLAR_TERM_DISPLAY_DEFINITIONS.find(({ id }) => id === 'chushu')).toEqual(
      expect.objectContaining({
        chineseTraditional: '處暑',
        pinyin: 'Chǔshǔ',
        contextualEnglish: 'Limit of Heat',
        solarLongitudeDegrees: 150,
      }),
    )
  })

  it('projects the reviewed annual movement examples through one versioned term mapping', () => {
    expect(resolveAnnualYinYangMovement('dongzhi')).toBe('Yang Returning')
    expect(resolveAnnualYinYangMovement('lichun')).toBe('Yang Emerging')
    expect(resolveAnnualYinYangMovement('chunfen')).toBe('Yang Growing')
    expect(resolveAnnualYinYangMovement('lixia')).toBe('Yang Growing')
    expect(resolveAnnualYinYangMovement('xiazhi')).toBe('Yang Full')
    expect(resolveAnnualYinYangMovement('liqiu')).toBe('Yin Emerging')
    expect(resolveAnnualYinYangMovement('chushu')).toBe('Yang Descending')
    expect(resolveAnnualYinYangMovement('qiufen')).toBe('Yin Growing')
    expect(resolveAnnualYinYangMovement('lidong')).toBe('Yin Full')
    for (const term of SOLAR_TERM_DISPLAY_DEFINITIONS) {
      expect(resolveAnnualYinYangMovement(term.id)).not.toBeNull()
    }
  })
})
