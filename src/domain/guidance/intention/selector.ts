import type {
  BackgroundTheme,
  GuidanceSynthesis,
  IntentionDefinition,
  IntentionSelection,
  SemanticTheme,
} from '../types'
import { INTENTION_LEXICON } from './lexicon'
import { validateIntention } from './validator'

type RankedIntention = Readonly<{
  definition: IntentionDefinition
  score: number
  reasons: readonly string[]
}>

const overlaps = <T>(left: readonly T[], right: readonly T[]) =>
  left.some((value) => right.includes(value))

const matchesTheme = (definition: IntentionDefinition, theme: SemanticTheme) =>
  overlaps(definition.strategicVectors, theme.strategicVectors) ||
  overlaps(definition.somaticVectors, theme.somaticVectors)

const matchesWuYunLiuQi = (definition: IntentionDefinition, themes: readonly BackgroundTheme[]) =>
  themes.some((theme) => theme.kind === 'wu-yun-liu-qi' && matchesTheme(definition, theme))

const rankIntention = (
  definition: IntentionDefinition,
  synthesis: GuidanceSynthesis,
): RankedIntention => {
  let score = 0
  const reasons: string[] = []
  if (definition.compatibleRelations.includes(synthesis.response.relation.value)) {
    score += 35
    reasons.push(`Supports ${synthesis.response.relation.value}.`)
  }
  if (matchesTheme(definition, synthesis.operativeWork.dayTheme.value)) {
    score += 20
    reasons.push('Matches the day operative work.')
  }
  if (matchesTheme(definition, synthesis.operativeWork.hourModifier.value)) {
    score += 15
    reasons.push('Matches the hour modulation.')
  }
  if (definition.compatibleLunarModes.includes(synthesis.field.lunarMode.value)) {
    score += 10
    reasons.push('Fits the lunar tempo.')
  }
  if (
    definition.compatibleDirections.includes(synthesis.field.primaryDirection.value) ||
    definition.compatibleDirections.includes(synthesis.field.secondaryDirection.value)
  ) {
    score += 10
    reasons.push('Fits the field direction.')
  }
  if (matchesWuYunLiuQi(definition, synthesis.operativeWork.backgroundThemes.value)) {
    score += 10
    reasons.push('Matches the Wu Yun Liu Qi background signal.')
  }
  return { definition, score, reasons }
}

const meaningfullyDistinct = (
  candidate: IntentionDefinition,
  selected: readonly IntentionDefinition[],
) =>
  selected.every(
    (current) =>
      current.englishLabel !== candidate.englishLabel &&
      (current.strategicVectors[0] !== candidate.strategicVectors[0] ||
        current.somaticVectors[0] !== candidate.somaticVectors[0]),
  )

export const selectIntentions = (synthesis: GuidanceSynthesis): readonly IntentionSelection[] => {
  const ranked = INTENTION_LEXICON.filter(
    (definition) =>
      synthesis.response.compatibleIntentionIds.value.includes(definition.id) &&
      validateIntention(definition, synthesis).valid,
  )
    .map((definition) => rankIntention(definition, synthesis))
    .sort(
      (left, right) =>
        right.score - left.score || left.definition.id.localeCompare(right.definition.id),
    )

  const selected: RankedIntention[] = []
  for (const candidate of ranked) {
    if (selected.length >= 3) break
    if (
      meaningfullyDistinct(
        candidate.definition,
        selected.map((item) => item.definition),
      )
    ) {
      selected.push(candidate)
    }
  }

  if (selected.length === 0) {
    throw new Error('No compatible controlled intention exists for this synthesis.')
  }

  return selected.map((item, index) =>
    Object.freeze({
      definition: item.definition,
      rank: index === 0 ? 'primary' : 'alternative',
      reasons: item.reasons,
    }),
  )
}
