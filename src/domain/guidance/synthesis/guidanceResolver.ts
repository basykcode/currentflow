import type { GuidanceEvidence, GuidanceSemanticInput, GuidanceSynthesis } from '../types'
import { GuidanceConstructionError } from '../errors'
import { resolveGuidanceProfiles } from './effortResolver'
import { resolveResponseRelation } from './responseRelation'
import { GUIDANCE_SYNTHESIS_VERSION, versioned } from './semanticVersion'

const resolveEvidence = (input: GuidanceSemanticInput): readonly GuidanceEvidence[] =>
  input.evidence.map((item) => ({
    source: versioned(item.source, GUIDANCE_SYNTHESIS_VERSION),
    semanticClaim: versioned(item.semanticClaim, GUIDANCE_SYNTHESIS_VERSION),
    weight: versioned(item.weight, GUIDANCE_SYNTHESIS_VERSION),
    provenance: versioned(item.provenance, GUIDANCE_SYNTHESIS_VERSION),
  }))

export const resolveGuidanceSynthesis = (input: GuidanceSemanticInput): GuidanceSynthesis => {
  if (!input.semanticVersion || !input.environmentVersion) {
    throw new GuidanceConstructionError(
      'Guidance synthesis requires explicit semantic and environment versions.',
    )
  }
  const expectedRelation = resolveResponseRelation(input.condition)
  if (input.resolvedResponse.relation !== expectedRelation) {
    throw new GuidanceConstructionError(
      `Resolved response ${input.resolvedResponse.relation} is inconsistent with ${input.condition}.`,
    )
  }
  const profiles = resolveGuidanceProfiles(input.condition)
  const semanticVersion = input.semanticVersion

  return Object.freeze({
    version: GUIDANCE_SYNTHESIS_VERSION,
    sourceSemanticVersion: semanticVersion,
    environmentVersion: input.environmentVersion,
    id: versioned(input.synthesisId, GUIDANCE_SYNTHESIS_VERSION),
    coverage: versioned(input.coverage, semanticVersion),
    missingProfileNumbers: versioned(input.missingProfileNumbers, semanticVersion),
    conflicts: versioned(input.conflicts, semanticVersion),
    condition: versioned(input.condition, semanticVersion),
    field: {
      primaryDirection: versioned(input.field.primaryDirection, semanticVersion),
      secondaryDirection: versioned(input.field.secondaryDirection, semanticVersion),
      dominantTexture: versioned(input.field.dominantTexture, semanticVersion),
      lunarMode: versioned(input.field.lunarMode, semanticVersion),
      fieldRelationship: versioned(input.field.fieldRelationship, semanticVersion),
      dominantImageFamily: versioned(input.field.dominantImageFamily, semanticVersion),
      tensionDescription: versioned(input.field.tensionDescription, semanticVersion),
    },
    operativeWork: {
      dayTheme: versioned(input.operativeWork.dayTheme, semanticVersion),
      hourTheme: versioned(input.operativeWork.hourTheme, semanticVersion),
      hourMaturity: versioned(input.operativeWork.hourMaturity, semanticVersion),
      backgroundThemes: versioned(input.operativeWork.backgroundThemes, GUIDANCE_SYNTHESIS_VERSION),
      activeOrgan: versioned(input.operativeWork.activeOrgan, input.environmentVersion),
    },
    response: {
      relation: versioned(input.resolvedResponse.relation, semanticVersion),
      strategicVectors: versioned(input.resolvedResponse.strategicVectors, semanticVersion),
      somaticVectors: versioned(input.resolvedResponse.somaticVectors, semanticVersion),
      effortLevel: versioned(input.resolvedResponse.effortLevel, semanticVersion),
      compatibleIntentionIds: versioned(
        input.resolvedResponse.compatibleIntentionIds,
        semanticVersion,
      ),
      supportedVerbs: versioned(input.resolvedResponse.supportedVerbs, semanticVersion),
      forbiddenVerbs: versioned(input.resolvedResponse.forbiddenVerbs, semanticVersion),
      completion: versioned(profiles.completion, GUIDANCE_SYNTHESIS_VERSION),
      initiation: versioned(profiles.initiation, GUIDANCE_SYNTHESIS_VERSION),
      containment: versioned(profiles.containment, GUIDANCE_SYNTHESIS_VERSION),
      release: versioned(profiles.release, GUIDANCE_SYNTHESIS_VERSION),
    },
    evidence: versioned(resolveEvidence(input), GUIDANCE_SYNTHESIS_VERSION),
  })
}
