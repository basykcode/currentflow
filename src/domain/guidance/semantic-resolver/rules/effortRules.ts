import type { EffortLevel, ResolvedTemporalScale, SemanticConflict } from '../types'

const EFFORT_ORDER: readonly EffortLevel[] = ['minimal', 'measured', 'steady', 'decisive']

export type EffortResolution = Readonly<{
  effortLevel: EffortLevel
  conflict?: SemanticConflict
}>

export const resolveEffortLevel = (scales: readonly ResolvedTemporalScale[]): EffortResolution => {
  const day = scales.find((scale) => scale.scope === 'day')
  if (!day) throw new Error('Effort resolution requires a day profile.')

  const shared = EFFORT_ORDER.filter((level) =>
    scales.every((scale) => scale.profile.compatibleEffortLevels.includes(level)),
  )
  const effortLevel =
    shared[0] ?? EFFORT_ORDER.find((level) => day.profile.compatibleEffortLevels.includes(level))
  if (!effortLevel) throw new Error('The day profile does not define a valid effort level.')
  if (shared.length > 0) return Object.freeze({ effortLevel })

  return Object.freeze({
    effortLevel,
    conflict: Object.freeze({
      id: `effort-divergence-${scales.map((scale) => scale.hexagramNumber).join('-')}`,
      kind: 'effort',
      scopes: scales.map((scale) => scale.scope),
      values: [...new Set(scales.flatMap((scale) => scale.profile.compatibleEffortLevels))],
      resolution: 'No shared effort level exists; use the least demanding day-compatible level.',
    }),
  })
}
