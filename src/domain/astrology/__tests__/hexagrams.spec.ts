import { describe, expect, it } from 'vitest'

import { describeGanZhi, resolveGanZhiZodiac } from '../ganZhi'
import { GENE_KEY_COUNT } from '../geneKeys'
import { getHexagram, getHexagrams, KING_WEN_HEXAGRAM_COUNT } from '../hexagrams'
import {
  JIA_ZI_MAPPING_COUNT,
  JIA_ZI_MAPPING_VALIDATION,
  LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1,
  resolveJiaZiHexagram,
  validateJiaziHexagramMapping,
} from '../jiaZiHexagrams'

describe('hexagram reference data', () => {
  it('contains the complete King Wen catalog and 60 Jia Zi mapping', () => {
    expect(KING_WEN_HEXAGRAM_COUNT).toBe(64)
    expect(GENE_KEY_COUNT).toBe(64)
    expect(JIA_ZI_MAPPING_COUNT).toBe(60)
  })

  it('maps the Fire Horse pillar to Hexagram 28', () => {
    const hexagram = resolveJiaZiHexagram('丙午')

    expect(describeGanZhi('丙午')).toBe('丙午 · Fire Horse')
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

  it('resolves every Jiazi to one of 60 distinct zodiac element illustrations', () => {
    const illustrationKeys = LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.map((entry) => {
      const zodiac = resolveGanZhiZodiac(entry.ganZhi)
      return `${zodiac.animal}-${zodiac.element}`
    })

    expect(new Set(illustrationKeys).size).toBe(60)
    expect(resolveGanZhiZodiac('丙午')).toEqual({
      ganZhi: '丙午',
      polarity: 'yang',
      element: 'fire',
      animal: 'horse',
      animalLabel: 'Horse',
    })
    expect(resolveGanZhiZodiac('己未')).toMatchObject({
      element: 'earth',
      animal: 'goat',
      animalLabel: 'Goat',
    })
  })

  it('stores the intended 60-entry King Wen projection with the four pure gua omitted', () => {
    expect(JIA_ZI_MAPPING_VALIDATION).toEqual({
      entryCount: 60,
      distinctGanZhiCount: 60,
      distinctHexagramCount: 60,
      missingKingWenIds: [1, 2, 29, 30],
    })
    expect(JIA_ZI_MAPPING_VALIDATION.missingKingWenIds).not.toEqual(
      expect.arrayContaining([4, 44, 49]),
    )
    expect(LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.every((entry) => entry.sourceReferenceId)).toBe(
      true,
    )
  })

  it('selects the non-pure member of every dual-assignment Jiazi', () => {
    expect(resolveJiaZiHexagram('甲子')).toMatchObject({ number: 24, nameChinese: '復' })
    expect(resolveJiaZiHexagram('庚寅')).toMatchObject({ number: 49, nameChinese: '革' })
    expect(resolveJiaZiHexagram('甲午')).toMatchObject({ number: 44, nameChinese: '姤' })
    expect(resolveJiaZiHexagram('庚申')).toMatchObject({ number: 4, nameChinese: '蒙' })
  })

  it('rejects the former hybrid omission set', () => {
    const legacyAssignments = new Map([
      ['庚寅', 30],
      ['甲午', 1],
      ['庚申', 29],
    ])
    const legacyHybrid = {
      ...LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1,
      entries: LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.map((entry) => {
        const replacement = legacyAssignments.get(entry.ganZhi)
        if (!replacement) return entry
        const canonical = getHexagram(replacement)
        return {
          ...entry,
          hexagramIdKingWen: replacement,
          hexagramNameChinese: canonical.nameChinese,
          hexagramNameEnglish: canonical.nameEnglish,
        }
      }),
      excludedHexagrams: [2, 4, 44, 49],
      version: 'old-current-table',
    }

    expect(() => validateJiaziHexagramMapping(legacyHybrid)).toThrow(
      /must omit King Wen IDs 1, 2, 29, 30/i,
    )
  })

  it('changes only the three incorrect assignments from old-current-table', () => {
    const oldAssignmentKingWenIds = [
      24, 21, 37, 41, 10, 34, 32, 6, 7, 53, 39, 35, 27, 17, 55, 60, 11, 14, 57, 47, 64, 33, 52, 16,
      3, 25, 30, 61, 26, 43, 1, 48, 40, 31, 15, 20, 42, 36, 13, 54, 38, 5, 28, 18, 59, 56, 12, 8,
      51, 22, 63, 19, 58, 9, 50, 46, 29, 62, 45, 23,
    ]
    const changes = LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.flatMap((entry, index) => {
      const oldKingWenId = oldAssignmentKingWenIds[index]
      return oldKingWenId === entry.hexagramIdKingWen
        ? []
        : [{ ganZhi: entry.ganZhi, from: oldKingWenId, to: entry.hexagramIdKingWen }]
    })

    expect(changes).toEqual([
      { ganZhi: '庚寅', from: 30, to: 49 },
      { ganZhi: '甲午', from: 1, to: 44 },
      { ganZhi: '庚申', from: 29, to: 4 },
    ])
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
      expect(hexagram.lowerTrigram.linesBottomToTop).toEqual(hexagram.linesBottomToTop.slice(0, 3))
      expect(hexagram.upperTrigram.linesBottomToTop).toEqual(hexagram.linesBottomToTop.slice(3, 6))
      expect(hexagram.geneKey.shadow).not.toBe('')
      expect(hexagram.geneKey.gift).not.toBe('')
      expect(hexagram.geneKey.siddhi).not.toBe('')
      expect(hexagram.geneKey.sourceUrl).toContain(`gene-key-${hexagram.number}`)
    }
  })
})
