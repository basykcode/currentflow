import type { ResolvedTemporalScale, ResponseRelation } from '../types'
import { rankWeightedValues } from '../weighting'

export const resolveResponseRelation = (
  scales: readonly ResolvedTemporalScale[],
): ResponseRelation => {
  const relation = rankWeightedValues(scales, (scale) => scale.profile.responseRelations)[0]
  if (!relation) throw new Error('A response relation requires at least one reviewed profile.')
  return relation
}
