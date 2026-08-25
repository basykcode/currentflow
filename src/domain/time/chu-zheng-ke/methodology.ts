import type { MacroHour, MicroHour } from './types'

export const CHU_ZHENG_KE_METHODOLOGY_ID = 'temporal-hour-phase:chu-zheng-ke-96-v1' as const
export const CHU_ZHENG_KE_METHODOLOGY_VERSION = '1.0.0'
export const MACRO_HOUR_MATURITY_METHODOLOGY_ID = 'current-hour-maturity:chu-zheng-v1'
export const MACRO_HOUR_MATURITY_METHODOLOGY_VERSION = '1.0.0'

export const MACRO_PRESENTATION = Object.freeze({
  chu: Object.freeze({ chinese: '初' as const, pinyin: 'Chū', english: 'Entering' }),
  zheng: Object.freeze({ chinese: '正' as const, pinyin: 'Zhèng', english: 'Established' }),
})

export const MICRO_PRESENTATION: Readonly<
  Record<
    MicroHour,
    Readonly<{
      chinese: '初刻' | '一刻' | '二刻' | '三刻'
      pinyin: 'Chū Kè' | 'Yī Kè' | 'Èr Kè' | 'Sān Kè'
      english: string
    }>
  >
> = Object.freeze({
  0: Object.freeze({
    chinese: '初刻',
    pinyin: 'Chū Kè',
    english: 'First Kè of current Macro Hour',
  }),
  1: Object.freeze({ chinese: '一刻', pinyin: 'Yī Kè', english: 'Second Kè' }),
  2: Object.freeze({ chinese: '二刻', pinyin: 'Èr Kè', english: 'Third Kè' }),
  3: Object.freeze({ chinese: '三刻', pinyin: 'Sān Kè', english: 'Fourth Kè' }),
})

export const macroLabel = (macroHour: MacroHour) => MACRO_PRESENTATION[macroHour]
