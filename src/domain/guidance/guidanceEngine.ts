import type {
  AvailableGuidanceBundle,
  ExecutionCategory,
  GuidanceBundle,
  GuidancePrimaryCurrent,
  GuidanceSemanticInput,
  SemanticBoundary,
  UnavailableGuidanceBundle,
} from './types'
import { selectExecutions } from './execution/selector'
import { selectIntentions } from './intention/selector'
import { renderOltr } from './oltr/renderer'
import { resolveGuidanceSynthesis } from './synthesis/guidanceResolver'
import {
  GUIDANCE_VERSIONS,
  TEMPORAL_SEMANTICS_VERSION,
  versioned,
} from './synthesis/semanticVersion'
import { resolveValidityWindow } from './synthesis/validityWindow'
import { validateGuidanceBundle } from './validation/coherenceValidator'

const assertValidBundle = (bundle: GuidanceBundle) => {
  const validation = validateGuidanceBundle(bundle)
  if (!validation.valid) {
    throw new Error(
      `Guidance bundle failed coherence validation: ${validation.issues.map((issue) => issue.message).join(' ')}`,
    )
  }
}

const createPrimaryCurrent = (input: GuidanceSemanticInput): GuidancePrimaryCurrent =>
  Object.freeze({
    id: versioned(input.primaryCurrent.id, input.semanticVersion),
    label: versioned(input.primaryCurrent.label, input.semanticVersion),
    condition: versioned(input.condition, input.semanticVersion),
    status: versioned(input.primaryCurrent.status, input.semanticVersion),
    sourceLabel: versioned(input.primaryCurrent.sourceLabel, input.semanticVersion),
  })

export const createGuidanceBundle = (input: GuidanceSemanticInput): AvailableGuidanceBundle => {
  const synthesis = resolveGuidanceSynthesis(input)
  const oltr = renderOltr(synthesis)
  const intentions = selectIntentions(synthesis)
  const selectedIntention = intentions[0]?.definition
  if (!selectedIntention) throw new Error('Guidance requires a selected intention.')
  const executions = selectExecutions(synthesis, selectedIntention, oltr.text)
  const selectedExecution = executions[0]?.definition
  if (!selectedExecution) throw new Error('Guidance requires a selected execution.')

  const bundle: AvailableGuidanceBundle = Object.freeze({
    status: 'available',
    synthesisId: input.synthesisId,
    validityWindow: resolveValidityWindow(input.validFromUtc, input.boundaries),
    primaryCurrent: createPrimaryCurrent(input),
    synthesis,
    oltr,
    intentions,
    selectedIntention,
    executions,
    selectedExecution,
    versions: GUIDANCE_VERSIONS,
  })
  assertValidBundle(bundle)
  return bundle
}

export type UnavailableGuidanceInput = Readonly<{
  synthesisId: string
  validFromUtc: string
  boundaries: readonly SemanticBoundary[]
  reason: string
  sourceLabel: string
}>

export const createUnavailableGuidanceBundle = (
  input: UnavailableGuidanceInput,
): UnavailableGuidanceBundle => {
  const primaryCurrent: GuidancePrimaryCurrent = Object.freeze({
    id: versioned('unavailable', TEMPORAL_SEMANTICS_VERSION),
    label: versioned('Primary Current unavailable', TEMPORAL_SEMANTICS_VERSION),
    condition: versioned<'unavailable'>('unavailable', TEMPORAL_SEMANTICS_VERSION),
    status: versioned<'unavailable'>('unavailable', TEMPORAL_SEMANTICS_VERSION),
    sourceLabel: versioned(input.sourceLabel, TEMPORAL_SEMANTICS_VERSION),
  })
  const bundle: UnavailableGuidanceBundle = Object.freeze({
    status: 'unavailable',
    synthesisId: input.synthesisId,
    validityWindow: resolveValidityWindow(input.validFromUtc, input.boundaries),
    primaryCurrent,
    reason: input.reason,
    synthesis: null,
    oltr: null,
    intentions: [] as const,
    selectedIntention: null,
    executions: [] as const,
    selectedExecution: null,
    versions: GUIDANCE_VERSIONS,
  })
  assertValidBundle(bundle)
  return bundle
}

export const selectGuidanceIntention = (
  bundle: GuidanceBundle,
  intentionId: string,
): GuidanceBundle => {
  if (bundle.status === 'unavailable') return bundle
  const selectedIntention = bundle.intentions.find(
    (selection) => selection.definition.id === intentionId,
  )?.definition
  if (!selectedIntention) throw new Error(`Unknown ranked intention: ${intentionId}`)
  const executions = selectExecutions(bundle.synthesis, selectedIntention, bundle.oltr.text)
  const selectedExecution = executions[0]?.definition
  if (!selectedExecution) throw new Error('Guidance requires a selected execution.')
  const updated: AvailableGuidanceBundle = Object.freeze({
    ...bundle,
    selectedIntention,
    executions,
    selectedExecution,
  })
  assertValidBundle(updated)
  return updated
}

export const rerankGuidanceExecutions = (
  bundle: GuidanceBundle,
  preferredCategory?: ExecutionCategory,
): GuidanceBundle => {
  if (bundle.status === 'unavailable') return bundle
  const executions = selectExecutions(
    bundle.synthesis,
    bundle.selectedIntention,
    bundle.oltr.text,
    preferredCategory,
  )
  const selectedExecution = executions[0]?.definition
  if (!selectedExecution) throw new Error('Guidance requires a selected execution.')
  const updated: AvailableGuidanceBundle = Object.freeze({
    ...bundle,
    executions,
    selectedExecution,
  })
  assertValidBundle(updated)
  return updated
}
