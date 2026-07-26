import type { Trigram, TrigramKey } from './types'

const TRIGRAMS: Readonly<Record<TrigramKey, Trigram>> = {
  qian: {
    key: 'qian',
    nameEnglish: 'Heaven',
    nameChinese: '乾',
    namePinyin: 'Qián',
    imageEnglish: 'Heaven',
    linesBottomToTop: ['yang', 'yang', 'yang'],
  },
  dui: {
    key: 'dui',
    nameEnglish: 'Lake',
    nameChinese: '兌',
    namePinyin: 'Duì',
    imageEnglish: 'Lake',
    linesBottomToTop: ['yang', 'yang', 'yin'],
  },
  li: {
    key: 'li',
    nameEnglish: 'Fire',
    nameChinese: '離',
    namePinyin: 'Lí',
    imageEnglish: 'Fire',
    linesBottomToTop: ['yang', 'yin', 'yang'],
  },
  zhen: {
    key: 'zhen',
    nameEnglish: 'Thunder',
    nameChinese: '震',
    namePinyin: 'Zhèn',
    imageEnglish: 'Thunder',
    linesBottomToTop: ['yang', 'yin', 'yin'],
  },
  xun: {
    key: 'xun',
    nameEnglish: 'Wind',
    nameChinese: '巽',
    namePinyin: 'Xùn',
    imageEnglish: 'Wind',
    linesBottomToTop: ['yin', 'yang', 'yang'],
  },
  kan: {
    key: 'kan',
    nameEnglish: 'Water',
    nameChinese: '坎',
    namePinyin: 'Kǎn',
    imageEnglish: 'Water',
    linesBottomToTop: ['yin', 'yang', 'yin'],
  },
  gen: {
    key: 'gen',
    nameEnglish: 'Mountain',
    nameChinese: '艮',
    namePinyin: 'Gèn',
    imageEnglish: 'Mountain',
    linesBottomToTop: ['yin', 'yin', 'yang'],
  },
  kun: {
    key: 'kun',
    nameEnglish: 'Earth',
    nameChinese: '坤',
    namePinyin: 'Kūn',
    imageEnglish: 'Earth',
    linesBottomToTop: ['yin', 'yin', 'yin'],
  },
}

export const getTrigram = (key: TrigramKey): Trigram => TRIGRAMS[key]

export const EARLY_HEAVEN_TRIGRAM_ORDER: readonly TrigramKey[] = [
  'kun',
  'gen',
  'kan',
  'xun',
  'zhen',
  'li',
  'dui',
  'qian',
]
