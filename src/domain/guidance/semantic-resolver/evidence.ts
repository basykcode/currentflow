import type { ResolvedTemporalScale, TemporalSemanticEvidence } from './types'
import { HEXAGRAM_SEMANTIC_REGISTRY_VERSION } from './versions'

const evidenceWeight = (
  scope: ResolvedTemporalScale['scope'],
): TemporalSemanticEvidence['weight'] => {
  if (scope === 'day') return 'primary'
  if (scope === 'hour') return 'supporting'
  return 'contextual'
}

export const createTemporalSemanticEvidence = (
  scales: readonly ResolvedTemporalScale[],
): readonly TemporalSemanticEvidence[] =>
  scales.map((scale) =>
    Object.freeze({
      id: `current-semantic-${scale.scope}-hexagram-${scale.hexagramNumber}`,
      scope: scale.scope,
      hexagramNumber: scale.hexagramNumber,
      weight: evidenceWeight(scale.scope),
      canonicalIdentity: Object.freeze({
        status: 'curated' as const,
        sourceLabel: scale.canonicalSourceLabel,
      }),
      currentSemanticProfile: Object.freeze({
        layer: 'current-semantic' as const,
        profileVersion: scale.profile.version,
        registryVersion: HEXAGRAM_SEMANTIC_REGISTRY_VERSION,
        review: scale.profile.review,
      }),
      contributions: Object.freeze({
        movement: scale.profile.movement,
        strategicVectors: scale.profile.strategicVectors,
        responseRelations: scale.profile.responseRelations,
      }),
    }),
  )
