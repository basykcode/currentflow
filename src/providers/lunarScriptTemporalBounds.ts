import { Solar, type LunarDate, type SolarDate } from 'lunar-javascript'

import type { ZonedCivilTime } from '@/domain/astrology/civilTime'
import type { TemporalScope } from '@/domain/astrology/types'

type WallTime = Pick<ZonedCivilTime, 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'>

const pad = (value: number) => value.toString().padStart(2, '0')

const formatWallTime = (value: WallTime) =>
  `${value.year.toString().padStart(4, '0')}-${pad(value.month)}-${pad(value.day)} ${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`

const shiftWallTime = (value: WallTime, hours: number): WallTime => {
  const shifted = new Date(
    Date.UTC(value.year, value.month - 1, value.day, value.hour + hours, value.minute, value.second),
  )

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  }
}

const formatBounds = (start: string, end: string, timezone: string) =>
  `${start} → ${end} · ${timezone}`

const liChunForYear = (year: number): SolarDate => {
  const table = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getJieQiTable()
  const boundary = table['立春']

  if (!boundary || !boundary.toYmdHms().startsWith(`${year.toString().padStart(4, '0')}-`)) {
    throw new Error(`lunar-javascript did not return the Li Chun boundary for ${year}.`)
  }

  return boundary
}

const getYearBounds = (civil: ZonedCivilTime) => {
  const current = formatWallTime(civil)
  const candidates = [civil.year - 1, civil.year, civil.year + 1]
    .map((year) => liChunForYear(year).toYmdHms())
    .sort()
  const start = [...candidates].reverse().find((candidate) => candidate <= current)
  const end = candidates.find((candidate) => candidate > current)

  if (!start || !end) {
    throw new Error(`Unable to bracket ${current} with exact Li Chun boundaries.`)
  }

  return formatBounds(start, end, civil.timezone)
}

const getMonthBounds = (lunar: LunarDate, civil: ZonedCivilTime) => {
  const previous = lunar.getPrevJie()
  const next = lunar.getNextJie()

  if (!previous || !next) {
    throw new Error('Unable to bracket the current pillar with exact solar-term boundaries.')
  }

  return formatBounds(
    previous.getSolar().toYmdHms(),
    next.getSolar().toYmdHms(),
    civil.timezone,
  )
}

const getDayBounds = (civil: ZonedCivilTime) => {
  const start: WallTime = { ...civil, hour: 0, minute: 0, second: 0 }
  const end = shiftWallTime(start, 24)
  return formatBounds(formatWallTime(start), formatWallTime(end), civil.timezone)
}

const getHourBounds = (civil: ZonedCivilTime) => {
  const currentHour: WallTime = { ...civil, minute: 0, second: 0 }
  const start = shiftWallTime(currentHour, civil.hour % 2 === 0 ? -1 : 0)
  const end = shiftWallTime(start, 2)
  return formatBounds(formatWallTime(start), formatWallTime(end), civil.timezone)
}

export const getTemporalBounds = (
  lunar: LunarDate,
  civil: ZonedCivilTime,
): Record<TemporalScope, string> => ({
  year: getYearBounds(civil),
  month: getMonthBounds(lunar, civil),
  day: getDayBounds(civil),
  hour: getHourBounds(civil),
})
