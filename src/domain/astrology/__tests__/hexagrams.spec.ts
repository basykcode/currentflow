import { describe, expect, it } from 'vitest'

import { describeGanZhi } from '../ganZhi'
import { GENE_KEY_COUNT } from '../geneKeys'
import { getHexagram, getHexagrams, KING_WEN_HEXAGRAM_COUNT } from '../hexagrams'
import { JIA_ZI_MAPPING_COUNT, resolveJiaZiHexagram } from '../jiaZiHexagrams'

describe('hexagram reference data', () => {
  it('contains the complete King Wen catalog and 60 Jia Zi mapping', () => {
    expect(KING_WEN_HEXAGRAM_COUNT).toBe(64)
    expect(GENE_KEY_COUNT).toBe(64)
    expect(JIA_ZI_MAPPING_COUNT).toBe(60)
  })

  it('maps the Fire Horse pillar to Hexagram 28', () => {
    const hexagram = resolveJiaZiHexagram('丙午')

    expect(describeGanZhi('丙午')).toBe('丙午 · Yang Fire Horse')
    expect(hexagram).toEqual(getHexagram(28))
    expect(hexagram.nameEnglish).toBe('Preponderance of the Great')
    expect(hexagram.namePinyin).toBe('Dà Guò')
    expect(hexagram.geneKey).toMatchObject({
      shadow: 'Purposelessness',
      gift: 'Totality',
      siddhi: 'Immortality',
      status: 'curated',
    })
    expect(hexagram.linesBottomToTop).toEqual(['yin', 'yang', 'yang', 'yang', 'yang', 'yin'])
  })

  it('offers three complete, deterministic library orderings', () => {
    const kingWen = getHexagrams('king-wen')
    const binary = getHexagrams('fu-xi')
    const trigramMatrix = getHexagrams('trigram-matrix')

    expect(kingWen.map((item) => item.number).slice(0, 3)).toEqual([1, 2, 3])
    expect(binary).toHaveLength(64)
    expect(binary[0]?.number).toBe(2)
    expect(binary[63]?.number).toBe(1)
    expect(trigramMatrix).toHaveLength(64)

    for (const ordering of [kingWen, binary, trigramMatrix]) {
      expect(new Set(ordering.map((item) => item.number)).size).toBe(64)
    }
  })

  it('gives every catalog entry complete identity, trigram, and Gene Key provenance', () => {
    for (const hexagram of getHexagrams()) {
      expect(hexagram.nameChinese).not.toBe('')
      expect(hexagram.namePinyin).not.toBe('')
      expect(hexagram.lowerTrigram.linesBottomToTop).toEqual(
        hexagram.linesBottomToTop.slice(0, 3),
      )
      expect(hexagram.upperTrigram.linesBottomToTop).toEqual(
        hexagram.linesBottomToTop.slice(3, 6),
      )
      expect(hexagram.geneKey.shadow).not.toBe('')
      expect(hexagram.geneKey.gift).not.toBe('')
      expect(hexagram.geneKey.siddhi).not.toBe('')
      expect(hexagram.geneKey.sourceUrl).toContain(`gene-key-${hexagram.number}`)
    }
  })
})
