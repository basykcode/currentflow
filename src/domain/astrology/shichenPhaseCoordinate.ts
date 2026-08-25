import { getZonedCivilTime } from './civilTime'
import {
  getShichenElapsedWholeCivilMinutes,
  getShichenIdentity,
  getShichenIndex,
  getNextShichenIdentity,
  type ShichenIdentity,
} from './shichen'
import {
  calculateHourPhase,
  type HourPhase,
  type ShichenPhaseCoordinate,
} from '@/domain/time/chu-zheng-ke'

const MINUTE_MS = 60_000
const MAX_SCAN_MINUTES = 6 * 60

export type ResolvedShichenPhase = Readonly<{
  shichen: ShichenIdentity
  nextShichen: ShichenIdentity
  coordinate: ShichenPhaseCoordinate
  hourPhase: HourPhase
}>

const floorToMinute = (instant: Date) => Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS

const elapsedAt = (instant: Date, timezone: string) => {
  const civil = getZonedCivilTime(instant, timezone)
  return (
    getShichenElapsedWholeCivilMinutes(civil.hour, civil.minute) +
    civil.second / 60 +
    instant.getUTCMilliseconds() / MINUTE_MS
  )
}

const findStartUtc = (at: Date, timezone: string, shichenIndex: number) => {
  let candidate = floorToMinute(at)
  for (let offset = 0; offset <= MAX_SCAN_MINUTES; offset += 1) {
    const previous = candidate - MINUTE_MS
    if (getShichenIndex(getZonedCivilTime(new Date(previous), timezone).hour) !== shichenIndex) {
      return new Date(candidate).toISOString()
    }
    candidate = previous
  }
  throw new Error('Unable to resolve the current Shíchen start through local civil time.')
}

const findBoundary = (at: Date, predicate: (candidate: Date) => boolean) => {
  const firstWholeMinute = floorToMinute(at) + MINUTE_MS
  for (let offset = 0; offset <= MAX_SCAN_MINUTES; offset += 1) {
    const candidate = new Date(firstWholeMinute + offset * MINUTE_MS)
    if (predicate(candidate)) return candidate.toISOString()
  }
  throw new Error('Unable to resolve a future Shíchen phase boundary through local civil time.')
}

export const resolveLocalCivilShichenPhase = (
  at: Date,
  requestedTimezone?: string,
): ResolvedShichenPhase => {
  if (Number.isNaN(at.getTime())) throw new Error('A valid instant is required.')
  const civil = getZonedCivilTime(at, requestedTimezone)
  const timezone = civil.timezone
  const shichen = getShichenIdentity(civil.hour)
  const nextShichen = getNextShichenIdentity(shichen)
  const elapsedBasisMinutes = elapsedAt(at, timezone)
  const currentMacro = elapsedBasisMinutes < 60 ? 'chu' : 'zheng'
  const currentMicro = Math.floor((elapsedBasisMinutes % 60) / 15)
  const startUtc = findStartUtc(at, timezone, shichen.index)
  const nextShichenBoundaryUtc = findBoundary(
    at,
    (candidate) => getShichenIndex(getZonedCivilTime(candidate, timezone).hour) !== shichen.index,
  )
  const nextMicroBoundaryUtc = findBoundary(at, (candidate) => {
    const projected = getZonedCivilTime(candidate, timezone)
    if (getShichenIndex(projected.hour) !== shichen.index) return true
    return Math.floor((elapsedAt(candidate, timezone) % 60) / 15) !== currentMicro
  })
  const nextMacroBoundaryUtc = findBoundary(at, (candidate) => {
    const projected = getZonedCivilTime(candidate, timezone)
    if (getShichenIndex(projected.hour) !== shichen.index) return true
    return (elapsedAt(candidate, timezone) < 60 ? 'chu' : 'zheng') !== currentMacro
  })
  const startTime = new Date(startUtc).getTime()
  const endTime = new Date(nextShichenBoundaryUtc).getTime()
  const actualDurationMinutes = (endTime - startTime) / MINUTE_MS
  const warnings =
    actualDurationMinutes === 120
      ? []
      : [
          `The ${timezone} local-civil Shíchen spans ${actualDurationMinutes} real UTC minutes because of an offset transition; phase remains based on projected civil position.`,
        ]
  const coordinate: ShichenPhaseCoordinate = Object.freeze({
    timeBasis: 'local-civil',
    elapsedBasisMinutes,
    totalBasisMinutes: 120,
    startUtc,
    endUtc: nextShichenBoundaryUtc,
    nextMinuteBoundaryUtc: new Date(floorToMinute(at) + MINUTE_MS).toISOString(),
    nextMicroBoundaryUtc,
    nextMacroBoundaryUtc,
    nextShichenBoundaryUtc,
    warnings: Object.freeze(warnings),
  })

  return Object.freeze({
    shichen,
    nextShichen,
    coordinate,
    hourPhase: calculateHourPhase(coordinate),
  })
}
