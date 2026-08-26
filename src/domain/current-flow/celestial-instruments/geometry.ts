import { EARTHLY_BRANCH_MONTH_DEFINITIONS } from './labels'
import type { BranchMonthDefinition, ChineseSolarSeason } from './types'

export interface PolarPoint {
  readonly x: number
  readonly y: number
}

export const normalizeDegrees = (degrees: number) => {
  if (!Number.isFinite(degrees)) throw new Error('A finite angle is required.')
  return ((degrees % 360) + 360) % 360
}

export const pointOnCircle = (
  centerX: number,
  centerY: number,
  radius: number,
  angleFromTopClockwiseDegrees: number,
): PolarPoint => {
  const radians = (normalizeDegrees(angleFromTopClockwiseDegrees) * Math.PI) / 180
  return Object.freeze({
    x: centerX + radius * Math.sin(radians),
    y: centerY - radius * Math.cos(radians),
  })
}

export const unwrapAngleForShortestPath = (
  previousUnwrappedDegrees: number,
  nextNormalizedDegrees: number,
) => {
  if (!Number.isFinite(previousUnwrappedDegrees)) {
    throw new Error('A finite previous angle is required.')
  }
  const previousNormalized = normalizeDegrees(previousUnwrappedDegrees)
  let delta = normalizeDegrees(nextNormalizedDegrees) - previousNormalized
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return previousUnwrappedDegrees + delta
}

export const lunarMarkerAngleDegrees = (elongationDegrees: number) =>
  normalizeDegrees(elongationDegrees)

export const solarMarkerAngleDegrees = (solarLongitudeDegrees: number) =>
  normalizeDegrees(solarLongitudeDegrees - 270)

export const resolveChineseSolarSeason = (solarLongitudeDegrees: number): ChineseSolarSeason => {
  const longitude = normalizeDegrees(solarLongitudeDegrees)
  if (longitude >= 315 || longitude < 45) return 'Spring'
  if (longitude < 135) return 'Summer'
  if (longitude < 225) return 'Autumn'
  return 'Winter'
}

export const resolveBranchMonthFromSolarLongitude = (
  solarLongitudeDegrees: number,
): BranchMonthDefinition => {
  const offsetFromZiBoundary = normalizeDegrees(solarLongitudeDegrees - 255)
  const index = Math.floor(offsetFromZiBoundary / 30)
  const definition = EARTHLY_BRANCH_MONTH_DEFINITIONS[index]
  if (!definition) throw new Error(`Unable to resolve branch-month sector ${index}.`)
  return definition
}
