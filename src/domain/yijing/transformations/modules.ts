import type { LineNumber, TransformationResult } from './types'

export type TransformationModuleStatus =
  'available' | 'source-needed' | 'planned' | 'not-applicable'

export type TransformationContext = {
  movingLines: readonly LineNumber[]
  selectedDestination?: number
}

export type TransformationModuleResult = {
  moduleId: string
  status: TransformationModuleStatus
  summary: string
  results: readonly TransformationResult[]
  sourceIds: readonly string[]
}

export interface TransformationLineageModule {
  id: string
  label: string
  tradition: string
  status: TransformationModuleStatus
  sourceIds: readonly string[]
  analyze(hexagramNumber: number, context: TransformationContext): TransformationModuleResult
}

export type SourceGatedModuleDefinition = {
  id: string
  label: string
  tradition: string
  section: 'classical-systems' | 'time-maps'
  status: Extract<TransformationModuleStatus, 'source-needed' | 'planned'>
  sourceRequirement: string
}

export const SOURCE_GATED_MODULES: readonly SourceGatedModuleDefinition[] = [
  {
    id: 'jing-fang-eight-palaces',
    label: 'Jing Fang Eight Palaces',
    tradition: 'Jing Fang lineage',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'A verified 64-record palace and generation-stage table.',
  },
  {
    id: 'wandering-returning-soul',
    label: 'Wandering / Returning Soul',
    tradition: 'Jing Fang lineage',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'Verified Eight-Palace ancestry and stage records.',
  },
  {
    id: 'host-response',
    label: 'Host and Response',
    tradition: 'Jing Fang lineage',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'A sourced palace-stage host/responding-line rule table.',
  },
  {
    id: 'na-jia',
    label: 'Na Jia',
    tradition: 'Han image-number',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'A lineage-identified stem, branch, and line assignment table.',
  },
  {
    id: 'gua-bian',
    label: 'Gua Bian Lineages',
    tradition: 'Variant / disputed',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'Complete verified Zhu Xi, Yu Fan, Li Zhicai, or Xun Shuang tables.',
  },
  {
    id: 'flying-hidden',
    label: 'Flying and Hidden',
    tradition: 'Jing Fang lineage',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'Verified Eight-Palace ancestry and method-specific line assignments.',
  },
  {
    id: 'enveloping-body',
    label: 'Enveloping Body',
    tradition: 'Variant / disputed',
    section: 'classical-systems',
    status: 'source-needed',
    sourceRequirement: 'Method-specific constructions with lineage and source locators.',
  },
  {
    id: 'twelve-message-hexagrams',
    label: 'Twelve Message Hexagrams',
    tradition: 'Han image-number',
    section: 'time-maps',
    status: 'source-needed',
    sourceRequirement: 'A verified membership, sequence, phase, and correspondence table.',
  },
  {
    id: 'gua-qi-position',
    label: 'Gua-Qi Position',
    tradition: 'Han image-number',
    section: 'time-maps',
    status: 'source-needed',
    sourceRequirement: 'A complete verified hexagram-to-phase/position registry.',
  },
  {
    id: 'shao-yong-precelestial',
    label: 'Shao Yong Precelestial Order',
    tradition: 'Song image-number',
    section: 'time-maps',
    status: 'source-needed',
    sourceRequirement: 'A verified circle/square ordering with attribution notes.',
  },
  {
    id: 'lunar-phase-trigrams',
    label: 'Lunar-Phase Trigram Correspondences',
    tradition: 'Variant / source-specific',
    section: 'time-maps',
    status: 'source-needed',
    sourceRequirement: 'A verified phase-to-trigram table with convention and edition notes.',
  },
  {
    id: 'cantong-qi',
    label: 'Cantong Qi Overlay',
    tradition: 'Daoist alchemical',
    section: 'time-maps',
    status: 'source-needed',
    sourceRequirement: 'Reviewed claims from the project’s licensed alchemical corpus.',
  },
] as const

export type YilinTransition = {
  fromHexagram: number
  toHexagram: number
  summary: string
  originalChinese?: string
  sourceId: string
  sourceLocator: string
  displayPolicy: 'summary-only' | 'original-and-summary'
  evidenceStatus: 'reviewed' | 'provisional'
}

export interface YilinTransitionRepository {
  getTransition(fromHexagram: number, toHexagram: number): Promise<YilinTransition | null>
}

export const YILIN_INTEGRATION_STATUS = {
  status: 'source-needed',
  label: 'Jiaoshi Yilin transitions',
  explanation:
    'No reviewed 64 × 64 transition repository is connected. Current does not generate replacement verses.',
} as const

export type ReadingConvention = {
  id: 'direct-moving-lines' | 'zhu-xi-song'
  label: string
  status: 'available' | 'source-needed'
  sourceIds: readonly string[]
  explanation: string
}

export const READING_CONVENTIONS: readonly ReadingConvention[] = [
  {
    id: 'direct-moving-lines',
    label: 'Direct Moving Lines',
    status: 'available',
    sourceIds: ['docs:YIJING_TRANSFORMATIONS'],
    explanation: 'Shows the selected line positions without changing the structural target.',
  },
  {
    id: 'zhu-xi-song',
    label: 'Zhu Xi / Song Convention',
    status: 'source-needed',
    sourceIds: [],
    explanation: 'A verified 0–6 moving-line text-priority rule table is not connected.',
  },
]

export type EightPalaceStage =
  | 'palace-root'
  | 'first-generation'
  | 'second-generation'
  | 'third-generation'
  | 'fourth-generation'
  | 'fifth-generation'
  | 'wandering-soul'
  | 'returning-soul'

export type EightPalaceRecord = {
  hexagramNumber: number
  palaceRootHexagramNumber: number
  stage: EightPalaceStage
  hostLine: LineNumber
  respondingLine: LineNumber
  sourceId: string
}
