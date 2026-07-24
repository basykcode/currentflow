import type { Hexagram, HexagramLines } from './types'

type TrigramName = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun'

type HexagramDefinition = {
  number: number
  nameEnglish: string
  nameChinese: string
  lower: TrigramName
  upper: TrigramName
}

const TRIGRAM_LINES: Record<
  TrigramName,
  readonly [HexagramLines[0], HexagramLines[1], HexagramLines[2]]
> = {
  qian: ['yang', 'yang', 'yang'],
  dui: ['yang', 'yang', 'yin'],
  li: ['yang', 'yin', 'yang'],
  zhen: ['yang', 'yin', 'yin'],
  xun: ['yin', 'yang', 'yang'],
  kan: ['yin', 'yang', 'yin'],
  gen: ['yin', 'yin', 'yang'],
  kun: ['yin', 'yin', 'yin'],
}

const DEFINITIONS: readonly HexagramDefinition[] = [
  { number: 1, nameEnglish: 'The Creative', nameChinese: '乾', lower: 'qian', upper: 'qian' },
  { number: 2, nameEnglish: 'The Receptive', nameChinese: '坤', lower: 'kun', upper: 'kun' },
  {
    number: 3,
    nameEnglish: 'Difficulty at the Beginning',
    nameChinese: '屯',
    lower: 'zhen',
    upper: 'kan',
  },
  { number: 4, nameEnglish: 'Youthful Folly', nameChinese: '蒙', lower: 'kan', upper: 'gen' },
  { number: 5, nameEnglish: 'Waiting', nameChinese: '需', lower: 'qian', upper: 'kan' },
  { number: 6, nameEnglish: 'Conflict', nameChinese: '訟', lower: 'kan', upper: 'qian' },
  { number: 7, nameEnglish: 'The Army', nameChinese: '師', lower: 'kan', upper: 'kun' },
  { number: 8, nameEnglish: 'Holding Together', nameChinese: '比', lower: 'kun', upper: 'kan' },
  {
    number: 9,
    nameEnglish: 'The Taming Power of the Small',
    nameChinese: '小畜',
    lower: 'qian',
    upper: 'xun',
  },
  { number: 10, nameEnglish: 'Treading', nameChinese: '履', lower: 'dui', upper: 'qian' },
  { number: 11, nameEnglish: 'Peace', nameChinese: '泰', lower: 'qian', upper: 'kun' },
  { number: 12, nameEnglish: 'Standstill', nameChinese: '否', lower: 'kun', upper: 'qian' },
  {
    number: 13,
    nameEnglish: 'Fellowship with People',
    nameChinese: '同人',
    lower: 'li',
    upper: 'qian',
  },
  { number: 14, nameEnglish: 'Great Possession', nameChinese: '大有', lower: 'qian', upper: 'li' },
  { number: 15, nameEnglish: 'Modesty', nameChinese: '謙', lower: 'gen', upper: 'kun' },
  { number: 16, nameEnglish: 'Enthusiasm', nameChinese: '豫', lower: 'kun', upper: 'zhen' },
  { number: 17, nameEnglish: 'Following', nameChinese: '隨', lower: 'zhen', upper: 'dui' },
  {
    number: 18,
    nameEnglish: 'Work on What Has Been Spoiled',
    nameChinese: '蠱',
    lower: 'xun',
    upper: 'gen',
  },
  { number: 19, nameEnglish: 'Approach', nameChinese: '臨', lower: 'dui', upper: 'kun' },
  { number: 20, nameEnglish: 'Contemplation', nameChinese: '觀', lower: 'kun', upper: 'xun' },
  { number: 21, nameEnglish: 'Biting Through', nameChinese: '噬嗑', lower: 'zhen', upper: 'li' },
  { number: 22, nameEnglish: 'Grace', nameChinese: '賁', lower: 'li', upper: 'gen' },
  { number: 23, nameEnglish: 'Splitting Apart', nameChinese: '剝', lower: 'kun', upper: 'gen' },
  { number: 24, nameEnglish: 'Return', nameChinese: '復', lower: 'zhen', upper: 'kun' },
  { number: 25, nameEnglish: 'Innocence', nameChinese: '無妄', lower: 'zhen', upper: 'qian' },
  {
    number: 26,
    nameEnglish: 'The Taming Power of the Great',
    nameChinese: '大畜',
    lower: 'qian',
    upper: 'gen',
  },
  { number: 27, nameEnglish: 'Nourishment', nameChinese: '頤', lower: 'zhen', upper: 'gen' },
  { number: 28, nameEnglish: 'Great Exceeding', nameChinese: '大過', lower: 'xun', upper: 'dui' },
  { number: 29, nameEnglish: 'The Abysmal Water', nameChinese: '坎', lower: 'kan', upper: 'kan' },
  { number: 30, nameEnglish: 'The Clinging Fire', nameChinese: '離', lower: 'li', upper: 'li' },
  { number: 31, nameEnglish: 'Influence', nameChinese: '咸', lower: 'gen', upper: 'dui' },
  { number: 32, nameEnglish: 'Duration', nameChinese: '恆', lower: 'xun', upper: 'zhen' },
  { number: 33, nameEnglish: 'Retreat', nameChinese: '遯', lower: 'gen', upper: 'qian' },
  {
    number: 34,
    nameEnglish: 'The Power of the Great',
    nameChinese: '大壯',
    lower: 'qian',
    upper: 'zhen',
  },
  { number: 35, nameEnglish: 'Progress', nameChinese: '晉', lower: 'kun', upper: 'li' },
  {
    number: 36,
    nameEnglish: 'Darkening of the Light',
    nameChinese: '明夷',
    lower: 'li',
    upper: 'kun',
  },
  { number: 37, nameEnglish: 'The Family', nameChinese: '家人', lower: 'li', upper: 'xun' },
  { number: 38, nameEnglish: 'Opposition', nameChinese: '睽', lower: 'dui', upper: 'li' },
  { number: 39, nameEnglish: 'Obstruction', nameChinese: '蹇', lower: 'gen', upper: 'kan' },
  { number: 40, nameEnglish: 'Deliverance', nameChinese: '解', lower: 'kan', upper: 'zhen' },
  { number: 41, nameEnglish: 'Decrease', nameChinese: '損', lower: 'dui', upper: 'gen' },
  { number: 42, nameEnglish: 'Increase', nameChinese: '益', lower: 'zhen', upper: 'xun' },
  { number: 43, nameEnglish: 'Breakthrough', nameChinese: '夬', lower: 'qian', upper: 'dui' },
  { number: 44, nameEnglish: 'Coming to Meet', nameChinese: '姤', lower: 'xun', upper: 'qian' },
  { number: 45, nameEnglish: 'Gathering Together', nameChinese: '萃', lower: 'kun', upper: 'dui' },
  { number: 46, nameEnglish: 'Pushing Upward', nameChinese: '升', lower: 'xun', upper: 'kun' },
  { number: 47, nameEnglish: 'Oppression', nameChinese: '困', lower: 'kan', upper: 'dui' },
  { number: 48, nameEnglish: 'The Well', nameChinese: '井', lower: 'xun', upper: 'kan' },
  { number: 49, nameEnglish: 'Revolution', nameChinese: '革', lower: 'li', upper: 'dui' },
  { number: 50, nameEnglish: 'The Cauldron', nameChinese: '鼎', lower: 'xun', upper: 'li' },
  {
    number: 51,
    nameEnglish: 'The Arousing Thunder',
    nameChinese: '震',
    lower: 'zhen',
    upper: 'zhen',
  },
  {
    number: 52,
    nameEnglish: 'Keeping Still Mountain',
    nameChinese: '艮',
    lower: 'gen',
    upper: 'gen',
  },
  { number: 53, nameEnglish: 'Development', nameChinese: '漸', lower: 'gen', upper: 'xun' },
  {
    number: 54,
    nameEnglish: 'The Marrying Maiden',
    nameChinese: '歸妹',
    lower: 'dui',
    upper: 'zhen',
  },
  { number: 55, nameEnglish: 'Abundance', nameChinese: '豐', lower: 'li', upper: 'zhen' },
  { number: 56, nameEnglish: 'The Wanderer', nameChinese: '旅', lower: 'gen', upper: 'li' },
  { number: 57, nameEnglish: 'The Gentle Wind', nameChinese: '巽', lower: 'xun', upper: 'xun' },
  { number: 58, nameEnglish: 'The Joyous Lake', nameChinese: '兌', lower: 'dui', upper: 'dui' },
  { number: 59, nameEnglish: 'Dispersion', nameChinese: '渙', lower: 'kan', upper: 'xun' },
  { number: 60, nameEnglish: 'Limitation', nameChinese: '節', lower: 'dui', upper: 'kan' },
  { number: 61, nameEnglish: 'Inner Truth', nameChinese: '中孚', lower: 'dui', upper: 'xun' },
  {
    number: 62,
    nameEnglish: 'Preponderance of the Small',
    nameChinese: '小過',
    lower: 'gen',
    upper: 'zhen',
  },
  { number: 63, nameEnglish: 'After Completion', nameChinese: '既濟', lower: 'li', upper: 'kan' },
  { number: 64, nameEnglish: 'Before Completion', nameChinese: '未濟', lower: 'kan', upper: 'li' },
]

const toHexagram = (definition: HexagramDefinition): Hexagram => {
  const lower = TRIGRAM_LINES[definition.lower]
  const upper = TRIGRAM_LINES[definition.upper]
  return {
    number: definition.number,
    nameEnglish: definition.nameEnglish,
    nameChinese: definition.nameChinese,
    linesBottomToTop: [lower[0], lower[1], lower[2], upper[0], upper[1], upper[2]],
  }
}

const hexagrams = DEFINITIONS.map(toHexagram)
const byNumber = new Map(hexagrams.map((hexagram) => [hexagram.number, hexagram]))
const byLines = new Map(
  hexagrams.map((hexagram) => [hexagram.linesBottomToTop.join(','), hexagram]),
)

export const getHexagram = (number: number): Hexagram => {
  const hexagram = byNumber.get(number)
  if (!hexagram) {
    throw new Error(`Unknown King Wen hexagram number: ${number}`)
  }
  return hexagram
}

export const getHexagramByLines = (lines: HexagramLines): Hexagram => {
  const hexagram = byLines.get(lines.join(','))
  if (!hexagram) {
    throw new Error('No King Wen hexagram matches the supplied line pattern.')
  }
  return hexagram
}

export const KING_WEN_HEXAGRAM_COUNT = hexagrams.length
