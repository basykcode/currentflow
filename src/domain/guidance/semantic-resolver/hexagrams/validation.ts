import { getHexagram } from '@/domain/astrology/hexagrams'

import { INTENTION_LEXICON } from '../../intention/lexicon'
import type { HexagramSemanticProfile } from '../types'

export type SemanticProfileValidationIssue = Readonly<{
  hexagramNumber: number
  field: string
  message: string
}>

export type SemanticProfileValidationResult = Readonly<{
  valid: boolean
  issues: readonly SemanticProfileValidationIssue[]
}>

const PROFILE_VERSION_PATTERN = /^current-hexagram-semantic-profile@\d+\.\d+\.\d+$/

const duplicates = (values: readonly string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index)

const addRequiredArrayIssue = (
  profile: HexagramSemanticProfile,
  field: keyof HexagramSemanticProfile,
  values: readonly string[],
  issues: SemanticProfileValidationIssue[],
) => {
  if (values.length === 0) {
    issues.push({
      hexagramNumber: profile.hexagramNumber,
      field,
      message: `${field} must contain at least one controlled value.`,
    })
  }
  const repeated = [...new Set(duplicates(values))]
  if (repeated.length > 0) {
    issues.push({
      hexagramNumber: profile.hexagramNumber,
      field,
      message: `${field} contains duplicate values: ${repeated.join(', ')}.`,
    })
  }
}

export const validateHexagramSemanticProfiles = (
  profiles: readonly HexagramSemanticProfile[],
): SemanticProfileValidationResult => {
  const issues: SemanticProfileValidationIssue[] = []
  const intentionIds = new Set(INTENTION_LEXICON.map((definition) => definition.id))
  const intentionsById = new Map(INTENTION_LEXICON.map((definition) => [definition.id, definition]))
  const seenNumbers = new Set<number>()

  for (const profile of profiles) {
    if (seenNumbers.has(profile.hexagramNumber)) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'hexagramNumber',
        message: 'The semantic registry contains a duplicate hexagram profile.',
      })
    }
    seenNumbers.add(profile.hexagramNumber)

    try {
      getHexagram(profile.hexagramNumber)
    } catch {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'hexagramNumber',
        message: 'The profile does not resolve through the canonical hexagram registry.',
      })
    }

    addRequiredArrayIssue(profile, 'movement', profile.movement, issues)
    addRequiredArrayIssue(profile, 'strategicVectors', profile.strategicVectors, issues)
    addRequiredArrayIssue(profile, 'responseRelations', profile.responseRelations, issues)
    addRequiredArrayIssue(profile, 'compatibleEffortLevels', profile.compatibleEffortLevels, issues)
    addRequiredArrayIssue(profile, 'supportedTextures', profile.supportedTextures, issues)
    addRequiredArrayIssue(profile, 'compatibleLunarModes', profile.compatibleLunarModes, issues)
    addRequiredArrayIssue(profile, 'imageFamilies', profile.imageFamilies, issues)
    addRequiredArrayIssue(profile, 'compatibleIntentionIds', profile.compatibleIntentionIds, issues)
    addRequiredArrayIssue(profile, 'preferredVerbs', profile.preferredVerbs, issues)
    addRequiredArrayIssue(profile, 'forbiddenVerbs', profile.forbiddenVerbs, issues)

    const unknownIntentions = profile.compatibleIntentionIds.filter((id) => !intentionIds.has(id))
    if (unknownIntentions.length > 0) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'compatibleIntentionIds',
        message: `Unknown controlled intention IDs: ${unknownIntentions.join(', ')}.`,
      })
    }
    const incompatibleIntentions = profile.compatibleIntentionIds.filter((id) => {
      const intention = intentionsById.get(id)
      return (
        intention !== undefined &&
        (!intention.compatibleRelations.some((relation) =>
          profile.responseRelations.includes(relation),
        ) ||
          !intention.compatibleEffortLevels.some((level) =>
            profile.compatibleEffortLevels.includes(level),
          ))
      )
    })
    if (incompatibleIntentions.length > 0) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'compatibleIntentionIds',
        message: `Intentions lack profile relation or effort compatibility: ${incompatibleIntentions.join(', ')}.`,
      })
    }

    const forbidden = new Set(profile.forbiddenVerbs.map((verb) => verb.toLowerCase()))
    const contradictoryVerbs = profile.preferredVerbs.filter((verb) =>
      forbidden.has(verb.toLowerCase()),
    )
    if (contradictoryVerbs.length > 0) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'preferredVerbs',
        message: `Preferred and forbidden verbs overlap: ${contradictoryVerbs.join(', ')}.`,
      })
    }

    if (!PROFILE_VERSION_PATTERN.test(profile.version)) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'version',
        message: 'Profile version must be a versioned Current semantic profile identifier.',
      })
    }
    if (!profile.review.authoredBy.trim() || !profile.review.reviewBasis.trim()) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'review',
        message: 'Review metadata requires an author label and review basis.',
      })
    }
    if (profile.review.status === 'human-approved' && profile.review.reviewedBy.length === 0) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'review',
        message: 'Human-approved profiles require at least one reviewer identifier.',
      })
    }
    if (profile.notes.some((note) => note.length > 180)) {
      issues.push({
        hexagramNumber: profile.hexagramNumber,
        field: 'notes',
        message: 'Profile notes must stay concise and operational.',
      })
    }
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
