import type { TemporalScope } from '@/domain/astrology/types'

import type { ResolvedTemporalScale } from './types'

/** Ordinal composition precedence, not confidence or probability. */
export const TEMPORAL_SCALE_WEIGHTS: Readonly<Record<TemporalScope, number>> = Object.freeze({
  day: 8,
  hour: 4,
  month: 2,
  year: 1,
})

export const TEMPORAL_SCALE_ORDER: readonly TemporalScope[] = ['day', 'hour', 'month', 'year']

export const orderResolvedScales = (
  scales: readonly ResolvedTemporalScale[],
): readonly ResolvedTemporalScale[] =>
  [...scales].sort(
    (left, right) =>
      TEMPORAL_SCALE_ORDER.indexOf(left.scope) - TEMPORAL_SCALE_ORDER.indexOf(right.scope),
  )

export const rankWeightedValues = <T extends string>(
  scales: readonly ResolvedTemporalScale[],
  select: (scale: ResolvedTemporalScale) => readonly T[],
): readonly T[] => {
  const scores = new Map<T, { score: number; firstSeen: number }>()
  let order = 0
  for (const scale of orderResolvedScales(scales)) {
    for (const value of select(scale)) {
      const current = scores.get(value)
      if (current) current.score += TEMPORAL_SCALE_WEIGHTS[scale.scope]
      else scores.set(value, { score: TEMPORAL_SCALE_WEIGHTS[scale.scope], firstSeen: order })
      order += 1
    }
  }
  return [...scores.entries()]
    .sort(
      ([leftValue, left], [rightValue, right]) =>
        right.score - left.score ||
        left.firstSeen - right.firstSeen ||
        leftValue.localeCompare(rightValue),
    )
    .map(([value]) => value)
}

export const highestScopeWeightForValue = <T extends string>(
  scales: readonly ResolvedTemporalScale[],
  value: T,
  select: (scale: ResolvedTemporalScale) => readonly T[],
) =>
  Math.max(
    0,
    ...scales
      .filter((scale) => select(scale).includes(value))
      .map((scale) => TEMPORAL_SCALE_WEIGHTS[scale.scope]),
  )
