import type { ChuZhengKeMoment, OrganMoment } from './types'

type OrganPeriodDefinition = Omit<OrganMoment, 'status' | 'sourceLabel'>

const ORGAN_PERIODS: readonly OrganPeriodDefinition[] = [
  {
    key: 'gallbladder',
    nameEnglish: 'Gallbladder period',
    nameChinese: '膽',
    timeRangeLabel: '23:00–01:00',
  },
  {
    key: 'liver',
    nameEnglish: 'Liver period',
    nameChinese: '肝',
    timeRangeLabel: '01:00–03:00',
  },
  {
    key: 'lung',
    nameEnglish: 'Lung period',
    nameChinese: '肺',
    timeRangeLabel: '03:00–05:00',
  },
  {
    key: 'large-intestine',
    nameEnglish: 'Large Intestine period',
    nameChinese: '大腸',
    timeRangeLabel: '05:00–07:00',
  },
  {
    key: 'stomach',
    nameEnglish: 'Stomach period',
    nameChinese: '胃',
    timeRangeLabel: '07:00–09:00',
  },
  {
    key: 'spleen',
    nameEnglish: 'Spleen period',
    nameChinese: '脾',
    timeRangeLabel: '09:00–11:00',
  },
  {
    key: 'heart',
    nameEnglish: 'Heart period',
    nameChinese: '心',
    timeRangeLabel: '11:00–13:00',
  },
  {
    key: 'small-intestine',
    nameEnglish: 'Small Intestine period',
    nameChinese: '小腸',
    timeRangeLabel: '13:00–15:00',
  },
  {
    key: 'bladder',
    nameEnglish: 'Bladder period',
    nameChinese: '膀胱',
    timeRangeLabel: '15:00–17:00',
  },
  {
    key: 'kidney',
    nameEnglish: 'Kidney period',
    nameChinese: '腎',
    timeRangeLabel: '17:00–19:00',
  },
  {
    key: 'pericardium',
    nameEnglish: 'Pericardium period',
    nameChinese: '心包',
    timeRangeLabel: '19:00–21:00',
  },
  {
    key: 'san-jiao',
    nameEnglish: 'San Jiao period',
    nameChinese: '三焦',
    timeRangeLabel: '21:00–23:00',
  },
]

const KE_NAMES = [
  { character: '初', pinyin: 'Chū', english: 'opening quarter' },
  { character: '一', pinyin: 'Yī', english: 'first quarter' },
  { character: '二', pinyin: 'Èr', english: 'second quarter' },
  { character: '三', pinyin: 'Sān', english: 'third quarter' },
] as const

const CULTIVATION_PHASES = [
  {
    phase: 'Arriving',
    guidance: 'Energy begins to gather. Arrive, breathe, and notice what is present.',
  },
  {
    phase: 'Gathering',
    guidance: 'Energy is building. Choose the thread worth strengthening.',
  },
  {
    phase: 'Deepening',
    guidance: 'Energy is still building. Settle into one useful act without forcing.',
  },
  {
    phase: 'Cresting',
    guidance: 'Energy approaches its first crest. Complete the essential movement.',
  },
  {
    phase: 'Fullness',
    guidance: 'Energy enters full expression. Hold steady and notice what is sufficient.',
  },
  {
    phase: 'Circulating',
    guidance: 'Energy is available. Circulate it through deliberate, unhurried action.',
  },
  {
    phase: 'Integrating',
    guidance: 'Energy begins to turn inward. Consolidate what this period has opened.',
  },
  {
    phase: 'Releasing',
    guidance: 'Energy prepares to hand off. Release excess and leave a clean transition.',
  },
] as const

const formatCivilTime = (hour: number, minute: number) =>
  `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

export const getChuZhengKeMoment = (civilHour: number, civilMinute: number): ChuZhengKeMoment => {
  if (!Number.isInteger(civilHour) || civilHour < 0 || civilHour > 23) {
    throw new Error(`Civil hour must be an integer from 0 through 23; received ${civilHour}.`)
  }
  if (!Number.isInteger(civilMinute) || civilMinute < 0 || civilMinute > 59) {
    throw new Error(`Civil minute must be an integer from 0 through 59; received ${civilMinute}.`)
  }

  const segment = civilHour % 2 === 1 ? 'chu' : 'zheng'
  const keIndex = Math.floor(civilMinute / 15) as ChuZhengKeMoment['keIndex']
  const ke = KE_NAMES[keIndex]
  const cultivationIndex = keIndex + (segment === 'zheng' ? 4 : 0)
  const cultivation = CULTIVATION_PHASES[cultivationIndex]
  if (!ke || !cultivation) throw new Error('No Chu-Zheng-Ke definition exists for this civil time.')

  const segmentIdentity =
    segment === 'chu'
      ? { character: '初', pinyin: 'Chū', english: 'Initial half' }
      : { character: '正', pinyin: 'Zhèng', english: 'Second half' }
  const startMinute = keIndex * 15
  const endMinute = startMinute + 15
  const endHour = endMinute === 60 ? (civilHour + 1) % 24 : civilHour

  return {
    segment,
    keIndex,
    nameChinese: `${segmentIdentity.character}${ke.character}刻`,
    namePinyin: `${segmentIdentity.pinyin} ${ke.pinyin} Kè`,
    meaningEnglish: `${segmentIdentity.english} · ${ke.english}`,
    timeRangeLabel: `${formatCivilTime(civilHour, startMinute)}–${formatCivilTime(endHour, endMinute % 60)}`,
    cultivationPhase: cultivation.phase,
    cultivationGuidance: cultivation.guidance,
    status: 'computed',
    sourceLabel: 'Shixian 96-ke convention · civil time',
    cultivationStatus: 'current-formalization',
    cultivationSourceLabel: 'Current Flow cultivation phase model v1 · product formalization',
  }
}

export const getOrganMoment = (civilHour: number, civilMinute = 0): OrganMoment => {
  if (!Number.isInteger(civilHour) || civilHour < 0 || civilHour > 23) {
    throw new Error(`Civil hour must be an integer from 0 through 23; received ${civilHour}.`)
  }

  // 23:00 and 00:00 share the first period. Shifting by one hour maps
  // the 24 civil hours into 12 contiguous two-hour indexes.
  const periodIndex = Math.floor(((civilHour + 1) % 24) / 2)
  const period = ORGAN_PERIODS[periodIndex]
  if (!period) {
    throw new Error(`No organ period exists for civil hour ${civilHour}.`)
  }

  return {
    ...period,
    chuZhengKe: getChuZhengKeMoment(civilHour, civilMinute),
    status: 'computed',
    sourceLabel: 'Traditional two-hour meridian clock · civil time',
  }
}
