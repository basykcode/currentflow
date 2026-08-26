import { getShichenIndex } from './shichen'
import type { OrganMoment } from './types'

export type OrganClockMoment = Omit<
  OrganMoment,
  'shichen' | 'nextShichen' | 'hourPhase' | 'status' | 'sourceLabel'
> &
  Readonly<{
    status: 'computed'
    sourceLabel: string
  }>

type OrganPeriodDefinition = Omit<OrganClockMoment, 'status' | 'sourceLabel'>

const ORGAN_PERIODS: readonly OrganPeriodDefinition[] = [
  {
    key: 'gallbladder',
    nameEnglish: 'Gallbladder period',
    nameChinese: '膽',
    element: 'wood',
    timeRangeLabel: '23:00–01:00',
  },
  {
    key: 'liver',
    nameEnglish: 'Liver period',
    nameChinese: '肝',
    element: 'wood',
    timeRangeLabel: '01:00–03:00',
  },
  {
    key: 'lung',
    nameEnglish: 'Lung period',
    nameChinese: '肺',
    element: 'metal',
    timeRangeLabel: '03:00–05:00',
  },
  {
    key: 'large-intestine',
    nameEnglish: 'Large Intestine period',
    nameChinese: '大腸',
    element: 'metal',
    timeRangeLabel: '05:00–07:00',
  },
  {
    key: 'stomach',
    nameEnglish: 'Stomach period',
    nameChinese: '胃',
    element: 'earth',
    timeRangeLabel: '07:00–09:00',
  },
  {
    key: 'spleen',
    nameEnglish: 'Spleen period',
    nameChinese: '脾',
    element: 'earth',
    timeRangeLabel: '09:00–11:00',
  },
  {
    key: 'heart',
    nameEnglish: 'Heart period',
    nameChinese: '心',
    element: 'fire',
    timeRangeLabel: '11:00–13:00',
  },
  {
    key: 'small-intestine',
    nameEnglish: 'Small Intestine period',
    nameChinese: '小腸',
    element: 'fire',
    timeRangeLabel: '13:00–15:00',
  },
  {
    key: 'bladder',
    nameEnglish: 'Bladder period',
    nameChinese: '膀胱',
    element: 'water',
    timeRangeLabel: '15:00–17:00',
  },
  {
    key: 'kidney',
    nameEnglish: 'Kidney period',
    nameChinese: '腎',
    element: 'water',
    timeRangeLabel: '17:00–19:00',
  },
  {
    key: 'pericardium',
    nameEnglish: 'Pericardium period',
    nameChinese: '心包',
    element: 'fire',
    timeRangeLabel: '19:00–21:00',
  },
  {
    key: 'san-jiao',
    nameEnglish: 'San Jiao period',
    nameChinese: '三焦',
    element: 'fire',
    timeRangeLabel: '21:00–23:00',
  },
]

export const getOrganMoment = (civilHour: number): OrganClockMoment => {
  if (!Number.isInteger(civilHour) || civilHour < 0 || civilHour > 23) {
    throw new Error(`Civil hour must be an integer from 0 through 23; received ${civilHour}.`)
  }

  // 23:00 and 00:00 share the first period. Shifting by one hour maps
  // the 24 civil hours into 12 contiguous two-hour indexes.
  const periodIndex = getShichenIndex(civilHour)
  const period = ORGAN_PERIODS[periodIndex]
  if (!period) {
    throw new Error(`No organ period exists for civil hour ${civilHour}.`)
  }

  return {
    ...period,
    status: 'computed',
    sourceLabel: 'Traditional two-hour meridian clock · civil time',
  }
}
