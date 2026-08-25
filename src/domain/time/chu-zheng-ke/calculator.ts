import {
  CHU_ZHENG_KE_METHODOLOGY_ID,
  CHU_ZHENG_KE_METHODOLOGY_VERSION,
  MACRO_PRESENTATION,
  MICRO_PRESENTATION,
} from './methodology'
import type { HourPhase, MicroHour, ShichenPhaseCoordinate } from './types'

export class InvalidShichenPhaseCoordinateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidShichenPhaseCoordinateError'
  }
}

const assertUtc = (value: string, label: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || !value.endsWith('Z')) {
    throw new InvalidShichenPhaseCoordinateError(`${label} must be a valid UTC ISO timestamp.`)
  }
}

export const calculateHourPhase = (coordinate: ShichenPhaseCoordinate): HourPhase => {
  const elapsed = coordinate.elapsedBasisMinutes
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= coordinate.totalBasisMinutes) {
    throw new InvalidShichenPhaseCoordinateError(
      `elapsedBasisMinutes must be in [0, 120); received ${elapsed}.`,
    )
  }
  if (coordinate.totalBasisMinutes !== 120) {
    throw new InvalidShichenPhaseCoordinateError(
      'A Shíchen coordinate must contain 120 basis minutes.',
    )
  }
  assertUtc(coordinate.startUtc, 'startUtc')
  assertUtc(coordinate.endUtc, 'endUtc')
  assertUtc(coordinate.nextMinuteBoundaryUtc, 'nextMinuteBoundaryUtc')
  assertUtc(coordinate.nextMicroBoundaryUtc, 'nextMicroBoundaryUtc')
  assertUtc(coordinate.nextMacroBoundaryUtc, 'nextMacroBoundaryUtc')
  assertUtc(coordinate.nextShichenBoundaryUtc, 'nextShichenBoundaryUtc')

  const macroHour = elapsed < 60 ? 'chu' : 'zheng'
  const macro = MACRO_PRESENTATION[macroHour]
  const macroElapsedBasisMinutes = elapsed % 60
  const microHour = Math.floor(macroElapsedBasisMinutes / 15) as MicroHour
  const micro = MICRO_PRESENTATION[microHour]
  const shichenElapsedWholeMinutes = Math.floor(elapsed)

  return Object.freeze({
    methodologyId: CHU_ZHENG_KE_METHODOLOGY_ID,
    methodologyVersion: CHU_ZHENG_KE_METHODOLOGY_VERSION,
    timeBasis: coordinate.timeBasis,
    shichenStartUtc: coordinate.startUtc,
    shichenEndUtc: coordinate.endUtc,
    shichenElapsedBasisMinutes: elapsed,
    shichenElapsedWholeMinutes,
    macroHour,
    macroSemantic: macroHour === 'chu' ? 'entering' : 'established',
    chineseMacroLabel: macro.chinese,
    macroElapsedBasisMinutes,
    macroElapsedWholeMinutes: Math.floor(macroElapsedBasisMinutes),
    microHour,
    chineseKeLabel: micro.chinese,
    timelinePosition: Math.max(0, Math.min(1, shichenElapsedWholeMinutes / 120)),
    nextMinuteBoundaryUtc: coordinate.nextMinuteBoundaryUtc,
    nextMicroBoundaryUtc: coordinate.nextMicroBoundaryUtc,
    nextMacroBoundaryUtc: coordinate.nextMacroBoundaryUtc,
    nextShichenBoundaryUtc: coordinate.nextShichenBoundaryUtc,
    warnings: Object.freeze([...coordinate.warnings]),
  })
}
