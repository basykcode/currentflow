import type {
  FieldDirection,
  ResolvedTemporalScale,
  ResponseRelation,
  SemanticConflict,
} from './types'
import { highestScopeWeightForValue, rankWeightedValues } from './weighting'

const DIRECTION_TENSIONS: readonly (readonly [FieldDirection, FieldDirection])[] = [
  ['emerge', 'store'],
  ['rise', 'descend'],
  ['expand', 'contract'],
  ['culminate', 'emerge'],
]

const RELATION_TENSIONS: readonly (readonly [ResponseRelation, ResponseRelation])[] = [
  ['follow', 'withdraw'],
  ['complete', 'wait'],
]

const scopesFor = <T extends string>(
  scales: readonly ResolvedTemporalScale[],
  value: T,
  select: (scale: ResolvedTemporalScale) => readonly T[],
) => scales.filter((scale) => select(scale).includes(value)).map((scale) => scale.scope)

export const detectSemanticConflicts = (
  scales: readonly ResolvedTemporalScale[],
): readonly SemanticConflict[] => {
  const conflicts: SemanticConflict[] = []
  for (const [left, right] of DIRECTION_TENSIONS) {
    const leftScopes = scopesFor(scales, left, (scale) => scale.profile.movement)
    const rightScopes = scopesFor(scales, right, (scale) => scale.profile.movement)
    if (leftScopes.length > 0 && rightScopes.length > 0) {
      conflicts.push({
        id: `direction-${left}-${right}`,
        kind: 'direction',
        scopes: [...new Set([...leftScopes, ...rightScopes])],
        values: [left, right],
        resolution: 'Resolve by day, hour, month, then year ordinal precedence.',
      })
    }
  }
  for (const [left, right] of RELATION_TENSIONS) {
    const leftScopes = scopesFor(scales, left, (scale) => scale.profile.responseRelations)
    const rightScopes = scopesFor(scales, right, (scale) => scale.profile.responseRelations)
    if (leftScopes.length > 0 && rightScopes.length > 0) {
      conflicts.push({
        id: `response-${left}-${right}`,
        kind: 'response-relation',
        scopes: [...new Set([...leftScopes, ...rightScopes])],
        values: [left, right],
        resolution: 'Resolve by weighted support while preserving the day as the operative scale.',
      })
    }
  }
  return conflicts
}

export type VerbPolicy = Readonly<{
  preferredVerbs: readonly string[]
  forbiddenVerbs: readonly string[]
  conflicts: readonly SemanticConflict[]
}>

export const resolveVerbPolicy = (scales: readonly ResolvedTemporalScale[]): VerbPolicy => {
  const preferredRank = rankWeightedValues(scales, (scale) => scale.profile.preferredVerbs)
  const forbiddenRank = rankWeightedValues(scales, (scale) => scale.profile.forbiddenVerbs)
  const all = new Set([...preferredRank, ...forbiddenRank])
  const preferredVerbs: string[] = []
  const forbiddenVerbs: string[] = []
  const conflicts: SemanticConflict[] = []

  for (const verb of all) {
    const preferredWeight = highestScopeWeightForValue(
      scales,
      verb,
      (scale) => scale.profile.preferredVerbs,
    )
    const forbiddenWeight = highestScopeWeightForValue(
      scales,
      verb,
      (scale) => scale.profile.forbiddenVerbs,
    )
    if (preferredWeight > 0 && forbiddenWeight > 0) {
      const forbiddenWins = forbiddenWeight >= preferredWeight
      conflicts.push({
        id: `verb-${verb}`,
        kind: 'verb-policy',
        scopes: [
          ...new Set([
            ...scopesFor(scales, verb, (scale) => scale.profile.preferredVerbs),
            ...scopesFor(scales, verb, (scale) => scale.profile.forbiddenVerbs),
          ]),
        ],
        values: [verb],
        resolution: forbiddenWins
          ? 'Forbidden use wins an equal or stronger scale tie.'
          : 'Preferred use wins because it occurs at a stronger temporal scale.',
      })
      if (forbiddenWins) forbiddenVerbs.push(verb)
      else preferredVerbs.push(verb)
    } else if (forbiddenWeight > 0) forbiddenVerbs.push(verb)
    else preferredVerbs.push(verb)
  }

  const orderByRank = (values: readonly string[], rank: readonly string[]) =>
    [...values].sort((left, right) => rank.indexOf(left) - rank.indexOf(right))
  return Object.freeze({
    preferredVerbs: orderByRank(preferredVerbs, preferredRank).slice(0, 8),
    forbiddenVerbs: orderByRank(forbiddenVerbs, forbiddenRank),
    conflicts,
  })
}
