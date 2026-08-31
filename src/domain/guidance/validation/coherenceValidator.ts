import type { GuidanceBundle, GuidanceValidationIssue, GuidanceValidationResult } from '../types'
import { validateExecution } from '../execution/validator'
import { validateIntention } from '../intention/validator'
import {
  containsUnsafeGuidance,
  containsUnsupportedGuidanceClaim,
  validateOltr,
} from '../oltr/validator'
import { GUIDANCE_VERSIONS } from '../synthesis/semanticVersion'

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

const hasActiveVersionManifest = (bundle: GuidanceBundle) =>
  bundle.versions.temporalSemantics === GUIDANCE_VERSIONS.temporalSemantics &&
  bundle.versions.environment === GUIDANCE_VERSIONS.environment &&
  bundle.versions.guidanceSynthesis === GUIDANCE_VERSIONS.guidanceSynthesis &&
  bundle.versions.oltrRenderer === GUIDANCE_VERSIONS.oltrRenderer &&
  bundle.versions.intentionLexicon === GUIDANCE_VERSIONS.intentionLexicon &&
  bundle.versions.executionLibrary === GUIDANCE_VERSIONS.executionLibrary &&
  bundle.versions.validator === GUIDANCE_VERSIONS.validator

export const validateGuidanceBundle = (bundle: GuidanceBundle): GuidanceValidationResult => {
  const issues: GuidanceValidationIssue[] = []
  if (!hasActiveVersionManifest(bundle)) {
    issues.push({
      code: 'version-mismatch',
      message: 'Guidance bundle does not use the active version manifest.',
    })
  }

  if (bundle.status === 'unavailable') {
    const unavailablePrimaryVersions = [
      bundle.primaryCurrent.id,
      bundle.primaryCurrent.label,
      bundle.primaryCurrent.condition,
      bundle.primaryCurrent.status,
      bundle.primaryCurrent.sourceLabel,
    ] as const
    if (
      unavailablePrimaryVersions.some(
        (versionedValue) => versionedValue.version !== bundle.versions.temporalSemantics,
      )
    ) {
      issues.push({
        code: 'version-mismatch',
        message: 'Unavailable guidance Primary Current versions do not match the manifest.',
      })
    }
    if (
      bundle.synthesis !== null ||
      bundle.oltr !== null ||
      bundle.intentions.length !== 0 ||
      bundle.selectedIntention !== null ||
      bundle.executions.length !== 0 ||
      bundle.selectedExecution !== null ||
      bundle.primaryCurrent.status.value !== 'unavailable'
    ) {
      issues.push({
        code: 'unavailable-structure',
        message: 'Unavailable guidance must not retain generated output or selections.',
      })
    }
    return Object.freeze({ valid: issues.length === 0, issues })
  }

  issues.push(
    ...validateOltr(bundle.oltr.text, bundle.synthesis.response.supportedVerbs.value).issues,
  )

  const intentionRanks = bundle.intentions.map((selection) => selection.rank)
  if (
    bundle.intentions.length !== 3 ||
    new Set(bundle.intentions.map((selection) => selection.definition.id)).size !== 3 ||
    intentionRanks.join(',') !== '1,2,3'
  ) {
    issues.push({
      code: 'selection',
      message: 'Available guidance requires exactly three uniquely ranked intentions.',
    })
  }

  const selectedIntentionIsRanked = bundle.intentions.some(
    (selection) => selection.definition === bundle.selectedIntention,
  )
  if (!selectedIntentionIsRanked) {
    issues.push({ code: 'selection', message: 'Selected intention is absent from the ranked set.' })
  }
  for (const selection of bundle.intentions) {
    issues.push(...validateIntention(selection.definition, bundle.synthesis).issues)
  }

  const selectedExecutionIsRanked = bundle.executions.some(
    (selection) => selection.definition === bundle.selectedExecution,
  )
  if (!selectedExecutionIsRanked) {
    issues.push({ code: 'selection', message: 'Selected execution is absent from the ranked set.' })
  }
  const executionRanks = bundle.executions.map((selection) => selection.rank)
  if (
    bundle.executions.length !== 3 ||
    new Set(bundle.executions.map((selection) => selection.definition.id)).size !== 3 ||
    new Set(bundle.executions.map((selection) => selection.definition.category)).size !== 3 ||
    executionRanks.join(',') !== '1,2,3'
  ) {
    issues.push({
      code: 'execution-cardinality',
      message: 'Available guidance requires exactly three uniquely ranked Elemental domains.',
    })
  }
  const activeElement = bundle.synthesis.operativeWork.activeOrgan.value.element
  if (!bundle.executions.some((selection) => selection.definition.category === activeElement)) {
    issues.push({
      code: 'active-organ-coverage',
      message: `Execution ranking does not represent the active ${activeElement} correspondence.`,
    })
  }
  for (const selection of bundle.executions) {
    const expectedActiveOrganMatch = selection.definition.category === activeElement
    if (selection.activeOrganMatch !== expectedActiveOrganMatch) {
      issues.push({
        code: 'active-organ-coverage',
        message: `Execution domain ${selection.definition.id} has an inconsistent active-organ marker.`,
      })
    }
    if (
      selection.inclusionBasis === 'active-organ-coverage' &&
      (!expectedActiveOrganMatch || selection.rank !== 3)
    ) {
      issues.push({
        code: 'active-organ-coverage',
        message: `Execution domain ${selection.definition.id} has an inconsistent active-organ inclusion basis.`,
      })
    }
    issues.push(
      ...validateExecution(
        selection.definition,
        bundle.synthesis,
        bundle.selectedIntention,
        bundle.oltr.text,
      ).issues,
    )
  }

  const missingProfiles = bundle.synthesis.missingProfileNumbers.value
  const coverage = bundle.synthesis.coverage.value
  if (
    (coverage === 'complete' && missingProfiles.length !== 0) ||
    (coverage === 'partial' && missingProfiles.length === 0) ||
    new Set(missingProfiles).size !== missingProfiles.length ||
    missingProfiles.some(
      (hexagramNumber) =>
        !Number.isInteger(hexagramNumber) || hexagramNumber < 1 || hexagramNumber > 64,
    )
  ) {
    issues.push({
      code: 'coverage',
      message: 'Guidance profile coverage is inconsistent with its missing-profile record.',
    })
  }

  const outputTexts = [
    bundle.oltr.text,
    bundle.selectedIntention.shortDefinition,
    bundle.selectedExecution.description,
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

  const temporalVersionedValues = [
    bundle.primaryCurrent.id,
    bundle.primaryCurrent.label,
    bundle.primaryCurrent.condition,
    bundle.primaryCurrent.status,
    bundle.primaryCurrent.sourceLabel,
    bundle.synthesis.coverage,
    bundle.synthesis.missingProfileNumbers,
    bundle.synthesis.conflicts,
    bundle.synthesis.condition,
    bundle.synthesis.field.primaryDirection,
    bundle.synthesis.field.secondaryDirection,
    bundle.synthesis.field.dominantTexture,
    bundle.synthesis.field.lunarMode,
    bundle.synthesis.field.fieldRelationship,
    bundle.synthesis.field.dominantImageFamily,
    bundle.synthesis.field.tensionDescription,
    bundle.synthesis.operativeWork.dayTheme,
    bundle.synthesis.operativeWork.hourTheme,
    bundle.synthesis.operativeWork.hourMaturity,
    bundle.synthesis.response.relation,
    bundle.synthesis.response.strategicVectors,
    bundle.synthesis.response.somaticVectors,
    bundle.synthesis.response.effortLevel,
    bundle.synthesis.response.compatibleIntentionIds,
    bundle.synthesis.response.supportedVerbs,
    bundle.synthesis.response.forbiddenVerbs,
  ] as const
  const synthesisVersionedValues = [
    bundle.synthesis.id,
    bundle.synthesis.operativeWork.backgroundThemes,
    bundle.synthesis.response.completion,
    bundle.synthesis.response.initiation,
    bundle.synthesis.response.containment,
    bundle.synthesis.response.release,
    bundle.synthesis.evidence,
  ] as const
  const evidenceVersionsMatch = bundle.synthesis.evidence.value.every(
    (item) =>
      item.source.version === bundle.versions.guidanceSynthesis &&
      item.semanticClaim.version === bundle.versions.guidanceSynthesis &&
      item.weight.version === bundle.versions.guidanceSynthesis &&
      item.provenance.version === bundle.versions.guidanceSynthesis,
  )
  const versionsMatch =
    hasActiveVersionManifest(bundle) &&
    bundle.oltr.version === bundle.versions.oltrRenderer &&
    bundle.intentions.every(
      (selection) => selection.definition.version === bundle.versions.intentionLexicon,
    ) &&
    bundle.executions.every(
      (selection) => selection.definition.version === bundle.versions.executionLibrary,
    ) &&
    bundle.synthesis.version === bundle.versions.guidanceSynthesis &&
    bundle.synthesis.sourceSemanticVersion === bundle.versions.temporalSemantics &&
    bundle.synthesis.environmentVersion === bundle.versions.environment &&
    bundle.synthesis.operativeWork.activeOrgan.version === bundle.versions.environment &&
    bundle.synthesis.operativeWork.activeOrgan.value.methodologyId ===
      bundle.versions.environment &&
    temporalVersionedValues.every(
      (versionedValue) => versionedValue.version === bundle.versions.temporalSemantics,
    ) &&
    synthesisVersionedValues.every(
      (versionedValue) => versionedValue.version === bundle.versions.guidanceSynthesis,
    ) &&
    evidenceVersionsMatch

  if (!versionsMatch) {
    issues.push({
      code: 'version-mismatch',
      message: 'Guidance outputs do not agree with the bundle version manifest.',
    })
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
