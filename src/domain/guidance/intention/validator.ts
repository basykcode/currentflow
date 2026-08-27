import type {
  GuidanceSynthesis,
  GuidanceValidationIssue,
  GuidanceValidationResult,
  IntentionDefinition,
} from '../types'

export const validateIntention = (
  definition: IntentionDefinition,
  synthesis: GuidanceSynthesis,
): GuidanceValidationResult => {
  const issues: GuidanceValidationIssue[] = []

  if (!definition.compatibleRelations.includes(synthesis.response.relation.value)) {
    issues.push({
      code: 'incompatible-relation',
      message: `${definition.englishLabel} is incompatible with ${synthesis.response.relation.value}.`,
    })
  }
  return Object.freeze({ valid: issues.length === 0, issues })
}
