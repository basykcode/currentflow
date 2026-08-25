import type { TemporalHexagram, TemporalScope } from '@/domain/astrology/types'

export type FieldDirection =
  | 'emerge'
  | 'rise'
  | 'expand'
  | 'culminate'
  | 'turn'
  | 'descend'
  | 'gather'
  | 'contract'
  | 'store'
  | 'return'

export type FieldTexture = 'wind' | 'heat' | 'fire' | 'damp' | 'dry' | 'cold' | 'clear' | 'mixed'

export type LunarMode =
  'emergence' | 'accumulation' | 'culmination' | 'distribution' | 'consolidation' | 'concealment'

export type ResponseRelation =
  'follow' | 'contain' | 'counterbalance' | 'complete' | 'wait' | 'transform' | 'withdraw'

export type EffortLevel = 'minimal' | 'measured' | 'steady' | 'decisive'

export type StrategicVector =
  | 'begin'
  | 'continue'
  | 'finish'
  | 'repair'
  | 'clarify'
  | 'organize'
  | 'narrow'
  | 'protect'
  | 'receive'
  | 'release'
  | 'pause'
  | 'withdraw'
  | 'adapt'

export type SomaticVector =
  | 'lower-center'
  | 'settle-breath'
  | 'soften-grip'
  | 'reduce-pace'
  | 'keep-steps-light'
  | 'widen-gaze'
  | 'hold-position'
  | 'release-shoulders'

export type ResolverImageFamily =
  'weather' | 'water' | 'terrain' | 'architecture' | 'vessel' | 'plant' | 'movement'

export type SemanticProfileReviewStatus = 'needs-review' | 'spec-reviewed' | 'human-approved'

export type SemanticProfileReview = Readonly<{
  status: SemanticProfileReviewStatus
  authoredBy: string
  reviewedBy: readonly string[]
  reviewBasis: string
}>

export interface HexagramSemanticProfile {
  readonly hexagramNumber: number
  readonly movement: readonly FieldDirection[]
  readonly strategicVectors: readonly StrategicVector[]
  readonly responseRelations: readonly ResponseRelation[]
  readonly compatibleEffortLevels: readonly EffortLevel[]
  readonly supportedTextures: readonly FieldTexture[]
  readonly compatibleLunarModes: readonly LunarMode[]
  readonly imageFamilies: readonly ResolverImageFamily[]
  readonly compatibleIntentionIds: readonly string[]
  readonly preferredVerbs: readonly string[]
  readonly forbiddenVerbs: readonly string[]
  readonly notes: readonly string[]
  readonly version: string
  readonly review: SemanticProfileReview
}

export type ResolvedTemporalScale = Readonly<{
  scope: TemporalScope
  hexagramNumber: number
  hexagramName: string
  canonicalSourceLabel: string
  temporalSourceLabel: string
  profile: HexagramSemanticProfile
}>

export type SemanticConflict = Readonly<{
  id: string
  kind: 'direction' | 'response-relation' | 'effort' | 'verb-policy'
  scopes: readonly TemporalScope[]
  values: readonly string[]
  resolution: string
}>

export type TemporalSemanticEvidence = Readonly<{
  id: string
  scope: TemporalScope
  hexagramNumber: number
  weight: 'primary' | 'supporting' | 'contextual'
  canonicalIdentity: Readonly<{
    status: 'curated'
    sourceLabel: string
  }>
  currentSemanticProfile: Readonly<{
    layer: 'current-semantic'
    profileVersion: string
    registryVersion: string
    review: SemanticProfileReview
  }>
  contributions: Readonly<{
    movement: readonly FieldDirection[]
    strategicVectors: readonly StrategicVector[]
    responseRelations: readonly ResponseRelation[]
  }>
}>

export type TemporalSemanticResolverInput = Readonly<{
  temporal: Readonly<Record<TemporalScope, TemporalHexagram>>
}>

export type TemporalSemanticMethodVersions = Readonly<{
  resolver: string
  registry: string
  composition: string
  responseRelations: string
  effort: string
  vectors: string
}>

export type AvailableTemporalSemanticResolution = Readonly<{
  status: 'available'
  coverage: 'complete' | 'partial'
  resolutionId: string
  version: string
  registryVersion: string
  versions: TemporalSemanticMethodVersions
  primaryCurrent: Readonly<{
    scope: 'day'
    hexagramNumber: number
    relation: ResponseRelation
    effortLevel: EffortLevel
  }>
  field: Readonly<{
    primaryDirection: FieldDirection
    secondaryDirection: FieldDirection
    dominantTexture: FieldTexture
    lunarMode: LunarMode
    dominantImageFamily: ResolverImageFamily
    strategicVectors: readonly StrategicVector[]
    somaticVectors: readonly SomaticVector[]
    preferredVerbs: readonly string[]
    forbiddenVerbs: readonly string[]
    compatibleIntentionIds: readonly string[]
  }>
  scales: Readonly<{
    day: ResolvedTemporalScale
    hour?: ResolvedTemporalScale
    backgrounds: readonly ResolvedTemporalScale[]
  }>
  missingProfileNumbers: readonly number[]
  conflicts: readonly SemanticConflict[]
  evidence: readonly TemporalSemanticEvidence[]
}>

export type UnavailableTemporalSemanticResolution = Readonly<{
  status: 'unavailable'
  resolutionId: string
  version: string
  registryVersion: string
  versions: TemporalSemanticMethodVersions
  reason: string
  missingProfileNumbers: readonly number[]
}>

export type TemporalSemanticResolution =
  AvailableTemporalSemanticResolution | UnavailableTemporalSemanticResolution
