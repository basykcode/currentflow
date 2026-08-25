import type { GuidanceEvidence, GuidanceSemanticInput, GuidanceSynthesis } from '../types'
import { resolveGuidanceProfiles } from './effortResolver'
import { resolveResponseRelation } from './responseRelation'
import { GUIDANCE_SYNTHESIS_VERSION, versioned } from './semanticVersion'

const resolveEvidence = (input: GuidanceSemanticInput): readonly GuidanceEvidence[] =>
  input.evidence.map((item) => ({
    source: versioned(item.source, input.semanticVersion),
    semanticClaim: versioned(item.semanticClaim, input.semanticVersion),
    weight: versioned(item.weight, input.semanticVersion),
    provenance: versioned(item.provenance, input.semanticVersion),
  }))

export const resolveGuidanceSynthesis = (input: GuidanceSemanticInput): GuidanceSynthesis => {
  const expectedRelation = resolveResponseRelation(input.condition)
  if (input.resolvedResponse.relation !== expectedRelation) {
    throw new Error(
      `Resolved response ${input.resolvedResponse.relation} is inconsistent with ${input.condition}.`,
    )
  }
  const profiles = resolveGuidanceProfiles(input.condition)
  const semanticVersion = input.semanticVersion || GUIDANCE_SYNTHESIS_VERSION

  return Object.freeze({
    id: versioned(input.synthesisId, semanticVersion),
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
      hourModifier: versioned(input.operativeWork.hourModifier, semanticVersion),
      backgroundThemes: versioned(input.operativeWork.backgroundThemes, semanticVersion),
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
      completion: versioned(profiles.completion, semanticVersion),
      initiation: versioned(profiles.initiation, semanticVersion),
      containment: versioned(profiles.containment, semanticVersion),
      release: versioned(profiles.release, semanticVersion),
    },
    evidence: versioned(resolveEvidence(input), semanticVersion),
  })
}
