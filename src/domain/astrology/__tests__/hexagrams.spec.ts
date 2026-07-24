import { describe, expect, it } from 'vitest'

import { describeGanZhi } from '../ganZhi'
import { getHexagram, KING_WEN_HEXAGRAM_COUNT } from '../hexagrams'
import { JIA_ZI_MAPPING_COUNT, resolveJiaZiHexagram } from '../jiaZiHexagrams'

describe('hexagram reference data', () => {
  it('contains the complete King Wen catalog and 60 Jia Zi mapping', () => {
    expect(KING_WEN_HEXAGRAM_COUNT).toBe(64)
    expect(JIA_ZI_MAPPING_COUNT).toBe(60)
  })

  it('maps the Fire Horse pillar to Hexagram 28', () => {
    const hexagram = resolveJiaZiHexagram('丙午')

    expect(describeGanZhi('丙午')).toBe('丙午 · Yang Fire Horse')
    expect(hexagram).toEqual(getHexagram(28))
    expect(hexagram.nameEnglish).toBe('Great Exceeding')
    expect(hexagram.linesBottomToTop).toEqual(['yin', 'yang', 'yang', 'yang', 'yang', 'yin'])
  })
})
