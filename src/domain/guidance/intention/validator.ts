import type {
  GuidanceSynthesis,
  GuidanceValidationIssue,
  GuidanceValidationResult,
  IntentionDefinition,
} from '../types'

const includesEitherDirection = (definition: IntentionDefinition, synthesis: GuidanceSynthesis) =>
  definition.compatibleDirections.includes(synthesis.field.primaryDirection.value) ||
  definition.compatibleDirections.includes(synthesis.field.secondaryDirection.value)

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
  if (!includesEitherDirection(definition, synthesis)) {
    issues.push({
      code: 'incompatible-direction',
      message: `${definition.englishLabel} is incompatible with the resolved directions.`,
    })
  }
  if (!definition.compatibleLunarModes.includes(synthesis.field.lunarMode.value)) {
    issues.push({
      code: 'incompatible-direction',
      message: `${definition.englishLabel} is incompatible with the resolved lunar mode.`,
    })
  }
  if (!definition.compatibleEffortLevels.includes(synthesis.response.effortLevel.value)) {
    issues.push({
      code: 'incompatible-effort',
      message: `${definition.englishLabel} is incompatible with the resolved effort level.`,
    })
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
