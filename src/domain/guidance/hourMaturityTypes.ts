import type { MacroHour, MacroSemantic } from '@/domain/time/chu-zheng-ke'

export type SemanticEvidenceSourceKind =
  | 'temporal-hexagram'
  | 'coverage-gap'
  | 'macro-hour'
  | 'active-organ'
  | 'lunar-current'
  | 'seasonal-current'
  | 'other'

export type SemanticEvidenceInput = Readonly<{
  source: Readonly<{
    id: string
    label: string
    kind: SemanticEvidenceSourceKind
  }>
  semanticClaim: string
  weight: 'primary' | 'supporting' | 'contextual'
  provenance: Readonly<{
    status: 'verified' | 'computed' | 'partial' | 'curated' | 'demo' | 'unavailable'
    sourceLabel: string
    methodologyId: string
    sourceIds: readonly string[]
  }>
}>

export type HourMaturity = Readonly<{
  macroHour: MacroHour
  semantic: MacroSemantic
  supportedVerbs: readonly string[]
  discouragedVerbs: readonly string[]
  evidence: readonly SemanticEvidenceInput[]
  methodologyVersion: string
}>
