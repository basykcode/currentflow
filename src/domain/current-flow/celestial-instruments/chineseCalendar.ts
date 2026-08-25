import { LunarYear, Solar } from 'lunar-javascript'

import { getZonedCivilTime, zonedWallTimeToUtc } from '@/domain/astrology/civilTime'
import { parseAbsoluteUtcInstant } from '@/domain/astronomy/normalization'

import { CELESTIAL_INSTRUMENT_METHODOLOGY } from './methodology'
import type { CantongQiNodeId, ChineseLunarCalendarSnapshot, EarthlyBranchCharacter } from './types'

export const CHINESE_CALENDAR_REFERENCE_TIME_ZONE = 'Asia/Shanghai' as const

export class ChineseCalendarConversionError extends Error {
  readonly code = 'chinese-calendar-conversion-failure' as const

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ChineseCalendarConversionError'
  }
}

const isEarthlyBranch = (value: string): value is EarthlyBranchCharacter =>
  '子丑寅卯辰巳午未申酉戌亥'.includes(value)

const shanghaiMidnightAfterDays = (
  civil: Readonly<{ year: number; month: number; day: number }>,
  offsetDays: number,
) => {
  const shifted = new Date(Date.UTC(civil.year, civil.month - 1, civil.day + offsetDays))
  return zonedWallTimeToUtc(
    {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    CHINESE_CALENDAR_REFERENCE_TIME_ZONE,
  )
}

export const resolveCantongQiNodeId = (lunarDay: number): CantongQiNodeId => {
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
    throw new ChineseCalendarConversionError(`Unsupported traditional lunar day ${lunarDay}.`)
  }
  if (lunarDay <= 5) return 'zhen-emergence'
  if (lunarDay <= 10) return 'dui-accumulation'
  if (lunarDay <= 15) return 'qian-culmination'
  if (lunarDay <= 20) return 'xun-distribution'
  if (lunarDay <= 25) return 'gen-consolidation'
  return 'kun-concealment'
}

export const calculateChineseLunarCalendar = (instantUtc: string): ChineseLunarCalendarSnapshot => {
  const { date } = parseAbsoluteUtcInstant(instantUtc)
  try {
    const civil = getZonedCivilTime(date, CHINESE_CALENDAR_REFERENCE_TIME_ZONE)
    const lunar = Solar.fromYmdHms(
      civil.year,
      civil.month,
      civil.day,
      civil.hour,
      civil.minute,
      civil.second,
    ).getLunar()
    const lunarYear = lunar.getYear()
    const signedMonth = lunar.getMonth()
    const lunarMonth = Math.abs(signedMonth)
    const lunarDay = lunar.getDay()
    const month = LunarYear.fromYear(lunarYear).getMonth(signedMonth)
    const monthLength = month?.getDayCount()
    if (monthLength !== 29 && monthLength !== 30) {
      throw new Error('lunar-javascript returned an unsupported lunar month length.')
    }
    const monthPillarBranch = lunar.getMonthInGanZhiExact().slice(-1)
    if (!isEarthlyBranch(monthPillarBranch)) {
      throw new Error('lunar-javascript returned an unsupported Month Pillar Branch.')
    }
    const cantongQiStartDay = Math.floor((lunarDay - 1) / 5) * 5 + 1
    const cantongQiEndDay = Math.min(cantongQiStartDay + 4, monthLength)

    return Object.freeze({
      referenceTimeZone: CHINESE_CALENDAR_REFERENCE_TIME_ZONE,
      lunarYear,
      lunarMonth,
      lunarDay,
      isLeapMonth: signedMonth < 0,
      monthLength,
      monthPillarBranch,
      cantongQiPeriodBounds: Object.freeze({
        startUtc: shanghaiMidnightAfterDays(civil, cantongQiStartDay - lunarDay),
        endExclusiveUtc: shanghaiMidnightAfterDays(civil, cantongQiEndDay - lunarDay + 1),
        basisTimeZone: CHINESE_CALENDAR_REFERENCE_TIME_ZONE,
      }),
      methodologyId: CELESTIAL_INSTRUMENT_METHODOLOGY.chineseLunarDate,
    })
  } catch (error) {
    if (error instanceof ChineseCalendarConversionError) throw error
    throw new ChineseCalendarConversionError(
      'The traditional Chinese lunar date could not be calculated on the Asia/Shanghai basis.',
      error,
    )
  }
}
