import type {
  ExecutionCategory,
  ExecutionDefinition,
  GuidanceSynthesis,
  GuidanceValidationIssue,
  GuidanceValidationResult,
  IntentionDefinition,
} from '../types'
import { containsUnsafeGuidance, containsUnsupportedGuidanceClaim } from '../oltr/validator'
import { EXECUTION_LIBRARY_VERSION } from '../synthesis/semanticVersion'

const HIGH_STAKES_PATTERN =
  /\b(?:medical|diagnos(?:e|is)|treatment|medication|dose|legal advice|lawsuit|contract signing|financial advice|invest(?:ment|ing)?|loan|mortgage|surgery|emergency|tax filing)\b/i

const IMPERATIVE_OPENING_PATTERN =
  /^(?:add|begin|change|clear|close|complete|continue|defer|finish|hold|move|place|reduce|remove|repair|silence|start|stop|write)\b/i

const EXPECTED_IDENTITY = Object.freeze({
  wood: {
    elementCharacter: '木',
    elementPinyin: 'Mù',
    spiritCharacter: '魂',
    spiritPinyin: 'Hún',
    zangCorrespondence: 'liver',
  },
  fire: {
    elementCharacter: '火',
    elementPinyin: 'Huǒ',
    spiritCharacter: '神',
    spiritPinyin: 'Shén',
    zangCorrespondence: 'heart',
  },
  earth: {
    elementCharacter: '土',
    elementPinyin: 'Tǔ',
    spiritCharacter: '意',
    spiritPinyin: 'Yì',
    zangCorrespondence: 'spleen',
  },
  metal: {
    elementCharacter: '金',
    elementPinyin: 'Jīn',
    spiritCharacter: '魄',
    spiritPinyin: 'Pò',
    zangCorrespondence: 'lung',
  },
  water: {
    elementCharacter: '水',
    elementPinyin: 'Shuǐ',
    spiritCharacter: '志',
    spiritPinyin: 'Zhì',
    zangCorrespondence: 'kidney',
  },
} as const satisfies Readonly<
  Record<
    ExecutionCategory,
    Readonly<{
      elementCharacter: ExecutionDefinition['elementCharacter']
      elementPinyin: ExecutionDefinition['elementPinyin']
      spiritCharacter: ExecutionDefinition['spirit']['character']
      spiritPinyin: ExecutionDefinition['spirit']['pinyin']
      zangCorrespondence: ExecutionDefinition['spirit']['zangCorrespondence']
    }>
  >
>)

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const hasDuplicates = <T>(values: readonly T[]) => new Set(values).size !== values.length

export const validateExecution = (
  definition: ExecutionDefinition,
  synthesis: GuidanceSynthesis,
  intention: IntentionDefinition,
  oltrText = '',
): GuidanceValidationResult => {
  // Affinities affect rank only. They never make an otherwise safe work domain ineligible for the
  // synthesis or selected intention.
  void synthesis
  void intention

  const issues: GuidanceValidationIssue[] = []
  const expected = EXPECTED_IDENTITY[definition.category]
  const copy = [definition.title, definition.description, ...definition.taskDomains].join(' ')
  const affinityGroups: readonly (readonly string[])[] = [
    definition.relationAffinities,
    definition.directionAffinities,
    definition.intentionAffinities,
    definition.strategicVectorAffinities,
    definition.somaticVectorAffinities,
    definition.macroAffinities,
  ]

  if (
    definition.elementCharacter !== expected.elementCharacter ||
    definition.elementPinyin !== expected.elementPinyin ||
    definition.spirit.character !== expected.spiritCharacter ||
    definition.spirit.pinyin !== expected.spiritPinyin ||
    definition.spirit.zangCorrespondence !== expected.zangCorrespondence
  ) {
    issues.push({
      code: 'format',
      message: `Execution domain ${definition.id} has an invalid element, spirit, or Zang correspondence.`,
    })
  }

  if (
    !definition.id.trim() ||
    !definition.title.trim() ||
    !definition.description.trim() ||
    !definition.spirit.classicalGloss.trim() ||
    definition.taskDomains.length !== 5 ||
    definition.taskDomains.some((domain) => !domain.trim()) ||
    hasDuplicates(definition.taskDomains) ||
    affinityGroups.some((values) => values.length === 0 || hasDuplicates(values))
  ) {
    issues.push({
      code: 'format',
      message: `Execution domain ${definition.id} requires complete, unique identity, task-domain, and affinity data.`,
    })
  }

  if (
    definition.scope !== 'ordinary-work-domain' ||
    definition.formalization !== 'current' ||
    !definition.sourceLabel.includes('Current') ||
    definition.sourceUrls.length === 0 ||
    definition.sourceUrls.some((url) => !url.startsWith('https://'))
  ) {
    issues.push({
      code: 'unsupported-claim',
      message: `Execution domain ${definition.id} lacks explicit Current-formalization provenance.`,
    })
  }

  if (definition.version !== EXECUTION_LIBRARY_VERSION) {
    issues.push({
      code: 'version-mismatch',
      message: `Execution domain ${definition.id} does not use the active taxonomy version.`,
    })
  }

  if (
    IMPERATIVE_OPENING_PATTERN.test(definition.description) ||
    definition.taskDomains.some((domain) => IMPERATIVE_OPENING_PATTERN.test(domain))
  ) {
    issues.push({
      code: 'format',
      message: `Execution domain ${definition.id} must describe a work category rather than prescribe an atomic action.`,
    })
  }

  if (containsUnsafeGuidance(copy) || HIGH_STAKES_PATTERN.test(copy)) {
    issues.push({
      code: 'unsafe',
      message: `Execution domain ${definition.id} contains unsafe or high-stakes guidance.`,
    })
  }

  if (containsUnsupportedGuidanceClaim(copy)) {
    issues.push({
      code: 'unsupported-claim',
      message: `Execution domain ${definition.id} contains an unsupported claim.`,
    })
  }

  if (oltrText && normalize(definition.description) === normalize(oltrText)) {
    issues.push({
      code: 'repetition',
      message: `Execution domain ${definition.id} merely repeats the OLTR.`,
    })
  }

  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) })
}
