import type { GuidanceBundle, GuidanceValidationIssue, GuidanceValidationResult } from '../types'
import { validateExecution } from '../execution/validator'
import { validateIntention } from '../intention/validator'
import {
  containsUnsafeGuidance,
  containsUnsupportedGuidanceClaim,
  validateOltr,
} from '../oltr/validator'

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const hasRepeatedOutput = (values: readonly string[]) => {
  const normalized = values.map(normalize).filter(Boolean)
  return new Set(normalized).size !== normalized.length
}

export const validateGuidanceBundle = (bundle: GuidanceBundle): GuidanceValidationResult => {
  if (bundle.status === 'unavailable') {
    return Object.freeze({ valid: true, issues: [] })
  }

  const issues: GuidanceValidationIssue[] = []
  issues.push(
    ...validateOltr(bundle.oltr.text, bundle.synthesis.response.supportedVerbs.value).issues,
  )

  const selectedIntentionIsRanked = bundle.intentions.some(
    (selection) => selection.definition.id === bundle.selectedIntention.id,
  )
  if (!selectedIntentionIsRanked) {
    issues.push({ code: 'selection', message: 'Selected intention is absent from the ranked set.' })
  }
  if (
    !bundle.synthesis.response.compatibleIntentionIds.value.includes(bundle.selectedIntention.id)
  ) {
    issues.push({
      code: 'selection',
      message: 'Selected intention is outside the resolver-approved intention set.',
    })
  }
  issues.push(...validateIntention(bundle.selectedIntention, bundle.synthesis).issues)

  const selectedExecutionIsRanked = bundle.executions.some(
    (selection) => selection.definition.id === bundle.selectedExecution.id,
  )
  if (!selectedExecutionIsRanked) {
    issues.push({ code: 'selection', message: 'Selected execution is absent from the ranked set.' })
  }
  for (const selection of bundle.executions) {
    issues.push(
      ...validateExecution(
        selection.definition,
        bundle.synthesis,
        bundle.selectedIntention,
        bundle.oltr.text,
      ).issues,
    )
  }

  const outputTexts = [
    bundle.oltr.text,
    bundle.selectedIntention.shortDefinition,
    bundle.selectedExecution.text,
  ]
  if (hasRepeatedOutput(outputTexts)) {
    issues.push({ code: 'repetition', message: 'Guidance outputs repeat the same sentence.' })
  }

  if (outputTexts.some(containsUnsupportedGuidanceClaim)) {
    issues.push({ code: 'unsupported-claim', message: 'Guidance contains an unsupported claim.' })
  }
  if (outputTexts.some(containsUnsafeGuidance)) {
    issues.push({ code: 'unsafe', message: 'Guidance contains unsafe instructions.' })
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
