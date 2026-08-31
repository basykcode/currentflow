import type {
  GuidanceSynthesis,
  IntentionDefinition,
  IntentionSelection,
  SemanticTheme,
} from '../types'
import { GuidanceConstructionError } from '../errors'
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

const matchesBackground = (definition: IntentionDefinition, synthesis: GuidanceSynthesis) =>
  synthesis.operativeWork.backgroundThemes.value.some((theme) => matchesTheme(definition, theme))

const matchesMaturity = (definition: IntentionDefinition, synthesis: GuidanceSynthesis) => {
  const tokens = new Set(
    [
      definition.englishLabel,
      definition.shortDefinition,
      ...definition.strategicVectors,
      ...definition.somaticVectors,
    ]
      .join(' ')
      .toLowerCase()
      .match(/[a-z]+/g) ?? [],
  )
  return synthesis.operativeWork.hourMaturity.value.supportedVerbs.some((verb) =>
    tokens.has(verb.toLowerCase()),
  )
}

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
  if (synthesis.response.compatibleIntentionIds.value.includes(definition.id)) {
    score += 25
    reasons.push('Preferred by the temporal profiles.')
  }
  if (matchesTheme(definition, synthesis.operativeWork.dayTheme.value)) {
    score += 20
    reasons.push('Matches the day operative work.')
  }
  if (matchesTheme(definition, synthesis.operativeWork.hourTheme.value)) {
    score += 15
    reasons.push('Matches the hour theme.')
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
  if (definition.compatibleEffortLevels.includes(synthesis.response.effortLevel.value)) {
    score += 8
    reasons.push('Fits the resolved effort.')
  }
  if (matchesBackground(definition, synthesis)) {
    score += 10
    reasons.push('Matches the active background current.')
  }
  if (matchesMaturity(definition, synthesis)) {
    score += 5
    reasons.push(`Fits the ${synthesis.operativeWork.hourMaturity.value.semantic} Hour maturity.`)
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
    (definition) => validateIntention(definition, synthesis).valid,
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

  for (const candidate of ranked) {
    if (selected.length >= 3) break
    if (!selected.some((item) => item.definition.id === candidate.definition.id)) {
      selected.push(candidate)
    }
  }

  if (selected.length !== 3) {
    throw new GuidanceConstructionError(
      'The controlled intention lexicon must provide exactly three ranked intentions.',
    )
  }

  return selected.map((item, index) =>
    Object.freeze({
      definition: item.definition,
      rank: (index + 1) as 1 | 2 | 3,
      reasons: item.reasons,
    }),
  )
}
