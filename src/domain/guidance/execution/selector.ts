import type {
  ExecutionCategory,
  ExecutionDefinition,
  ExecutionSelection,
  GuidanceSynthesis,
  IntentionDefinition,
  SemanticTheme,
} from '../types'
import { GuidanceConstructionError } from '../errors'
import { ELEMENTAL_EXECUTION_LIBRARY } from './actionLibrary'
import { validateExecution } from './validator'

export const EXECUTION_RANK_WEIGHTS = Object.freeze({
  responseRelation: 25,
  selectedIntention: 20,
  strategicResponse: 15,
  fieldDirection: 10,
  dayTheme: 10,
  hourTheme: 5,
  activeOrgan: 10,
  macroMaturity: 5,
})

type RankedExecution = Readonly<{
  definition: ExecutionDefinition
  score: number
  reasons: readonly string[]
}>

const overlaps = <T>(left: readonly T[], right: readonly T[]) =>
  left.some((value) => right.includes(value))

const matchesTheme = (definition: ExecutionDefinition, theme: SemanticTheme) =>
  overlaps(definition.strategicVectorAffinities, theme.strategicVectors) ||
  overlaps(definition.somaticVectorAffinities, theme.somaticVectors)

const rankExecution = (
  definition: ExecutionDefinition,
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
): RankedExecution => {
  let score = 0
  const reasons: string[] = []
  const directions = [
    synthesis.field.primaryDirection.value,
    synthesis.field.secondaryDirection.value,
  ] as const

  if (definition.relationAffinities.includes(synthesis.response.relation.value)) {
    score += EXECUTION_RANK_WEIGHTS.responseRelation
    reasons.push(`Fits the ${synthesis.response.relation.value} response.`)
  }
  if (definition.intentionAffinities.includes(intention.id)) {
    score += EXECUTION_RANK_WEIGHTS.selectedIntention
    reasons.push(`Resonates with ${intention.englishLabel}.`)
  }
  if (overlaps(definition.strategicVectorAffinities, synthesis.response.strategicVectors.value)) {
    score += EXECUTION_RANK_WEIGHTS.strategicResponse
    reasons.push('Matches the strategic response.')
  }
  if (directions.some((direction) => definition.directionAffinities.includes(direction))) {
    score += EXECUTION_RANK_WEIGHTS.fieldDirection
    reasons.push('Fits the field direction.')
  }
  if (matchesTheme(definition, synthesis.operativeWork.dayTheme.value)) {
    score += EXECUTION_RANK_WEIGHTS.dayTheme
    reasons.push('Matches the day operative work.')
  }
  if (matchesTheme(definition, synthesis.operativeWork.hourTheme.value)) {
    score += EXECUTION_RANK_WEIGHTS.hourTheme
    reasons.push('Matches the hour theme.')
  }
  if (definition.category === synthesis.operativeWork.activeOrgan.value.element) {
    score += EXECUTION_RANK_WEIGHTS.activeOrgan
    reasons.push(
      `Represents the active ${synthesis.operativeWork.activeOrgan.value.nameEnglish} · ${definition.category} context.`,
    )
  }
  if (definition.macroAffinities.includes(synthesis.operativeWork.hourMaturity.value.semantic)) {
    score += EXECUTION_RANK_WEIGHTS.macroMaturity
    reasons.push(`Fits the ${synthesis.operativeWork.hourMaturity.value.semantic} Hour maturity.`)
  }

  return Object.freeze({ definition, score, reasons: Object.freeze(reasons) })
}

const assertValidLibrary = (
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  oltrText: string,
) => {
  const elements = new Set(ELEMENTAL_EXECUTION_LIBRARY.map((definition) => definition.category))
  if (ELEMENTAL_EXECUTION_LIBRARY.length !== 5 || elements.size !== 5) {
    throw new GuidanceConstructionError(
      'Elemental Execution requires exactly five unique element domains.',
    )
  }

  const issues = ELEMENTAL_EXECUTION_LIBRARY.flatMap(
    (definition) => validateExecution(definition, synthesis, intention, oltrText).issues,
  )
  if (issues.length > 0) {
    throw new GuidanceConstructionError(
      `Elemental Execution library failed validation: ${issues.map((issue) => issue.message).join(' ')}`,
    )
  }
}

export const selectExecutions = (
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  oltrText = '',
  preferredCategory?: ExecutionCategory,
): readonly ExecutionSelection[] => {
  // Kept only for call-site compatibility with the retired form-preference control. Domain ranking
  // is determined by the shared synthesis, selected intention, and active Organ context.
  void preferredCategory

  assertValidLibrary(synthesis, intention, oltrText)

  const ranked = ELEMENTAL_EXECUTION_LIBRARY.map((definition) =>
    rankExecution(definition, synthesis, intention),
  ).sort(
    (left, right) =>
      right.score - left.score || left.definition.id.localeCompare(right.definition.id),
  )

  const selected = ranked.slice(0, 3)
  const activeElement = synthesis.operativeWork.activeOrgan.value.element
  let coverageId: string | undefined

  if (!selected.some((item) => item.definition.category === activeElement)) {
    const activeElementDomain = ranked.find((item) => item.definition.category === activeElement)
    if (!activeElementDomain) {
      throw new GuidanceConstructionError(
        `No Elemental Execution domain exists for active element ${activeElement}.`,
      )
    }
    selected[2] = activeElementDomain
    coverageId = activeElementDomain.definition.id
  }

  if (
    selected.length !== 3 ||
    new Set(selected.map((item) => item.definition.category)).size !== 3
  ) {
    throw new GuidanceConstructionError(
      'Elemental Execution must resolve exactly three unique element domains.',
    )
  }

  return Object.freeze(
    selected.map((item, index) => {
      const activeOrganMatch = item.definition.category === activeElement
      const includedForCoverage = item.definition.id === coverageId
      return Object.freeze({
        definition: item.definition,
        rank: (index + 1) as 1 | 2 | 3,
        activeOrganMatch,
        inclusionBasis: includedForCoverage
          ? ('active-organ-coverage' as const)
          : ('semantic-rank' as const),
        reasons: includedForCoverage
          ? Object.freeze([
              ...item.reasons,
              `Included to represent the active ${synthesis.operativeWork.activeOrgan.value.nameEnglish} · ${activeElement} context.`,
            ])
          : item.reasons,
      })
    }),
  )
}
