import type { HexagramReference } from '@/domain/astrology/types'

export type LineNumber = 1 | 2 | 3 | 4 | 5 | 6

export type TransformationFamily =
  | 'core'
  | 'symmetry'
  | 'interior'
  | 'line-change'
  | 'textual-relation'
  | 'eight-palace'
  | 'gua-bian'
  | 'seasonal'
  | 'precelestial'
  | 'alchemy'
  | 'structure'
  | 'current-computational'

export type TransformationClass =
  'intrinsic' | 'contextual' | 'textual-relation' | 'lineage-specific' | 'current-formalization'

export type TransformationRequirement =
  | 'hexagram-only'
  | 'moving-lines'
  | 'selected-destination'
  | 'selected-lineage'
  | 'date-time'
  | 'source-table'

export type TransformationCanonicality =
  | 'widely-attested'
  | 'historically-attested'
  | 'lineage-specific'
  | 'variant'
  | 'current-formalization'
  | 'source-required'

export type TransformationDefinition = {
  id: string
  nameEnglish: string
  nameChinese?: string
  aliases: readonly string[]
  family: TransformationFamily
  transformationClass: TransformationClass
  requirement: TransformationRequirement
  provenance: {
    tradition: string
    sourceIds: readonly string[]
    canonicality: TransformationCanonicality
  }
  explanation: string
  implementationStatus: 'available' | 'source-needed' | 'planned' | 'disabled'
  resultKind: 'single-hexagram' | 'multiple-hexagrams' | 'textual-relation' | 'analysis' | 'map'
}

export type TransformationResultStatus =
  'available' | 'self-mapping' | 'source-needed' | 'not-applicable' | 'unavailable'

export type TransformationResult = {
  id: string
  sourceHexagramNumber: number
  targetHexagramNumber?: number
  definitionId: string
  status: TransformationResultStatus
  changedLines: readonly LineNumber[]
  intermediateHexagramNumbers: readonly number[]
  title: string
  explanation: string
  operationLabels: readonly string[]
  provenance: {
    tradition: string
    canonicality: TransformationCanonicality
    sourceIds: readonly string[]
  }
  interpretation: {
    status: 'available' | 'structural-only' | 'source-needed'
    summary?: string
    contentId?: string
  }
  dataStatus: 'computed' | 'source-derived' | 'current-derived' | 'unavailable'
}

export type TransformationChainStep = {
  sourceHexagramNumber: number
  targetHexagramNumber: number
  definitionId: string
  label: string
  changedLines: readonly LineNumber[]
}

export type TransformationArrivalContext = {
  sourceHexagramNumber: number
  targetHexagramNumber: number
  transformationDefinitionId: string
  transformationLabel: string
  changedLines: readonly LineNumber[]
  chain: readonly TransformationChainStep[]
}

export type TransformationLabSectionId =
  'explore' | 'change-lab' | 'interior' | 'classical-systems' | 'time-maps' | 'structure'

export type TransformationLabSort =
  'fewest-lines' | 'king-wen' | 'english-name' | 'yilin-availability'

export type TransformationLabFilters = {
  changedLineCount: 'all' | LineNumber
  specificLine: 'all' | LineNumber
  query: string
  sharesLowerTrigram: boolean
  sharesUpperTrigram: boolean
  sharesNuclearHexagram: boolean
  yilinAvailability: 'all' | 'available'
  visited: 'all' | 'visited' | 'unvisited'
  sort: TransformationLabSort
}

export type LineChangeDestination = {
  result: TransformationResult
  target: HexagramReference
  mask: number
  changedLineCount: LineNumber
  sharesLowerTrigram: boolean
  sharesUpperTrigram: boolean
  sharesNuclearHexagram: boolean
  yilinStatus: 'available' | 'not-ingested' | 'source-unavailable'
}

export const DEFAULT_TRANSFORMATION_LAB_FILTERS: TransformationLabFilters = {
  changedLineCount: 'all',
  specificLine: 'all',
  query: '',
  sharesLowerTrigram: false,
  sharesUpperTrigram: false,
  sharesNuclearHexagram: false,
  yilinAvailability: 'all',
  visited: 'all',
  sort: 'fewest-lines',
}
