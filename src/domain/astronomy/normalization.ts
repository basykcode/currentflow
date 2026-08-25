import { AstroTime } from 'astronomy-engine'

import { CelestialCalculationError } from './types'

const ABSOLUTE_ISO_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/i

export const normalizeDegrees = (degrees: number) => {
  if (!Number.isFinite(degrees)) {
    throw new CelestialCalculationError(
      'astronomy-engine-failure',
      'Astronomy Engine returned a non-finite angle.',
    )
  }
  return ((degrees % 360) + 360) % 360
}

export const parseAbsoluteUtcInstant = (instantUtc: string) => {
  if (!ABSOLUTE_ISO_SUFFIX.test(instantUtc)) {
    throw new CelestialCalculationError(
      'invalid-celestial-instant',
      'Celestial calculations require an ISO 8601 instant with Z or an explicit UTC offset.',
    )
  }

  const date = new Date(instantUtc)
  if (Number.isNaN(date.getTime())) {
    throw new CelestialCalculationError(
      'invalid-celestial-instant',
      'Celestial calculations require a valid absolute ISO 8601 instant.',
    )
  }

  return Object.freeze({ date, time: new AstroTime(date), instantUtc: date.toISOString() })
}

export const angularDistanceDegrees = (left: number, right: number) => {
  const difference = Math.abs(normalizeDegrees(left) - normalizeDegrees(right))
  return Math.min(difference, 360 - difference)
}
