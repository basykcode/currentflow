import { TEMPORAL_SEMANTIC_RESOLVER_VERSION } from '../semantic-resolver/versions'

export const TEMPORAL_SEMANTICS_VERSION = TEMPORAL_SEMANTIC_RESOLVER_VERSION
export const GUIDANCE_SYNTHESIS_VERSION = 'current-guidance-synthesis@1.0.0'
export const OLTR_RENDERER_VERSION = 'current-oltr-renderer@1.0.0'
export const INTENTION_LEXICON_VERSION = 'current-intention-lexicon@1.0.0'
export const EXECUTION_LIBRARY_VERSION = 'current-execution-library@1.0.0'
export const GUIDANCE_VALIDATOR_VERSION = 'current-guidance-validator@1.0.0'

export const GUIDANCE_VERSIONS = Object.freeze({
  temporalSemantics: TEMPORAL_SEMANTICS_VERSION,
  guidanceSynthesis: GUIDANCE_SYNTHESIS_VERSION,
  oltrRenderer: OLTR_RENDERER_VERSION,
  intentionLexicon: INTENTION_LEXICON_VERSION,
  executionLibrary: EXECUTION_LIBRARY_VERSION,
  validator: GUIDANCE_VALIDATOR_VERSION,
})

export const versioned = <T>(value: T, version = GUIDANCE_SYNTHESIS_VERSION) =>
  Object.freeze({ value, version })
