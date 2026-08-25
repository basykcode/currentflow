import type { TemporalScope } from '@/domain/astrology/types'

import { composeTemporalSemantics } from './composition'
import { createTemporalSemanticEvidence } from './evidence'
import { getHexagramSemanticRecord } from './hexagrams/registry'
import type {
  ResolvedTemporalScale,
  TemporalSemanticResolution,
  TemporalSemanticResolverInput,
} from './types'
import {
  HEXAGRAM_SEMANTIC_REGISTRY_VERSION,
  TEMPORAL_SEMANTIC_METHOD_VERSIONS,
  TEMPORAL_SEMANTIC_RESOLVER_VERSION,
} from './versions'
import { TEMPORAL_SCALE_ORDER, orderResolvedScales } from './weighting'

const semanticResolutionId = (input: TemporalSemanticResolverInput) =>
  `temporal-semantic-${TEMPORAL_SCALE_ORDER.map(
    (scope) => `${scope}-${input.temporal[scope].hexagram.number ?? 'unavailable'}`,
  ).join('-')}`

const resolvedScale = (
  scope: TemporalScope,
  input: TemporalSemanticResolverInput,
): ResolvedTemporalScale | undefined => {
  const temporal = input.temporal[scope]
  const number = temporal.hexagram.number
  if (number === null || temporal.status === 'unavailable') return undefined
  const record = getHexagramSemanticRecord(number)
  if (!record || record.profile.review.status === 'needs-review') return undefined
  return Object.freeze({
    scope,
    hexagramNumber: number,
    hexagramName: record.hexagram.nameEnglish,
    canonicalSourceLabel: record.hexagram.sourceLabel,
    temporalSourceLabel: temporal.sourceLabel,
    profile: record.profile,
  })
}

export const resolveTemporalSemantics = (
  input: TemporalSemanticResolverInput,
): TemporalSemanticResolution => {
  const resolutionId = semanticResolutionId(input)
  const availableScales = orderResolvedScales(
    TEMPORAL_SCALE_ORDER.map((scope) => resolvedScale(scope, input)).filter(
      (scale): scale is ResolvedTemporalScale => scale !== undefined,
    ),
  )
  const missingProfileNumbers = [
    ...new Set(
      TEMPORAL_SCALE_ORDER.map((scope) => input.temporal[scope].hexagram.number).filter(
        (number): number is number =>
          number !== null && !availableScales.some((scale) => scale.hexagramNumber === number),
      ),
    ),
  ]
  const day = availableScales.find((scale) => scale.scope === 'day')
  if (!day) {
    const dayNumber = input.temporal.day.hexagram.number
    return Object.freeze({
      status: 'unavailable',
      resolutionId,
      version: TEMPORAL_SEMANTIC_RESOLVER_VERSION,
      registryVersion: HEXAGRAM_SEMANTIC_REGISTRY_VERSION,
      versions: TEMPORAL_SEMANTIC_METHOD_VERSIONS,
      reason:
        dayNumber === null
          ? 'The operative day hexagram is unavailable.'
          : `Current Semantic Layer v1 does not yet contain an eligible profile for operative day Hexagram ${dayNumber}.`,
      missingProfileNumbers,
    })
  }

  const composition = composeTemporalSemantics(availableScales)
  const hour = availableScales.find((scale) => scale.scope === 'hour')
  const backgrounds = availableScales.filter(
    (scale) => scale.scope === 'month' || scale.scope === 'year',
  )
  return Object.freeze({
    status: 'available',
    coverage: availableScales.length === 4 ? 'complete' : 'partial',
    resolutionId,
    version: TEMPORAL_SEMANTIC_RESOLVER_VERSION,
    registryVersion: HEXAGRAM_SEMANTIC_REGISTRY_VERSION,
    versions: TEMPORAL_SEMANTIC_METHOD_VERSIONS,
    primaryCurrent: Object.freeze({
      scope: 'day' as const,
      hexagramNumber: day.hexagramNumber,
      relation: composition.relation,
      effortLevel: composition.effortLevel,
    }),
    field: Object.freeze({
      primaryDirection: composition.primaryDirection,
      secondaryDirection: composition.secondaryDirection,
      dominantTexture: composition.dominantTexture,
      lunarMode: composition.lunarMode,
      dominantImageFamily: composition.dominantImageFamily,
      strategicVectors: composition.strategicVectors,
      somaticVectors: composition.somaticVectors,
      preferredVerbs: composition.preferredVerbs,
      forbiddenVerbs: composition.forbiddenVerbs,
      compatibleIntentionIds: composition.compatibleIntentionIds,
    }),
    scales: Object.freeze({
      day,
      ...(hour ? { hour } : {}),
      backgrounds,
    }),
    missingProfileNumbers,
    conflicts: composition.conflicts,
    evidence: createTemporalSemanticEvidence(availableScales),
  })
}
