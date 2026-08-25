import type { EffortLevel, GuidanceCondition, ProfileLevel } from '../types'

export const EFFORT_LEVEL_ORDER: readonly EffortLevel[] = [
  'minimal',
  'measured',
  'steady',
  'decisive',
]

const EFFORT_BY_CONDITION: Readonly<Record<GuidanceCondition, EffortLevel>> = Object.freeze({
  emergence: 'measured',
  excess: 'minimal',
  deficiency: 'measured',
  completion: 'steady',
  threshold: 'minimal',
  repair: 'measured',
  withdrawal: 'minimal',
})

export type GuidanceProfiles = Readonly<{
  completion: ProfileLevel
  initiation: ProfileLevel
  containment: ProfileLevel
  release: ProfileLevel
}>

const PROFILES_BY_CONDITION: Readonly<Record<GuidanceCondition, GuidanceProfiles>> = Object.freeze({
  emergence: { completion: 'low', initiation: 'high', containment: 'low', release: 'low' },
  excess: { completion: 'moderate', initiation: 'none', containment: 'high', release: 'moderate' },
  deficiency: {
    completion: 'low',
    initiation: 'low',
    containment: 'moderate',
    release: 'low',
  },
  completion: { completion: 'high', initiation: 'none', containment: 'moderate', release: 'high' },
  threshold: { completion: 'low', initiation: 'none', containment: 'high', release: 'low' },
  repair: {
    completion: 'moderate',
    initiation: 'low',
    containment: 'moderate',
    release: 'moderate',
  },
  withdrawal: { completion: 'low', initiation: 'none', containment: 'high', release: 'high' },
})

export const resolveEffortLevel = (condition: GuidanceCondition) => EFFORT_BY_CONDITION[condition]

export const resolveGuidanceProfiles = (condition: GuidanceCondition) =>
  PROFILES_BY_CONDITION[condition]

export const effortDoesNotExceed = (candidate: EffortLevel, limit: EffortLevel) =>
  EFFORT_LEVEL_ORDER.indexOf(candidate) <= EFFORT_LEVEL_ORDER.indexOf(limit)
