export type SchoolId =
  | 'daoist'
  | 'buddhist'
  | 'confucian'
  | 'psychological'
  | 'human-design'
  | 'gene-keys'

export type EvidenceMode =
  | 'multi-source-direct'
  | 'single-source-direct'
  | 'direct-plus-framework'
  | 'framework-applied'
  | 'insufficient'

export type PublicationEligibility =
  | 'publishable'
  | 'draft-only'
  | 'internal-only'
  | 'blocked'

export type CommentaryReviewStatus =
  | 'generated'
  | 'qa-passed'
  | 'human-approved'
  | 'needs-revision'
  | 'blocked'

export type CommentarySourceAttribution = {
  sourceId: string
  title: string
  contributors: readonly string[]
  contribution: 'primary' | 'supporting' | 'framework' | 'contrasting'
  evidenceMode:
    | 'direct'
    | 'direct-plus-framework'
    | 'framework-applied'
    | 'secondary-only'
    | 'insufficient'
  locatorCount: number
  chunkIds: readonly string[]
}

export type SchoolHexagramSummary = {
  schemaVersion: string
  contentVersion: string
  hexagramNumber: number
  schoolId: SchoolId
  essence: string
  summary: string
  sourceTensionNote?: string
  evidenceMode: EvidenceMode
  sourcesUsed: readonly CommentarySourceAttribution[]
  sentenceSupport: readonly {
    sentenceIndex: number
    supportingChunkIds: readonly string[]
  }[]
  coverage: {
    registeredSourceCount: number
    contributingSourceCount: number
    directSourceCount: number
    chunkCount: number
  }
  rights: {
    publicationEligibility: PublicationEligibility
    quotationIncluded: boolean
  }
  review: {
    status: CommentaryReviewStatus
    issues: readonly string[]
  }
  generation: {
    generatorKind: 'codex-assisted'
    promptVersion: string
    generatedAtIso: string
    sourceDigest: string
    repositoryCommit?: string
  }
}

export type AvailableHexagramCommentarySet = {
  status: 'available'
  schemaVersion: string
  contentVersion: string
  hexagramNumber: number
  summaries: readonly SchoolHexagramSummary[]
}

export type UnavailableHexagramCommentarySet = {
  status: 'unavailable'
  hexagramNumber: number
  reason: string
  summaries: readonly []
}

export type HexagramCommentarySet =
  | AvailableHexagramCommentarySet
  | UnavailableHexagramCommentarySet

export type SchoolDescriptor = {
  id: SchoolId
  displayLabel: string
  description: string
  classification: 'classical' | 'modern' | 'modern-system'
  defaultDisplayOrder: number
}

export interface HexagramCommentaryRepository {
  getHexagramCommentaries(hexagramNumber: number): Promise<HexagramCommentarySet>
  getSchoolSummary(
    hexagramNumber: number,
    schoolId: SchoolId,
  ): Promise<SchoolHexagramSummary | null>
}
