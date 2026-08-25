import type {
  ExecutionCategory,
  ExecutionDefinition,
  ExecutionSelection,
  GuidanceSynthesis,
  IntentionDefinition,
} from '../types'
import { EXECUTION_ACTION_LIBRARY } from './actionLibrary'
import { validateExecution } from './validator'

type RankedExecution = Readonly<{
  definition: ExecutionDefinition
  score: number
  reasons: readonly string[]
}>

const overlaps = <T>(left: readonly T[], right: readonly T[]) =>
  left.some((value) => right.includes(value))

const rankExecution = (
  definition: ExecutionDefinition,
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  preferredCategory?: ExecutionCategory,
): RankedExecution => {
  let score = 0
  const reasons: string[] = []
  if (definition.compatibleIntentions.includes(intention.id)) {
    score += 40
    reasons.push(`Embodies ${intention.englishLabel}.`)
  }
  if (definition.compatibleRelations.includes(synthesis.response.relation.value)) {
    score += 25
    reasons.push(`Supports ${synthesis.response.relation.value}.`)
  }
  if (overlaps(definition.strategicVectors, synthesis.response.strategicVectors.value)) {
    score += 15
    reasons.push('Matches the strategic response.')
  }
  if (overlaps(definition.somaticVectors, synthesis.response.somaticVectors.value)) {
    score += 10
    reasons.push('Matches the somatic response.')
  }
  if (preferredCategory && definition.category === preferredCategory) {
    score += 100
    reasons.push(`Matches the requested ${preferredCategory} form.`)
  }
  return { definition, score, reasons }
}

export const selectExecutions = (
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  oltrText: string,
  preferredCategory?: ExecutionCategory,
): readonly ExecutionSelection[] => {
  const ranked = EXECUTION_ACTION_LIBRARY.filter(
    (definition) => validateExecution(definition, synthesis, intention, oltrText).valid,
  )
    .map((definition) => rankExecution(definition, synthesis, intention, preferredCategory))
    .sort(
      (left, right) =>
        right.score - left.score || left.definition.id.localeCompare(right.definition.id),
    )
    .slice(0, 4)

  if (ranked.length === 0) {
    throw new Error('No safe compatible execution exists for the selected intention.')
  }

  return ranked.map((item, index) =>
    Object.freeze({
      definition: item.definition,
      rank: index === 0 ? 'primary' : 'alternative',
      reasons: item.reasons,
    }),
  )
}
