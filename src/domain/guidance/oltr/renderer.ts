import type { GuidanceSynthesis, OltrOutput, ResponseRelation } from '../types'
import { OLTR_RENDERER_VERSION } from '../synthesis/semanticVersion'
import {
  CONTROLLED_OLTR_PHRASE_BANK,
  type OltrFieldPhrase,
  type OltrPhraseBank,
  type OltrResponsePhrase,
} from './phraseBank'
import { countOltrWords, containsUnsafeGuidance, validateOltr } from './validator'

type OltrCandidate = Readonly<{
  text: string
  field: OltrFieldPhrase
  response: OltrResponsePhrase
  score: number
}>

const FALLBACK_BY_RELATION: Readonly<Record<ResponseRelation, string>> = Object.freeze({
  follow:
    'Conditions are moving with a coherent current; follow the clearest opening with measured effort.',
  contain:
    'The field is carrying more movement than it can hold; set one boundary and keep effort proportionate.',
  counterbalance:
    'The field is missing a stabilizing support for movement; add that support before extending the work.',
  complete:
    'Ripening work is ready for a clean close; complete the nearest task, then withdraw from fresh initiation.',
  wait: 'Conditions are holding at a consequential threshold; preserve the boundary and delay fresh commitments for now.',
  transform:
    'Accumulated friction is limiting ordinary circulation; repair one obstruction and restore the system to practical use.',
  withdraw:
    'Outward momentum is thinning while inward space becomes useful; reduce external effort and gather attention inward.',
})

const scoreCandidate = (
  synthesis: GuidanceSynthesis,
  field: OltrFieldPhrase,
  response: OltrResponsePhrase,
  text: string,
) => {
  let score = 0
  const condition = synthesis.condition.value
  const relation = synthesis.response.relation.value
  const direction = synthesis.field.primaryDirection.value
  const imageFamily = synthesis.field.dominantImageFamily.value
  const validation = validateOltr(text, synthesis.response.supportedVerbs.value)
  const wordCount = countOltrWords(text)

  if (field.conditions.includes(condition)) score += 30
  if (response.relations.includes(relation)) score += 20
  if (field.directions.includes(direction)) score += 15
  if (wordCount >= 18 && wordCount <= 22) score += 15
  else if (wordCount >= 14 && wordCount <= 26) score += 10
  if (validation.valid) score += 10
  if (field.imageFamilies.includes(imageFamily)) score += 5
  if (!containsUnsafeGuidance(text)) score += 5

  return score
}

const createCandidates = (
  synthesis: GuidanceSynthesis,
  phraseBank: OltrPhraseBank,
): readonly OltrCandidate[] => {
  const condition = synthesis.condition.value
  const relation = synthesis.response.relation.value
  const effort = synthesis.response.effortLevel.value
  const fields = phraseBank.fieldPhrases.filter((phrase) => phrase.conditions.includes(condition))
  const responses = phraseBank.responsePhrases.filter(
    (phrase) => phrase.relations.includes(relation) && phrase.effortLevels.includes(effort),
  )

  return fields.flatMap((field) =>
    responses.map((response) => {
      const text = `${field.text}; ${response.text}.`
      return { text, field, response, score: scoreCandidate(synthesis, field, response, text) }
    }),
  )
}

const selectCandidate = (candidates: readonly OltrCandidate[], synthesis: GuidanceSynthesis) =>
  candidates
    .filter(
      (candidate) => validateOltr(candidate.text, synthesis.response.supportedVerbs.value).valid,
    )
    .sort((left, right) => right.score - left.score)[0]

export const renderOltr = (
  synthesis: GuidanceSynthesis,
  phraseBank: OltrPhraseBank = CONTROLLED_OLTR_PHRASE_BANK,
): OltrOutput => {
  const selected = selectCandidate(createCandidates(synthesis, phraseBank), synthesis)
  const text = selected?.text ?? FALLBACK_BY_RELATION[synthesis.response.relation.value]
  const validation = validateOltr(text, synthesis.response.supportedVerbs.value)

  if (!validation.valid) {
    throw new Error(
      `Deterministic OLTR rendering failed validation: ${validation.issues.map((issue) => issue.message).join(' ')}`,
    )
  }

  return Object.freeze({
    text,
    status: 'validated',
    sourceLabel: 'Controlled Current phrase bank · Current formalization',
    version: OLTR_RENDERER_VERSION,
  })
}
