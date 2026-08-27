import type {
  EffortLevel as ResolverEffortLevel,
  ResponseRelation as ResolverResponseRelation,
  SemanticConflict as ResolverSemanticConflict,
} from './semantic-resolver/types'
import type { FiveElement, OrganKey } from '@/domain/astrology/types'
import type { MacroSemantic } from '@/domain/time/chu-zheng-ke'
import type {
  HourMaturity,
  SemanticEvidenceInput,
  SemanticEvidenceSourceKind,
} from './hourMaturityTypes'

export type {
  HourMaturity,
  SemanticEvidenceInput,
  SemanticEvidenceSourceKind,
} from './hourMaturityTypes'

export type EffortLevel = ResolverEffortLevel
export type ResponseRelation = ResolverResponseRelation
export type GuidanceSemanticConflict = ResolverSemanticConflict
export type GuidanceCoverage = 'complete' | 'partial'

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

export type BackgroundThemeKind =
  'temporal-year' | 'temporal-month' | 'lunar-current' | 'seasonal-current' | 'other'

export type GuidanceElement = FiveElement

export type ActiveOrganGuidance = Readonly<{
  key: OrganKey
  nameEnglish: string
  nameChinese?: string
  element: GuidanceElement
  sourceLabel: string
  methodologyId: string
}>

export type BackgroundTheme = SemanticTheme &
  Readonly<{
    kind: BackgroundThemeKind
  }>

export type EvidenceWeight = 'primary' | 'supporting' | 'contextual'

export type EvidenceStatus =
  'verified' | 'computed' | 'partial' | 'curated' | 'demo' | 'unavailable'

export type GuidanceEvidence = Readonly<{
  source: Versioned<Readonly<{ id: string; label: string; kind: SemanticEvidenceSourceKind }>>
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
  version: string
  sourceSemanticVersion: string
  environmentVersion: string
  id: Versioned<string>
  coverage: Versioned<GuidanceCoverage>
  missingProfileNumbers: Versioned<readonly number[]>
  conflicts: Versioned<readonly GuidanceSemanticConflict[]>
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
    hourTheme: Versioned<SemanticTheme>
    hourMaturity: Versioned<HourMaturity>
    backgroundThemes: Versioned<readonly BackgroundTheme[]>
    activeOrgan: Versioned<ActiveOrganGuidance>
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
  | 'macro-hour-change'
  | 'shichen-change'
  | 'lunar-node-change'
  | 'solar-term-boundary'
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

export type GuidanceEnvironmentInput = Readonly<{
  version: string
  activeOrgan: ActiveOrganGuidance
  lunarMode?: LunarMode
  secondaryDirection?: GuidanceDirection
  backgroundThemes?: readonly BackgroundThemeInput[]
  evidence?: readonly SemanticEvidenceInput[]
}>

export type GuidanceSemanticInput = Readonly<{
  synthesisId: string
  semanticVersion: string
  environmentVersion: string
  coverage: GuidanceCoverage
  missingProfileNumbers: readonly number[]
  conflicts: readonly GuidanceSemanticConflict[]
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
    hourTheme: SemanticThemeInput
    hourMaturity: HourMaturity
    backgroundThemes: readonly BackgroundThemeInput[]
    activeOrgan: ActiveOrganGuidance
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
  evidence: readonly SemanticEvidenceInput[]
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
  rank: 1 | 2 | 3
  reasons: readonly string[]
}>

export type ElementalSpirit = Readonly<{
  character: '魂' | '神' | '意' | '魄' | '志'
  pinyin: 'Hún' | 'Shén' | 'Yì' | 'Pò' | 'Zhì'
  classicalGloss: string
  zangCorrespondence: Extract<OrganKey, 'liver' | 'heart' | 'spleen' | 'lung' | 'kidney'>
}>

export type ExecutionCategory = GuidanceElement

export type ExecutionDefinition = Readonly<{
  id: string
  category: ExecutionCategory
  elementCharacter: '木' | '火' | '土' | '金' | '水'
  elementPinyin: 'Mù' | 'Huǒ' | 'Tǔ' | 'Jīn' | 'Shuǐ'
  title: string
  spirit: ElementalSpirit
  description: string
  taskDomains: readonly [string, string, string, string, string]
  relationAffinities: readonly ResponseRelation[]
  directionAffinities: readonly GuidanceDirection[]
  intentionAffinities: readonly string[]
  strategicVectorAffinities: readonly StrategicVector[]
  somaticVectorAffinities: readonly SomaticVector[]
  macroAffinities: readonly MacroSemantic[]
  scope: 'ordinary-work-domain'
  formalization: 'current'
  sourceLabel: string
  sourceUrls: readonly string[]
  version: string
}>

export type ExecutionSelection = Readonly<{
  definition: ExecutionDefinition
  rank: 1 | 2 | 3
  activeOrganMatch: boolean
  inclusionBasis: 'semantic-rank' | 'active-organ-coverage'
  reasons: readonly string[]
}>

export type GuidanceBundleVersions = Readonly<{
  temporalSemantics: string
  environment: string
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
  | 'execution-cardinality'
  | 'active-organ-coverage'
  | 'coverage'
  | 'version-mismatch'
  | 'unavailable-structure'
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
