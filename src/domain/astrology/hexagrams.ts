import { getGeneKeySpectrum } from './geneKeys'
import { EARLY_HEAVEN_TRIGRAM_ORDER, getTrigram } from './trigrams'
import type {
  HexagramLines,
  HexagramReference,
  LinePolarity,
  TrigramKey,
} from './types'

type HexagramDefinition = {
  number: number
  nameEnglish: string
  nameChinese: string
  namePinyin: string
  lower: TrigramKey
  upper: TrigramKey
}

export type HexagramOrder = 'king-wen' | 'fu-xi' | 'trigram-matrix'

export const HEXAGRAM_ORDERS: readonly {
  value: HexagramOrder
  label: string
  description: string
}[] = [
  {
    value: 'king-wen',
    label: 'King Wen',
    description: 'Traditional received sequence, numbered 1–64',
  },
  {
    value: 'fu-xi',
    label: 'Fu Xi · binary',
    description: 'All-yin to all-yang by six-line binary value',
  },
  {
    value: 'trigram-matrix',
    label: 'Trigram matrix',
    description: 'Grouped by upper, then lower trigram in Early Heaven order',
  },
]

const HEXAGRAM_SOURCE_LABEL =
  'Zhouyi received names · King Wen numbering · Wilhelm/Baynes English convention'

const DEFINITIONS: readonly HexagramDefinition[] = [
  {
    number: 1,
    nameEnglish: 'The Creative',
    nameChinese: '乾',
    namePinyin: 'Qián',
    lower: 'qian',
    upper: 'qian',
  },
  {
    number: 2,
    nameEnglish: 'The Receptive',
    nameChinese: '坤',
    namePinyin: 'Kūn',
    lower: 'kun',
    upper: 'kun',
  },
  {
    number: 3,
    nameEnglish: 'Difficulty at the Beginning',
    nameChinese: '屯',
    namePinyin: 'Zhūn',
    lower: 'zhen',
    upper: 'kan',
  },
  {
    number: 4,
    nameEnglish: 'Youthful Folly',
    nameChinese: '蒙',
    namePinyin: 'Méng',
    lower: 'kan',
    upper: 'gen',
  },
  {
    number: 5,
    nameEnglish: 'Waiting',
    nameChinese: '需',
    namePinyin: 'Xū',
    lower: 'qian',
    upper: 'kan',
  },
  {
    number: 6,
    nameEnglish: 'Conflict',
    nameChinese: '訟',
    namePinyin: 'Sòng',
    lower: 'kan',
    upper: 'qian',
  },
  {
    number: 7,
    nameEnglish: 'The Army',
    nameChinese: '師',
    namePinyin: 'Shī',
    lower: 'kan',
    upper: 'kun',
  },
  {
    number: 8,
    nameEnglish: 'Holding Together',
    nameChinese: '比',
    namePinyin: 'Bǐ',
    lower: 'kun',
    upper: 'kan',
  },
  {
    number: 9,
    nameEnglish: 'The Taming Power of the Small',
    nameChinese: '小畜',
    namePinyin: 'Xiǎo Chù',
    lower: 'qian',
    upper: 'xun',
  },
  {
    number: 10,
    nameEnglish: 'Treading',
    nameChinese: '履',
    namePinyin: 'Lǚ',
    lower: 'dui',
    upper: 'qian',
  },
  {
    number: 11,
    nameEnglish: 'Peace',
    nameChinese: '泰',
    namePinyin: 'Tài',
    lower: 'qian',
    upper: 'kun',
  },
  {
    number: 12,
    nameEnglish: 'Standstill',
    nameChinese: '否',
    namePinyin: 'Pǐ',
    lower: 'kun',
    upper: 'qian',
  },
  {
    number: 13,
    nameEnglish: 'Fellowship with People',
    nameChinese: '同人',
    namePinyin: 'Tóng Rén',
    lower: 'li',
    upper: 'qian',
  },
  {
    number: 14,
    nameEnglish: 'Great Possession',
    nameChinese: '大有',
    namePinyin: 'Dà Yǒu',
    lower: 'qian',
    upper: 'li',
  },
  {
    number: 15,
    nameEnglish: 'Modesty',
    nameChinese: '謙',
    namePinyin: 'Qiān',
    lower: 'gen',
    upper: 'kun',
  },
  {
    number: 16,
    nameEnglish: 'Enthusiasm',
    nameChinese: '豫',
    namePinyin: 'Yù',
    lower: 'kun',
    upper: 'zhen',
  },
  {
    number: 17,
    nameEnglish: 'Following',
    nameChinese: '隨',
    namePinyin: 'Suí',
    lower: 'zhen',
    upper: 'dui',
  },
  {
    number: 18,
    nameEnglish: 'Work on What Has Been Spoiled',
    nameChinese: '蠱',
    namePinyin: 'Gǔ',
    lower: 'xun',
    upper: 'gen',
  },
  {
    number: 19,
    nameEnglish: 'Approach',
    nameChinese: '臨',
    namePinyin: 'Lín',
    lower: 'dui',
    upper: 'kun',
  },
  {
    number: 20,
    nameEnglish: 'Contemplation',
    nameChinese: '觀',
    namePinyin: 'Guān',
    lower: 'kun',
    upper: 'xun',
  },
  {
    number: 21,
    nameEnglish: 'Biting Through',
    nameChinese: '噬嗑',
    namePinyin: 'Shì Kè',
    lower: 'zhen',
    upper: 'li',
  },
  {
    number: 22,
    nameEnglish: 'Grace',
    nameChinese: '賁',
    namePinyin: 'Bì',
    lower: 'li',
    upper: 'gen',
  },
  {
    number: 23,
    nameEnglish: 'Splitting Apart',
    nameChinese: '剝',
    namePinyin: 'Bō',
    lower: 'kun',
    upper: 'gen',
  },
  {
    number: 24,
    nameEnglish: 'Return',
    nameChinese: '復',
    namePinyin: 'Fù',
    lower: 'zhen',
    upper: 'kun',
  },
  {
    number: 25,
    nameEnglish: 'Innocence',
    nameChinese: '無妄',
    namePinyin: 'Wú Wàng',
    lower: 'zhen',
    upper: 'qian',
  },
  {
    number: 26,
    nameEnglish: 'The Taming Power of the Great',
    nameChinese: '大畜',
    namePinyin: 'Dà Chù',
    lower: 'qian',
    upper: 'gen',
  },
  {
    number: 27,
    nameEnglish: 'Nourishment',
    nameChinese: '頤',
    namePinyin: 'Yí',
    lower: 'zhen',
    upper: 'gen',
  },
  {
    number: 28,
    nameEnglish: 'Preponderance of the Great',
    nameChinese: '大過',
    namePinyin: 'Dà Guò',
    lower: 'xun',
    upper: 'dui',
  },
  {
    number: 29,
    nameEnglish: 'The Abysmal Water',
    nameChinese: '坎',
    namePinyin: 'Kǎn',
    lower: 'kan',
    upper: 'kan',
  },
  {
    number: 30,
    nameEnglish: 'The Clinging Fire',
    nameChinese: '離',
    namePinyin: 'Lí',
    lower: 'li',
    upper: 'li',
  },
  {
    number: 31,
    nameEnglish: 'Influence',
    nameChinese: '咸',
    namePinyin: 'Xián',
    lower: 'gen',
    upper: 'dui',
  },
  {
    number: 32,
    nameEnglish: 'Duration',
    nameChinese: '恆',
    namePinyin: 'Héng',
    lower: 'xun',
    upper: 'zhen',
  },
  {
    number: 33,
    nameEnglish: 'Retreat',
    nameChinese: '遯',
    namePinyin: 'Dùn',
    lower: 'gen',
    upper: 'qian',
  },
  {
    number: 34,
    nameEnglish: 'The Power of the Great',
    nameChinese: '大壯',
    namePinyin: 'Dà Zhuàng',
    lower: 'qian',
    upper: 'zhen',
  },
  {
    number: 35,
    nameEnglish: 'Progress',
    nameChinese: '晉',
    namePinyin: 'Jìn',
    lower: 'kun',
    upper: 'li',
  },
  {
    number: 36,
    nameEnglish: 'Darkening of the Light',
    nameChinese: '明夷',
    namePinyin: 'Míng Yí',
    lower: 'li',
    upper: 'kun',
  },
  {
    number: 37,
    nameEnglish: 'The Family',
    nameChinese: '家人',
    namePinyin: 'Jiā Rén',
    lower: 'li',
    upper: 'xun',
  },
  {
    number: 38,
    nameEnglish: 'Opposition',
    nameChinese: '睽',
    namePinyin: 'Kuí',
    lower: 'dui',
    upper: 'li',
  },
  {
    number: 39,
    nameEnglish: 'Obstruction',
    nameChinese: '蹇',
    namePinyin: 'Jiǎn',
    lower: 'gen',
    upper: 'kan',
  },
  {
    number: 40,
    nameEnglish: 'Deliverance',
    nameChinese: '解',
    namePinyin: 'Xiè',
    lower: 'kan',
    upper: 'zhen',
  },
  {
    number: 41,
    nameEnglish: 'Decrease',
    nameChinese: '損',
    namePinyin: 'Sǔn',
    lower: 'dui',
    upper: 'gen',
  },
  {
    number: 42,
    nameEnglish: 'Increase',
    nameChinese: '益',
    namePinyin: 'Yì',
    lower: 'zhen',
    upper: 'xun',
  },
  {
    number: 43,
    nameEnglish: 'Breakthrough',
    nameChinese: '夬',
    namePinyin: 'Guài',
    lower: 'qian',
    upper: 'dui',
  },
  {
    number: 44,
    nameEnglish: 'Coming to Meet',
    nameChinese: '姤',
    namePinyin: 'Gòu',
    lower: 'xun',
    upper: 'qian',
  },
  {
    number: 45,
    nameEnglish: 'Gathering Together',
    nameChinese: '萃',
    namePinyin: 'Cuì',
    lower: 'kun',
    upper: 'dui',
  },
  {
    number: 46,
    nameEnglish: 'Pushing Upward',
    nameChinese: '升',
    namePinyin: 'Shēng',
    lower: 'xun',
    upper: 'kun',
  },
  {
    number: 47,
    nameEnglish: 'Oppression',
    nameChinese: '困',
    namePinyin: 'Kùn',
    lower: 'kan',
    upper: 'dui',
  },
  {
    number: 48,
    nameEnglish: 'The Well',
    nameChinese: '井',
    namePinyin: 'Jǐng',
    lower: 'xun',
    upper: 'kan',
  },
  {
    number: 49,
    nameEnglish: 'Revolution',
    nameChinese: '革',
    namePinyin: 'Gé',
    lower: 'li',
    upper: 'dui',
  },
  {
    number: 50,
    nameEnglish: 'The Cauldron',
    nameChinese: '鼎',
    namePinyin: 'Dǐng',
    lower: 'xun',
    upper: 'li',
  },
  {
    number: 51,
    nameEnglish: 'The Arousing Thunder',
    nameChinese: '震',
    namePinyin: 'Zhèn',
    lower: 'zhen',
    upper: 'zhen',
  },
  {
    number: 52,
    nameEnglish: 'Keeping Still Mountain',
    nameChinese: '艮',
    namePinyin: 'Gèn',
    lower: 'gen',
    upper: 'gen',
  },
  {
    number: 53,
    nameEnglish: 'Development',
    nameChinese: '漸',
    namePinyin: 'Jiàn',
    lower: 'gen',
    upper: 'xun',
  },
  {
    number: 54,
    nameEnglish: 'The Marrying Maiden',
    nameChinese: '歸妹',
    namePinyin: 'Guī Mèi',
    lower: 'dui',
    upper: 'zhen',
  },
  {
    number: 55,
    nameEnglish: 'Abundance',
    nameChinese: '豐',
    namePinyin: 'Fēng',
    lower: 'li',
    upper: 'zhen',
  },
  {
    number: 56,
    nameEnglish: 'The Wanderer',
    nameChinese: '旅',
    namePinyin: 'Lǚ',
    lower: 'gen',
    upper: 'li',
  },
  {
    number: 57,
    nameEnglish: 'The Gentle Wind',
    nameChinese: '巽',
    namePinyin: 'Xùn',
    lower: 'xun',
    upper: 'xun',
  },
  {
    number: 58,
    nameEnglish: 'The Joyous Lake',
    nameChinese: '兌',
    namePinyin: 'Duì',
    lower: 'dui',
    upper: 'dui',
  },
  {
    number: 59,
    nameEnglish: 'Dispersion',
    nameChinese: '渙',
    namePinyin: 'Huàn',
    lower: 'kan',
    upper: 'xun',
  },
  {
    number: 60,
    nameEnglish: 'Limitation',
    nameChinese: '節',
    namePinyin: 'Jié',
    lower: 'dui',
    upper: 'kan',
  },
  {
    number: 61,
    nameEnglish: 'Inner Truth',
    nameChinese: '中孚',
    namePinyin: 'Zhōng Fú',
    lower: 'dui',
    upper: 'xun',
  },
  {
    number: 62,
    nameEnglish: 'Preponderance of the Small',
    nameChinese: '小過',
    namePinyin: 'Xiǎo Guò',
    lower: 'gen',
    upper: 'zhen',
  },
  {
    number: 63,
    nameEnglish: 'After Completion',
    nameChinese: '既濟',
    namePinyin: 'Jì Jì',
    lower: 'li',
    upper: 'kan',
  },
  {
    number: 64,
    nameEnglish: 'Before Completion',
    nameChinese: '未濟',
    namePinyin: 'Wèi Jì',
    lower: 'kan',
    upper: 'li',
  },
]

const toHexagram = (definition: HexagramDefinition): HexagramReference => {
  const lowerTrigram = getTrigram(definition.lower)
  const upperTrigram = getTrigram(definition.upper)
  return {
    number: definition.number,
    nameEnglish: definition.nameEnglish,
    nameChinese: definition.nameChinese,
    namePinyin: definition.namePinyin,
    lowerTrigram,
    upperTrigram,
    linesBottomToTop: [
      lowerTrigram.linesBottomToTop[0],
      lowerTrigram.linesBottomToTop[1],
      lowerTrigram.linesBottomToTop[2],
      upperTrigram.linesBottomToTop[0],
      upperTrigram.linesBottomToTop[1],
      upperTrigram.linesBottomToTop[2],
    ],
    geneKey: getGeneKeySpectrum(definition.number),
    status: 'curated',
    sourceLabel: HEXAGRAM_SOURCE_LABEL,
  }
}

const hexagrams: readonly HexagramReference[] = DEFINITIONS.map(toHexagram)
const byNumber = new Map(hexagrams.map((hexagram) => [hexagram.number, hexagram]))
const byLines = new Map(
  hexagrams.map((hexagram) => [hexagram.linesBottomToTop.join(','), hexagram]),
)

const binaryValue = (lines: HexagramLines): number =>
  lines.reduce(
    (value, line: LinePolarity, index) =>
      line === 'yang' ? value + 2 ** index : value,
    0,
  )

const trigramIndex = (key: TrigramKey): number => EARLY_HEAVEN_TRIGRAM_ORDER.indexOf(key)

export const getHexagram = (number: number): HexagramReference => {
  const hexagram = byNumber.get(number)
  if (!hexagram) {
    throw new Error(`Unknown King Wen hexagram number: ${number}`)
  }
  return hexagram
}

export const getHexagramByLines = (lines: HexagramLines): HexagramReference => {
  const hexagram = byLines.get(lines.join(','))
  if (!hexagram) {
    throw new Error('No King Wen hexagram matches the supplied line pattern.')
  }
  return hexagram
}

export const getHexagrams = (order: HexagramOrder = 'king-wen'): readonly HexagramReference[] => {
  const ordered = [...hexagrams]
  switch (order) {
    case 'king-wen':
      return ordered
    case 'fu-xi':
      return ordered.sort(
        (left, right) =>
          binaryValue(left.linesBottomToTop) - binaryValue(right.linesBottomToTop),
      )
    case 'trigram-matrix':
      return ordered.sort(
        (left, right) =>
          trigramIndex(left.upperTrigram.key) * 8 +
          trigramIndex(left.lowerTrigram.key) -
          (trigramIndex(right.upperTrigram.key) * 8 +
            trigramIndex(right.lowerTrigram.key)),
      )
  }
}

export const KING_WEN_HEXAGRAM_COUNT = hexagrams.length
