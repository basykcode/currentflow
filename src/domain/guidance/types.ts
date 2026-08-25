import type {
  EffortLevel as ResolverEffortLevel,
  ResponseRelation as ResolverResponseRelation,
} from './semantic-resolver/types'

export type EffortLevel = ResolverEffortLevel
export type ResponseRelation = ResolverResponseRelation

export type Versioned<T> = Readonly<{
  value: T
  version: string
}>

export type GuidanceCondition =
  'emergence' | 'excess' | 'deficiency' | 'completion' | 'threshold' | 'repair' | 'withdrawal'

export type ProfileLevel = 'none' | 'low' | 'moderate' | 'high'

export type GuidanceDirection =
  'forward' | 'inward' | 'holding' | 'circulating' | 'closing' | 'releasing' | 'stabilizing'

export type DominantTexture =
  'clear' | 'fluid' | 'dense' | 'pressurized' | 'settled' | 'fragmented' | 'ripening'

export type LunarMode =
  'emerging' | 'building' | 'culminating' | 'releasing' | 'resting' | 'threshold'

export type FieldRelationship =
  'coherent' | 'excessive' | 'deficient' | 'ripening' | 'blocked' | 'threshold' | 'dispersing'

export type ImageFamily =
  'opening' | 'container' | 'bridge' | 'vessel' | 'threshold' | 'current' | 'shelter'

export type StrategicVector =
  | 'advance'
  | 'stabilize'
  | 'limit'
  | 'clarify'
  | 'complete'
  | 'pause'
  | 'repair'
  | 'release'
  | 'gather'
  | 'nourish'
  | 'adapt'
  | 'simplify'

export type SomaticVector =
  | 'settle'
  | 'soften'
  | 'ground'
  | 'reduce-pace'
  | 'allow-space'
  | 'maintain-rhythm'
  | 'restore-circulation'

export type SemanticTheme = Readonly<{
  label: string
  strategicVectors: readonly StrategicVector[]
  somaticVectors: readonly SomaticVector[]
}>

export type BackgroundThemeKind = 'solar' | 'wu-yun-liu-qi' | 'seasonal' | 'other'

export type BackgroundTheme = SemanticTheme &
  Readonly<{
    kind: BackgroundThemeKind
  }>

export type EvidenceWeight = 'primary' | 'supporting' | 'contextual'

export type EvidenceStatus = 'computed' | 'curated' | 'demo' | 'unavailable'

export type GuidanceEvidence = Readonly<{
  source: Versioned<Readonly<{ id: string; label: string }>>
  semanticClaim: Versioned<string>
  weight: Versioned<EvidenceWeight>
  provenance: Versioned<
    Readonly<{
      status: EvidenceStatus
      sourceLabel: string
      methodologyId: string
      sourceIds: readonly string[]
    }>
  >
}>

export type GuidanceSynthesis = Readonly<{
  id: Versioned<string>
  condition: Versioned<GuidanceCondition>
  field: Readonly<{
    primaryDirection: Versioned<GuidanceDirection>
    secondaryDirection: Versioned<GuidanceDirection>
    dominantTexture: Versioned<DominantTexture>
    lunarMode: Versioned<LunarMode>
    fieldRelationship: Versioned<FieldRelationship>
    dominantImageFamily: Versioned<ImageFamily>
    tensionDescription: Versioned<string>
  }>
  operativeWork: Readonly<{
    dayTheme: Versioned<SemanticTheme>
    hourModifier: Versioned<SemanticTheme>
    backgroundThemes: Versioned<readonly BackgroundTheme[]>
  }>
  response: Readonly<{
    relation: Versioned<ResponseRelation>
    strategicVectors: Versioned<readonly StrategicVector[]>
    somaticVectors: Versioned<readonly SomaticVector[]>
    effortLevel: Versioned<EffortLevel>
    compatibleIntentionIds: Versioned<readonly string[]>
    supportedVerbs: Versioned<readonly string[]>
    forbiddenVerbs: Versioned<readonly string[]>
    completion: Versioned<ProfileLevel>
    initiation: Versioned<ProfileLevel>
    containment: Versioned<ProfileLevel>
    release: Versioned<ProfileLevel>
  }>
  evidence: Versioned<readonly GuidanceEvidence[]>
}>

export type SemanticBoundaryReason =
  | 'earthly-branch-hour-change'
  | 'lunar-node-change'
  | 'solar-term-boundary'
  | 'wu-yun-liu-qi-period-boundary'
  | 'semantic-classification-change'

export type SemanticBoundary = Readonly<{
  atUtc: string
  reason: SemanticBoundaryReason
}>

export type GuidanceValidityWindow = Readonly<{
  validFromUtc: string
  validUntilUtc: string
  boundaryReason: SemanticBoundaryReason
}>

export type SemanticThemeInput = SemanticTheme
export type BackgroundThemeInput = BackgroundTheme

export type GuidanceSemanticInput = Readonly<{
  synthesisId: string
  semanticVersion: string
  condition: GuidanceCondition
  primaryCurrent: Readonly<{
    id: string
    label: string
    status: EvidenceStatus
    sourceLabel: string
  }>
  field: Readonly<{
    primaryDirection: GuidanceDirection
    secondaryDirection: GuidanceDirection
    dominantTexture: DominantTexture
    lunarMode: LunarMode
    fieldRelationship: FieldRelationship
    dominantImageFamily: ImageFamily
    tensionDescription: string
  }>
  operativeWork: Readonly<{
    dayTheme: SemanticThemeInput
    hourModifier: SemanticThemeInput
    backgroundThemes: readonly BackgroundThemeInput[]
  }>
  resolvedResponse: Readonly<{
    relation: ResponseRelation
    effortLevel: EffortLevel
    strategicVectors: readonly StrategicVector[]
    somaticVectors: readonly SomaticVector[]
    compatibleIntentionIds: readonly string[]
    supportedVerbs: readonly string[]
    forbiddenVerbs: readonly string[]
  }>
  evidence: readonly Readonly<{
    source: Readonly<{ id: string; label: string }>
    semanticClaim: string
    weight: EvidenceWeight
    provenance: Readonly<{
      status: EvidenceStatus
      sourceLabel: string
      methodologyId: string
      sourceIds: readonly string[]
    }>
  }>[]
  validFromUtc: string
  boundaries: readonly SemanticBoundary[]
}>

export type GuidancePrimaryCurrent = Readonly<{
  id: Versioned<string>
  label: Versioned<string>
  condition: Versioned<GuidanceCondition | 'unavailable'>
  status: Versioned<EvidenceStatus | 'unavailable'>
  sourceLabel: Versioned<string>
}>

export type OltrOutput = Readonly<{
  text: string
  status: 'validated'
  sourceLabel: string
  version: string
}>

export type IntentionDefinition = Readonly<{
  id: string
  character: string
  pinyin: string
  englishLabel: string
  shortDefinition: string
  compatibleRelations: readonly ResponseRelation[]
  compatibleDirections: readonly GuidanceDirection[]
  compatibleLunarModes: readonly LunarMode[]
  compatibleEffortLevels: readonly EffortLevel[]
  strategicVectors: readonly StrategicVector[]
  somaticVectors: readonly SomaticVector[]
  conflicts: readonly string[]
  version: string
}>

export type IntentionSelection = Readonly<{
  definition: IntentionDefinition
  rank: 'primary' | 'alternative'
  reasons: readonly string[]
}>

export type ExecutionCategory = 'somatic' | 'task' | 'environment' | 'pause'

export type ExecutionDefinition = Readonly<{
  id: string
  category: ExecutionCategory
  text: string
  observableEndpoint: string
  actionCount: 1 | 2
  effortLevel: EffortLevel
  compatibleRelations: readonly ResponseRelation[]
  compatibleDirections: readonly GuidanceDirection[]
  compatibleIntentions: readonly string[]
  strategicVectors: readonly StrategicVector[]
  somaticVectors: readonly SomaticVector[]
  risk: 'low'
  version: string
}>

export type ExecutionSelection = Readonly<{
  definition: ExecutionDefinition
  rank: 'primary' | 'alternative'
  reasons: readonly string[]
}>

export type GuidanceBundleVersions = Readonly<{
  temporalSemantics: string
  guidanceSynthesis: string
  oltrRenderer: string
  intentionLexicon: string
  executionLibrary: string
  validator: string
}>

type GuidanceBundleBase = Readonly<{
  synthesisId: string
  validityWindow: GuidanceValidityWindow
  primaryCurrent: GuidancePrimaryCurrent
  versions: GuidanceBundleVersions
}>

export type AvailableGuidanceBundle = GuidanceBundleBase &
  Readonly<{
    status: 'available'
    synthesis: GuidanceSynthesis
    oltr: OltrOutput
    intentions: readonly IntentionSelection[]
    selectedIntention: IntentionDefinition
    executions: readonly ExecutionSelection[]
    selectedExecution: ExecutionDefinition
  }>

export type UnavailableGuidanceBundle = GuidanceBundleBase &
  Readonly<{
    status: 'unavailable'
    reason: string
    synthesis: null
    oltr: null
    intentions: readonly []
    selectedIntention: null
    executions: readonly []
    selectedExecution: null
  }>

export type GuidanceBundle = AvailableGuidanceBundle | UnavailableGuidanceBundle

export type GuidanceValidationCode =
  | 'format'
  | 'grammar'
  | 'word-count'
  | 'pronoun'
  | 'unsafe'
  | 'unsupported-claim'
  | 'incompatible-relation'
  | 'incompatible-direction'
  | 'incompatible-effort'
  | 'intention-conflict'
  | 'execution-endpoint'
  | 'execution-action-count'
  | 'repetition'
  | 'selection'

export type GuidanceValidationIssue = Readonly<{
  code: GuidanceValidationCode
  message: string
}>

export type GuidanceValidationResult = Readonly<{
  valid: boolean
  issues: readonly GuidanceValidationIssue[]
}>
