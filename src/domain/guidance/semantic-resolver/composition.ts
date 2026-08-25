import { detectSemanticConflicts, resolveVerbPolicy } from './conflict'
import { getResponseRelationDefinition } from '../synthesis/responseRelation'
import type {
  BackgroundTheme,
  DominantTexture,
  EvidenceStatus,
  FieldRelationship,
  GuidanceCondition,
  GuidanceDirection,
  GuidanceSemanticInput,
  ImageFamily,
  LunarMode,
  SemanticBoundary,
  SemanticTheme,
  SomaticVector,
  StrategicVector,
} from '../types'
import { resolveEffortLevel } from './rules/effortRules'
import { resolveResponseRelation } from './rules/responseRelationRules'
import { resolveSomaticVectors, resolveStrategicVectors } from './rules/vectorRules'
import type {
  AvailableTemporalSemanticResolution,
  EffortLevel,
  FieldDirection,
  FieldTexture,
  LunarMode as ResolverLunarMode,
  ResolvedTemporalScale,
  ResolverImageFamily,
  SomaticVector as ResolverSomaticVector,
  StrategicVector as ResolverStrategicVector,
  ResponseRelation,
  SemanticConflict,
} from './types'
import { rankWeightedValues } from './weighting'

export type ComposedTemporalSemantics = Readonly<{
  primaryDirection: FieldDirection
  secondaryDirection: FieldDirection
  dominantTexture: FieldTexture
  lunarMode: ResolverLunarMode
  dominantImageFamily: ResolverImageFamily
  relation: ResponseRelation
  effortLevel: EffortLevel
  strategicVectors: readonly ResolverStrategicVector[]
  somaticVectors: readonly ResolverSomaticVector[]
  compatibleIntentionIds: readonly string[]
  preferredVerbs: readonly string[]
  forbiddenVerbs: readonly string[]
  conflicts: readonly SemanticConflict[]
}>

export const composeTemporalSemantics = (
  scales: readonly ResolvedTemporalScale[],
): ComposedTemporalSemantics => {
  const directions = rankWeightedValues(scales, (scale) => scale.profile.movement)
  const textures = rankWeightedValues(scales, (scale) => scale.profile.supportedTextures)
  const lunarModes = rankWeightedValues(scales, (scale) => scale.profile.compatibleLunarModes)
  const imageFamilies = rankWeightedValues(scales, (scale) => scale.profile.imageFamilies)
  const compatibleIntentionIds = rankWeightedValues(
    scales,
    (scale) => scale.profile.compatibleIntentionIds,
  ).slice(0, 8)
  const relation = resolveResponseRelation(scales)
  const effort = resolveEffortLevel(scales)
  const strategicVectors = resolveStrategicVectors(scales)
  const verbPolicy = resolveVerbPolicy(scales)
  const primaryDirection = directions[0]
  const dominantTexture = textures[0]
  const lunarMode = lunarModes[0]
  const dominantImageFamily = imageFamilies[0]
  if (!primaryDirection || !dominantTexture || !lunarMode || !dominantImageFamily) {
    throw new Error('Reviewed profiles must supply all required semantic dimensions.')
  }

  return Object.freeze({
    primaryDirection,
    secondaryDirection: directions[1] ?? primaryDirection,
    dominantTexture,
    lunarMode,
    dominantImageFamily,
    relation,
    effortLevel: effort.effortLevel,
    strategicVectors,
    somaticVectors: resolveSomaticVectors(relation, strategicVectors),
    compatibleIntentionIds,
    preferredVerbs: verbPolicy.preferredVerbs,
    forbiddenVerbs: verbPolicy.forbiddenVerbs,
    conflicts: [
      ...detectSemanticConflicts(scales),
      ...(effort.conflict ? [effort.conflict] : []),
      ...verbPolicy.conflicts,
    ],
  })
}

const CONDITION_BY_RELATION: Readonly<Record<ResponseRelation, GuidanceCondition>> = Object.freeze({
  follow: 'emergence',
  contain: 'excess',
  counterbalance: 'deficiency',
  complete: 'completion',
  wait: 'threshold',
  transform: 'repair',
  withdraw: 'withdrawal',
})

const RELATIONSHIP_BY_RELATION: Readonly<Record<ResponseRelation, FieldRelationship>> =
  Object.freeze({
    follow: 'coherent',
    contain: 'excessive',
    counterbalance: 'deficient',
    complete: 'ripening',
    wait: 'threshold',
    transform: 'blocked',
    withdraw: 'dispersing',
  })

const TENSION_BY_RELATION: Readonly<Record<ResponseRelation, string>> = Object.freeze({
  follow: 'The operative scale supports coordinated continuation.',
  contain: 'The operative scale calls for a bounded response to excess movement.',
  counterbalance: 'The operative scale calls for one proportionate supporting quality.',
  complete: 'The operative scale favors closure before further initiation.',
  wait: 'The operative scale favors preserving the current boundary.',
  transform: 'The operative scale favors bounded repair of the nearest obstruction.',
  withdraw: 'The operative scale favors reducing outward expenditure.',
})

const DIRECTION_ADAPTER: Readonly<Record<FieldDirection, GuidanceDirection>> = Object.freeze({
  emerge: 'forward',
  rise: 'forward',
  expand: 'forward',
  culminate: 'closing',
  turn: 'circulating',
  descend: 'closing',
  gather: 'inward',
  contract: 'holding',
  store: 'stabilizing',
  return: 'circulating',
})

const TEXTURE_ADAPTER: Readonly<Record<FieldTexture, DominantTexture>> = Object.freeze({
  wind: 'fluid',
  heat: 'pressurized',
  fire: 'pressurized',
  damp: 'dense',
  dry: 'fragmented',
  cold: 'settled',
  clear: 'clear',
  mixed: 'ripening',
})

const LUNAR_ADAPTER: Readonly<Record<ResolverLunarMode, LunarMode>> = Object.freeze({
  emergence: 'emerging',
  accumulation: 'building',
  culmination: 'culminating',
  distribution: 'releasing',
  consolidation: 'resting',
  concealment: 'threshold',
})

const IMAGE_ADAPTER: Readonly<Record<ResolverImageFamily, ImageFamily>> = Object.freeze({
  weather: 'current',
  water: 'current',
  terrain: 'shelter',
  architecture: 'container',
  vessel: 'vessel',
  plant: 'opening',
  movement: 'bridge',
})

const STRATEGY_ADAPTER: Readonly<Record<ResolverStrategicVector, StrategicVector>> = Object.freeze({
  begin: 'advance',
  continue: 'advance',
  finish: 'complete',
  repair: 'repair',
  clarify: 'clarify',
  organize: 'stabilize',
  narrow: 'limit',
  protect: 'stabilize',
  receive: 'nourish',
  release: 'release',
  pause: 'pause',
  withdraw: 'gather',
  adapt: 'adapt',
})

const SOMATIC_ADAPTER: Readonly<Record<ResolverSomaticVector, SomaticVector>> = Object.freeze({
  'lower-center': 'ground',
  'settle-breath': 'settle',
  'soften-grip': 'soften',
  'reduce-pace': 'reduce-pace',
  'keep-steps-light': 'maintain-rhythm',
  'widen-gaze': 'allow-space',
  'hold-position': 'ground',
  'release-shoulders': 'soften',
})

const unique = <T>(values: readonly T[]): readonly T[] => [...new Set(values)]

const themeForScale = (scale: ResolvedTemporalScale): SemanticTheme => ({
  label: `${scale.scope} · Hexagram ${scale.hexagramNumber} · ${scale.profile.strategicVectors.join(' / ')}`,
  strategicVectors: unique(
    scale.profile.strategicVectors.map((vector) => STRATEGY_ADAPTER[vector]),
  ),
  somaticVectors: unique(
    resolveSomaticVectors(
      scale.profile.responseRelations[0] ?? 'wait',
      scale.profile.strategicVectors,
    ).map((vector) => SOMATIC_ADAPTER[vector]),
  ),
})

export type GuidanceSemanticAdapterContext = Readonly<{
  synthesisId?: string
  validFromUtc: string
  boundaries: readonly SemanticBoundary[]
  status?: EvidenceStatus
}>

export const toGuidanceSemanticInput = (
  resolution: AvailableTemporalSemanticResolution,
  context: GuidanceSemanticAdapterContext,
): GuidanceSemanticInput => {
  const relation = resolution.primaryCurrent.relation
  const relationDefinition = getResponseRelationDefinition(relation)
  const forbiddenVerbs = unique([
    ...relationDefinition.forbiddenVerbs,
    ...resolution.field.forbiddenVerbs,
  ])
  const supportedVerbs = unique([
    ...relationDefinition.supportedVerbs,
    ...resolution.field.preferredVerbs,
  ]).filter((verb) => !forbiddenVerbs.includes(verb))
  const somaticVectors = unique(
    resolution.field.somaticVectors.map((vector) => SOMATIC_ADAPTER[vector]),
  )
  const backgroundThemes: readonly BackgroundTheme[] = resolution.scales.backgrounds.map(
    (scale) => ({
      ...themeForScale(scale),
      kind: scale.scope === 'year' ? 'solar' : 'seasonal',
    }),
  )
  const status = context.status ?? 'computed'
  const synthesisId = context.synthesisId ?? resolution.resolutionId
  const evidence: GuidanceSemanticInput['evidence'] = [
    ...resolution.evidence.map((item) => ({
      source: {
        id: item.id,
        label: `${item.scope} Hexagram ${item.hexagramNumber} Current semantic profile`,
      },
      semanticClaim: `${item.scope} contribution · ${item.contributions.movement.join(' / ')} · ${item.contributions.strategicVectors.join(' / ')}`,
      weight: item.weight,
      provenance: {
        status,
        sourceLabel:
          'Canonical identity kept separate from Current Semantic Layer v1 operational vectors',
        methodologyId: resolution.version,
        sourceIds: [
          `canonical-hexagram-${item.hexagramNumber}`,
          `current-semantic-profile-${item.hexagramNumber}`,
        ],
      },
    })),
    ...(resolution.missingProfileNumbers.length > 0
      ? [
          {
            source: {
              id: `${resolution.resolutionId}-coverage-gap`,
              label: 'Current semantic registry coverage gap',
            },
            semanticClaim: `No v1 operational profile for Hexagram ${resolution.missingProfileNumbers.join(', ')}`,
            weight: 'contextual' as const,
            provenance: {
              status: 'unavailable' as const,
              sourceLabel: 'Current Semantic Layer v1 · explicit missing profile record',
              methodologyId: resolution.version,
              sourceIds: resolution.missingProfileNumbers.map(
                (number) => `current-semantic-profile-${number}-unavailable`,
              ),
            },
          },
        ]
      : []),
  ]

  return Object.freeze({
    synthesisId,
    semanticVersion: resolution.version,
    condition: CONDITION_BY_RELATION[relation],
    primaryCurrent: Object.freeze({
      id: `${synthesisId}-${relation}`,
      label: `Primary Current · ${relation}`,
      status,
      sourceLabel: 'Current Semantic Layer v1 · product-specification review',
    }),
    field: Object.freeze({
      primaryDirection: DIRECTION_ADAPTER[resolution.field.primaryDirection],
      secondaryDirection: DIRECTION_ADAPTER[resolution.field.secondaryDirection],
      dominantTexture: TEXTURE_ADAPTER[resolution.field.dominantTexture],
      lunarMode: LUNAR_ADAPTER[resolution.field.lunarMode],
      fieldRelationship: RELATIONSHIP_BY_RELATION[relation],
      dominantImageFamily: IMAGE_ADAPTER[resolution.field.dominantImageFamily],
      tensionDescription: TENSION_BY_RELATION[relation],
    }),
    operativeWork: Object.freeze({
      dayTheme: themeForScale(resolution.scales.day),
      hourModifier: resolution.scales.hour
        ? themeForScale(resolution.scales.hour)
        : {
            label: 'Hour semantic profile unavailable in the v1 registry',
            strategicVectors: [] as const,
            somaticVectors: [] as const,
          },
      backgroundThemes,
    }),
    resolvedResponse: Object.freeze({
      relation,
      effortLevel: resolution.primaryCurrent.effortLevel,
      strategicVectors: unique(
        resolution.field.strategicVectors.map((vector) => STRATEGY_ADAPTER[vector]),
      ),
      somaticVectors,
      compatibleIntentionIds: resolution.field.compatibleIntentionIds,
      supportedVerbs,
      forbiddenVerbs,
    }),
    evidence,
    validFromUtc: context.validFromUtc,
    boundaries: context.boundaries,
  })
}
