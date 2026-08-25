import { getHexagram, KING_WEN_HEXAGRAM_COUNT } from './hexagrams'

export type SourceReference = {
  sourceId: string
  title: string
  creator: string
  publishedYear: number
  sourceUrl: string
  role: 'entry-table' | 'omission-rule' | 'independent-cross-check'
}

export type SourceMetadata = {
  statement: string
  references: readonly SourceReference[]
}

export type JiaziHexagramEntry = {
  ganZhi: string
  stem: string
  branch: string
  hexagramIdKingWen: number
  hexagramNameChinese: string
  hexagramNameEnglish: string
  /** One-based position in the canonical sexagenary cycle. */
  sourceIndex?: number
  /** Identifies the entry-level source within the mapping metadata. */
  sourceReferenceId: string
}

export type TemporalHexagramMapping = {
  mappingId: string
  system: 'liu-shi-jiazi-peigua'
  numberingSystem: 'king-wen'
  entries: readonly JiaziHexagramEntry[]
  excludedHexagrams: readonly number[]
  sourceMetadata: SourceMetadata
  version: string
}

export type JiaziHexagramMappingValidation = {
  entryCount: number
  distinctGanZhiCount: number
  distinctHexagramCount: number
  missingKingWenIds: readonly number[]
}

const ENTRY_SOURCE_ID = 'howard-choy-2011-60-jiazi-to-64-da-gua'

const ENTRIES: readonly JiaziHexagramEntry[] = [
  {
    ganZhi: '甲子',
    stem: '甲',
    branch: '子',
    hexagramIdKingWen: 24,
    hexagramNameChinese: '復',
    hexagramNameEnglish: 'Return',
    sourceIndex: 1,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙丑',
    stem: '乙',
    branch: '丑',
    hexagramIdKingWen: 21,
    hexagramNameChinese: '噬嗑',
    hexagramNameEnglish: 'Biting Through',
    sourceIndex: 2,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙寅',
    stem: '丙',
    branch: '寅',
    hexagramIdKingWen: 37,
    hexagramNameChinese: '家人',
    hexagramNameEnglish: 'The Family',
    sourceIndex: 3,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁卯',
    stem: '丁',
    branch: '卯',
    hexagramIdKingWen: 41,
    hexagramNameChinese: '損',
    hexagramNameEnglish: 'Decrease',
    sourceIndex: 4,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊辰',
    stem: '戊',
    branch: '辰',
    hexagramIdKingWen: 10,
    hexagramNameChinese: '履',
    hexagramNameEnglish: 'Treading',
    sourceIndex: 5,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己巳',
    stem: '己',
    branch: '巳',
    hexagramIdKingWen: 34,
    hexagramNameChinese: '大壯',
    hexagramNameEnglish: 'The Power of the Great',
    sourceIndex: 6,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚午',
    stem: '庚',
    branch: '午',
    hexagramIdKingWen: 32,
    hexagramNameChinese: '恆',
    hexagramNameEnglish: 'Duration',
    sourceIndex: 7,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛未',
    stem: '辛',
    branch: '未',
    hexagramIdKingWen: 6,
    hexagramNameChinese: '訟',
    hexagramNameEnglish: 'Conflict',
    sourceIndex: 8,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬申',
    stem: '壬',
    branch: '申',
    hexagramIdKingWen: 7,
    hexagramNameChinese: '師',
    hexagramNameEnglish: 'The Army',
    sourceIndex: 9,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸酉',
    stem: '癸',
    branch: '酉',
    hexagramIdKingWen: 53,
    hexagramNameChinese: '漸',
    hexagramNameEnglish: 'Development',
    sourceIndex: 10,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '甲戌',
    stem: '甲',
    branch: '戌',
    hexagramIdKingWen: 39,
    hexagramNameChinese: '蹇',
    hexagramNameEnglish: 'Obstruction',
    sourceIndex: 11,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙亥',
    stem: '乙',
    branch: '亥',
    hexagramIdKingWen: 35,
    hexagramNameChinese: '晉',
    hexagramNameEnglish: 'Progress',
    sourceIndex: 12,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙子',
    stem: '丙',
    branch: '子',
    hexagramIdKingWen: 27,
    hexagramNameChinese: '頤',
    hexagramNameEnglish: 'Nourishment',
    sourceIndex: 13,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁丑',
    stem: '丁',
    branch: '丑',
    hexagramIdKingWen: 17,
    hexagramNameChinese: '隨',
    hexagramNameEnglish: 'Following',
    sourceIndex: 14,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊寅',
    stem: '戊',
    branch: '寅',
    hexagramIdKingWen: 55,
    hexagramNameChinese: '豐',
    hexagramNameEnglish: 'Abundance',
    sourceIndex: 15,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己卯',
    stem: '己',
    branch: '卯',
    hexagramIdKingWen: 60,
    hexagramNameChinese: '節',
    hexagramNameEnglish: 'Limitation',
    sourceIndex: 16,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚辰',
    stem: '庚',
    branch: '辰',
    hexagramIdKingWen: 11,
    hexagramNameChinese: '泰',
    hexagramNameEnglish: 'Peace',
    sourceIndex: 17,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛巳',
    stem: '辛',
    branch: '巳',
    hexagramIdKingWen: 14,
    hexagramNameChinese: '大有',
    hexagramNameEnglish: 'Great Possession',
    sourceIndex: 18,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬午',
    stem: '壬',
    branch: '午',
    hexagramIdKingWen: 57,
    hexagramNameChinese: '巽',
    hexagramNameEnglish: 'The Gentle Wind',
    sourceIndex: 19,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸未',
    stem: '癸',
    branch: '未',
    hexagramIdKingWen: 47,
    hexagramNameChinese: '困',
    hexagramNameEnglish: 'Oppression',
    sourceIndex: 20,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '甲申',
    stem: '甲',
    branch: '申',
    hexagramIdKingWen: 64,
    hexagramNameChinese: '未濟',
    hexagramNameEnglish: 'Before Completion',
    sourceIndex: 21,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙酉',
    stem: '乙',
    branch: '酉',
    hexagramIdKingWen: 33,
    hexagramNameChinese: '遯',
    hexagramNameEnglish: 'Retreat',
    sourceIndex: 22,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙戌',
    stem: '丙',
    branch: '戌',
    hexagramIdKingWen: 52,
    hexagramNameChinese: '艮',
    hexagramNameEnglish: 'Keeping Still Mountain',
    sourceIndex: 23,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁亥',
    stem: '丁',
    branch: '亥',
    hexagramIdKingWen: 16,
    hexagramNameChinese: '豫',
    hexagramNameEnglish: 'Enthusiasm',
    sourceIndex: 24,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊子',
    stem: '戊',
    branch: '子',
    hexagramIdKingWen: 3,
    hexagramNameChinese: '屯',
    hexagramNameEnglish: 'Difficulty at the Beginning',
    sourceIndex: 25,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己丑',
    stem: '己',
    branch: '丑',
    hexagramIdKingWen: 25,
    hexagramNameChinese: '無妄',
    hexagramNameEnglish: 'Innocence',
    sourceIndex: 26,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚寅',
    stem: '庚',
    branch: '寅',
    hexagramIdKingWen: 49,
    hexagramNameChinese: '革',
    hexagramNameEnglish: 'Revolution',
    sourceIndex: 27,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛卯',
    stem: '辛',
    branch: '卯',
    hexagramIdKingWen: 61,
    hexagramNameChinese: '中孚',
    hexagramNameEnglish: 'Inner Truth',
    sourceIndex: 28,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬辰',
    stem: '壬',
    branch: '辰',
    hexagramIdKingWen: 26,
    hexagramNameChinese: '大畜',
    hexagramNameEnglish: 'The Taming Power of the Great',
    sourceIndex: 29,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸巳',
    stem: '癸',
    branch: '巳',
    hexagramIdKingWen: 43,
    hexagramNameChinese: '夬',
    hexagramNameEnglish: 'Breakthrough',
    sourceIndex: 30,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '甲午',
    stem: '甲',
    branch: '午',
    hexagramIdKingWen: 44,
    hexagramNameChinese: '姤',
    hexagramNameEnglish: 'Coming to Meet',
    sourceIndex: 31,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙未',
    stem: '乙',
    branch: '未',
    hexagramIdKingWen: 48,
    hexagramNameChinese: '井',
    hexagramNameEnglish: 'The Well',
    sourceIndex: 32,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙申',
    stem: '丙',
    branch: '申',
    hexagramIdKingWen: 40,
    hexagramNameChinese: '解',
    hexagramNameEnglish: 'Deliverance',
    sourceIndex: 33,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁酉',
    stem: '丁',
    branch: '酉',
    hexagramIdKingWen: 31,
    hexagramNameChinese: '咸',
    hexagramNameEnglish: 'Influence',
    sourceIndex: 34,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊戌',
    stem: '戊',
    branch: '戌',
    hexagramIdKingWen: 15,
    hexagramNameChinese: '謙',
    hexagramNameEnglish: 'Modesty',
    sourceIndex: 35,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己亥',
    stem: '己',
    branch: '亥',
    hexagramIdKingWen: 20,
    hexagramNameChinese: '觀',
    hexagramNameEnglish: 'Contemplation',
    sourceIndex: 36,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚子',
    stem: '庚',
    branch: '子',
    hexagramIdKingWen: 42,
    hexagramNameChinese: '益',
    hexagramNameEnglish: 'Increase',
    sourceIndex: 37,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛丑',
    stem: '辛',
    branch: '丑',
    hexagramIdKingWen: 36,
    hexagramNameChinese: '明夷',
    hexagramNameEnglish: 'Darkening of the Light',
    sourceIndex: 38,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬寅',
    stem: '壬',
    branch: '寅',
    hexagramIdKingWen: 13,
    hexagramNameChinese: '同人',
    hexagramNameEnglish: 'Fellowship with People',
    sourceIndex: 39,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸卯',
    stem: '癸',
    branch: '卯',
    hexagramIdKingWen: 54,
    hexagramNameChinese: '歸妹',
    hexagramNameEnglish: 'The Marrying Maiden',
    sourceIndex: 40,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '甲辰',
    stem: '甲',
    branch: '辰',
    hexagramIdKingWen: 38,
    hexagramNameChinese: '睽',
    hexagramNameEnglish: 'Opposition',
    sourceIndex: 41,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙巳',
    stem: '乙',
    branch: '巳',
    hexagramIdKingWen: 5,
    hexagramNameChinese: '需',
    hexagramNameEnglish: 'Waiting',
    sourceIndex: 42,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙午',
    stem: '丙',
    branch: '午',
    hexagramIdKingWen: 28,
    hexagramNameChinese: '大過',
    hexagramNameEnglish: 'Preponderance of the Great',
    sourceIndex: 43,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁未',
    stem: '丁',
    branch: '未',
    hexagramIdKingWen: 18,
    hexagramNameChinese: '蠱',
    hexagramNameEnglish: 'Work on What Has Been Spoiled',
    sourceIndex: 44,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊申',
    stem: '戊',
    branch: '申',
    hexagramIdKingWen: 59,
    hexagramNameChinese: '渙',
    hexagramNameEnglish: 'Dispersion',
    sourceIndex: 45,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己酉',
    stem: '己',
    branch: '酉',
    hexagramIdKingWen: 56,
    hexagramNameChinese: '旅',
    hexagramNameEnglish: 'The Wanderer',
    sourceIndex: 46,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚戌',
    stem: '庚',
    branch: '戌',
    hexagramIdKingWen: 12,
    hexagramNameChinese: '否',
    hexagramNameEnglish: 'Standstill',
    sourceIndex: 47,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛亥',
    stem: '辛',
    branch: '亥',
    hexagramIdKingWen: 8,
    hexagramNameChinese: '比',
    hexagramNameEnglish: 'Holding Together',
    sourceIndex: 48,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬子',
    stem: '壬',
    branch: '子',
    hexagramIdKingWen: 51,
    hexagramNameChinese: '震',
    hexagramNameEnglish: 'The Arousing Thunder',
    sourceIndex: 49,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸丑',
    stem: '癸',
    branch: '丑',
    hexagramIdKingWen: 22,
    hexagramNameChinese: '賁',
    hexagramNameEnglish: 'Grace',
    sourceIndex: 50,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '甲寅',
    stem: '甲',
    branch: '寅',
    hexagramIdKingWen: 63,
    hexagramNameChinese: '既濟',
    hexagramNameEnglish: 'After Completion',
    sourceIndex: 51,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '乙卯',
    stem: '乙',
    branch: '卯',
    hexagramIdKingWen: 19,
    hexagramNameChinese: '臨',
    hexagramNameEnglish: 'Approach',
    sourceIndex: 52,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丙辰',
    stem: '丙',
    branch: '辰',
    hexagramIdKingWen: 58,
    hexagramNameChinese: '兌',
    hexagramNameEnglish: 'The Joyous Lake',
    sourceIndex: 53,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '丁巳',
    stem: '丁',
    branch: '巳',
    hexagramIdKingWen: 9,
    hexagramNameChinese: '小畜',
    hexagramNameEnglish: 'The Taming Power of the Small',
    sourceIndex: 54,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '戊午',
    stem: '戊',
    branch: '午',
    hexagramIdKingWen: 50,
    hexagramNameChinese: '鼎',
    hexagramNameEnglish: 'The Cauldron',
    sourceIndex: 55,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '己未',
    stem: '己',
    branch: '未',
    hexagramIdKingWen: 46,
    hexagramNameChinese: '升',
    hexagramNameEnglish: 'Pushing Upward',
    sourceIndex: 56,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '庚申',
    stem: '庚',
    branch: '申',
    hexagramIdKingWen: 4,
    hexagramNameChinese: '蒙',
    hexagramNameEnglish: 'Youthful Folly',
    sourceIndex: 57,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '辛酉',
    stem: '辛',
    branch: '酉',
    hexagramIdKingWen: 62,
    hexagramNameChinese: '小過',
    hexagramNameEnglish: 'Preponderance of the Small',
    sourceIndex: 58,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '壬戌',
    stem: '壬',
    branch: '戌',
    hexagramIdKingWen: 45,
    hexagramNameChinese: '萃',
    hexagramNameEnglish: 'Gathering Together',
    sourceIndex: 59,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
  {
    ganZhi: '癸亥',
    stem: '癸',
    branch: '亥',
    hexagramIdKingWen: 23,
    hexagramNameChinese: '剝',
    hexagramNameEnglish: 'Splitting Apart',
    sourceIndex: 60,
    sourceReferenceId: ENTRY_SOURCE_ID,
  },
]

export const TEMPORAL_HEXAGRAM_MAPPING_VERSION = 'liu-shi-jiazi-peigua-king-wen-v1'

export const LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1: TemporalHexagramMapping = {
  mappingId: 'liu-shi-jiazi-peigua-king-wen',
  system: 'liu-shi-jiazi-peigua',
  numberingSystem: 'king-wen',
  entries: ENTRIES,
  excludedHexagrams: [1, 2, 29, 30],
  sourceMetadata: {
    statement:
      'A sixty-entry King Wen projection of the 64-row Jiazi/Da Gua association, selecting 復, 革, 姤, and 蒙 for the four dual-assignment Jiazi and leaving the four pure gua unassigned.',
    references: [
      {
        sourceId: ENTRY_SOURCE_ID,
        title: '60 Jia Zi to 64 Da Gua',
        creator: 'Howard Choy',
        publishedYear: 2011,
        sourceUrl: 'https://howardchoy.wordpress.com/2011/05/23/xuan-kong-da-gua-date-selection/',
        role: 'entry-table',
      },
      {
        sourceId: 'hu-guozhen-luojing-jieding-1926',
        title: '羅經解定 · 第十二層人元周易卦並卦爻吉凶',
        creator: '胡國楨撰 · 秦慎安校勘',
        publishedYear: 1926,
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:NLC511-13056616-69088_%E7%BE%85%E7%B6%93%E8%A7%A3%E5%AE%9A%EF%BC%88%E4%B8%8A%E5%86%8A%EF%BC%89.pdf',
        role: 'omission-rule',
      },
      {
        sourceId: 'chinese-metasoft-64-hexagrams',
        title: '64 Hexagrams 六十四卦',
        creator: 'Chinese Metasoft',
        publishedYear: 2014,
        sourceUrl: 'https://chinesemetasoft.org/Table/Hexagrams',
        role: 'independent-cross-check',
      },
    ],
  },
  version: TEMPORAL_HEXAGRAM_MAPPING_VERSION,
}

const expectedMissingKingWenIds = [1, 2, 29, 30] as const
const forbiddenMissingKingWenIds = [4, 44, 49] as const

const sameNumbers = (left: readonly number[], right: readonly number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

export const getExcludedKingWenIds = (mapping: TemporalHexagramMapping): readonly number[] => {
  const assigned = new Set(mapping.entries.map((entry) => entry.hexagramIdKingWen))
  return Array.from({ length: KING_WEN_HEXAGRAM_COUNT }, (_, index) => index + 1).filter(
    (number) => !assigned.has(number),
  )
}

export const validateJiaziHexagramMapping = (
  mapping: TemporalHexagramMapping,
): JiaziHexagramMappingValidation => {
  if (mapping.entries.length !== 60) {
    throw new Error(
      `Jiazi mapping must contain exactly 60 entries; found ${mapping.entries.length}.`,
    )
  }
  const numberingSystem: string = mapping.numberingSystem
  if (numberingSystem !== 'king-wen') {
    throw new Error(`Jiazi mapping must store canonical King Wen IDs; found ${numberingSystem}.`)
  }
  if (mapping.sourceMetadata.references.length === 0) {
    throw new Error('Jiazi mapping must declare source metadata.')
  }

  const sourceIds = new Set(mapping.sourceMetadata.references.map((source) => source.sourceId))
  const ganZhi = new Set<string>()
  const hexagramIds = new Set<number>()

  mapping.entries.forEach((entry, index) => {
    if (ganZhi.has(entry.ganZhi)) {
      throw new Error(`Duplicate Jiazi assignment: ${entry.ganZhi}.`)
    }
    ganZhi.add(entry.ganZhi)

    if (hexagramIds.has(entry.hexagramIdKingWen)) {
      throw new Error(`Duplicate King Wen assignment: ${entry.hexagramIdKingWen}.`)
    }
    hexagramIds.add(entry.hexagramIdKingWen)

    const [stem, branch, ...extra] = [...entry.ganZhi]
    if (!stem || !branch || extra.length > 0 || stem !== entry.stem || branch !== entry.branch) {
      throw new Error(`Jiazi stem/branch metadata does not match ${entry.ganZhi}.`)
    }
    if (entry.sourceIndex !== index + 1) {
      throw new Error(`Jiazi ${entry.ganZhi} must declare sexagenary source index ${index + 1}.`)
    }
    if (!sourceIds.has(entry.sourceReferenceId)) {
      throw new Error(`Jiazi ${entry.ganZhi} has no matching source metadata.`)
    }

    const canonical = getHexagram(entry.hexagramIdKingWen)
    if (!entry.hexagramNameChinese || entry.hexagramNameChinese !== canonical.nameChinese) {
      throw new Error(`Jiazi ${entry.ganZhi} has invalid canonical Chinese hexagram identity.`)
    }
    if (!entry.hexagramNameEnglish || entry.hexagramNameEnglish !== canonical.nameEnglish) {
      throw new Error(`Jiazi ${entry.ganZhi} has invalid canonical English hexagram identity.`)
    }
  })

  const missingKingWenIds = getExcludedKingWenIds(mapping)
  if (!sameNumbers(missingKingWenIds, expectedMissingKingWenIds)) {
    throw new Error(
      `Jiazi mapping must omit King Wen IDs ${expectedMissingKingWenIds.join(', ')}; found ${missingKingWenIds.join(', ')}.`,
    )
  }
  if (forbiddenMissingKingWenIds.some((number) => missingKingWenIds.includes(number))) {
    throw new Error('Jiazi mapping must not omit 蒙 4, 姤 44, or 革 49.')
  }
  if (!sameNumbers(mapping.excludedHexagrams, missingKingWenIds)) {
    throw new Error('Declared exclusions do not match the exclusions derived from the 60 entries.')
  }

  return {
    entryCount: mapping.entries.length,
    distinctGanZhiCount: ganZhi.size,
    distinctHexagramCount: hexagramIds.size,
    missingKingWenIds,
  }
}

export const JIA_ZI_MAPPING_VALIDATION = validateJiaziHexagramMapping(
  LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1,
)

const byGanZhi = new Map(
  LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.map((entry) => [entry.ganZhi, entry]),
)

export const resolveJiaZiHexagramEntry = (ganZhi: string): JiaziHexagramEntry => {
  const entry = byGanZhi.get(ganZhi)
  if (!entry) {
    throw new Error(`No ${LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.system} mapping exists for ${ganZhi}.`)
  }
  return entry
}

export const resolveJiaZiHexagram = (ganZhi: string) =>
  getHexagram(resolveJiaZiHexagramEntry(ganZhi).hexagramIdKingWen)

export const JIA_ZI_MAPPING_COUNT = LIU_SHI_JIAZI_PEIGUA_KING_WEN_V1.entries.length
