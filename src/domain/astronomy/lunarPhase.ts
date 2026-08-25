import { angularDistanceDegrees, normalizeDegrees } from './normalization'
import type { LunarMotion, LunarPhaseName } from './types'

export const CARDINAL_EVENT_EPSILON_DEGREES = 1e-6

export const classifyLunarPhase = (elongationDegrees: number): LunarPhaseName => {
  const elongation = normalizeDegrees(elongationDegrees)
  if (elongation < 22.5 || elongation >= 337.5) return 'New Moon'
  if (elongation < 67.5) return 'Waxing Crescent'
  if (elongation < 112.5) return 'First Quarter'
  if (elongation < 157.5) return 'Waxing Gibbous'
  if (elongation < 202.5) return 'Full Moon'
  if (elongation < 247.5) return 'Waning Gibbous'
  if (elongation < 292.5) return 'Third Quarter'
  return 'Waning Crescent'
}

export const classifyLunarMotion = (elongationDegrees: number): LunarMotion => {
  const elongation = normalizeDegrees(elongationDegrees)
  if (angularDistanceDegrees(elongation, 0) <= CARDINAL_EVENT_EPSILON_DEGREES) {
    return 'turning-at-new'
  }
  if (angularDistanceDegrees(elongation, 180) <= CARDINAL_EVENT_EPSILON_DEGREES) {
    return 'turning-at-full'
  }
  return elongation < 180 ? 'waxing' : 'waning'
}
