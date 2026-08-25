import type {
  ExecutionDefinition,
  GuidanceSynthesis,
  GuidanceValidationIssue,
  GuidanceValidationResult,
  IntentionDefinition,
} from '../types'
import { effortDoesNotExceed } from '../synthesis/effortResolver'
import { containsUnsafeGuidance, containsUnsupportedGuidanceClaim } from '../oltr/validator'

const HIGH_STAKES_PATTERN =
  /\b(?:medical|diagnos(?:e|is)|treatment|medication|dose|legal|lawsuit|contract signing|financial|invest(?:ment|ing)?|loan|mortgage|surgery|emergency)\b/i

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export const validateExecution = (
  definition: ExecutionDefinition,
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  oltrText = '',
): GuidanceValidationResult => {
  const issues: GuidanceValidationIssue[] = []
  const directions = [
    synthesis.field.primaryDirection.value,
    synthesis.field.secondaryDirection.value,
  ] as const

  if (!definition.observableEndpoint.trim()) {
    issues.push({
      code: 'execution-endpoint',
      message: 'Execution requires an observable endpoint.',
    })
  }
  if (definition.actionCount > 2) {
    issues.push({
      code: 'execution-action-count',
      message: 'Execution may contain at most two actions.',
    })
  }
  if (!effortDoesNotExceed(definition.effortLevel, synthesis.response.effortLevel.value)) {
    issues.push({
      code: 'incompatible-effort',
      message: 'Execution exceeds the resolved effort level.',
    })
  }
  if (!definition.compatibleRelations.includes(synthesis.response.relation.value)) {
    issues.push({
      code: 'incompatible-relation',
      message: 'Execution contradicts the resolved response relation.',
    })
  }
  if (!directions.some((direction) => definition.compatibleDirections.includes(direction))) {
    issues.push({
      code: 'incompatible-direction',
      message: 'Execution contradicts the resolved field direction.',
    })
  }
  if (!definition.compatibleIntentions.includes(intention.id)) {
    issues.push({
      code: 'intention-conflict',
      message: 'Execution contradicts the selected intention.',
    })
  }
  if (
    synthesis.response.forbiddenVerbs.value.some((verb) =>
      new RegExp(`\\b${verb}\\b`, 'i').test(definition.text),
    )
  ) {
    issues.push({
      code: 'incompatible-relation',
      message: 'Execution uses a verb forbidden by the response relation.',
    })
  }
  if (
    definition.risk !== 'low' ||
    containsUnsafeGuidance(definition.text) ||
    HIGH_STAKES_PATTERN.test(definition.text)
  ) {
    issues.push({ code: 'unsafe', message: 'Execution is unsafe or high stakes.' })
  }
  if (containsUnsupportedGuidanceClaim(definition.text)) {
    issues.push({ code: 'unsupported-claim', message: 'Execution contains an unsupported claim.' })
  }
  if (oltrText && normalize(definition.text) === normalize(oltrText)) {
    issues.push({ code: 'repetition', message: 'Execution merely repeats the OLTR.' })
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
