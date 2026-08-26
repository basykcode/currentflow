import type { GuidanceValidationIssue, GuidanceValidationResult } from '../types'

const PRONOUN_PATTERN = /\b(?:i|me|my|mine|we|us|our|ours|you|your|yours)\b/i
const UNSUPPORTED_CLAIM_PATTERN =
  /\b(?:destin(?:y|ed)|fate|guaranteed|predicts?|prediction|the universe wants|align with the energy|raise (?:the )?vibration|vibrational frequency|cosmic mandate)\b/i
const UNSAFE_PATTERN =
  /\b(?:diagnos(?:e|is)|medicat(?:e|ion)|dosage|dose|breath retention|hold (?:the |your )?breath|qi manipulation|sexual cultivation|neidan|legal advice|financial advice|invest(?:ment|ing)?|surgery)\b/i
const METADATA_PATTERN = /\b(?:metadata|confidence score|model version|renderer version)\b/i
const PAST_OR_FUTURE_PATTERN = /\b(?:will|shall|was|were|had|did)\b/i
const PRESENT_TENSE_PATTERN =
  /\b(?:is|are|moves?|gathers?|holds?|thins?|slows?|lacks?|exceeds?|becomes?|rests?|carries?|adds?|asks?)\b/i
const IMPERATIVE_VERBS = new Set([
  'add',
  'adjust',
  'allow',
  'balance',
  'clear',
  'close',
  'complete',
  'contain',
  'continue',
  'finish',
  'follow',
  'gather',
  'hold',
  'keep',
  'limit',
  'move',
  'nourish',
  'observe',
  'preserve',
  'reduce',
  'release',
  'repair',
  'restore',
  'set',
  'simplify',
  'steady',
  'supply',
  'support',
  'wait',
  'withdraw',
])

export const containsUnsupportedGuidanceClaim = (text: string) =>
  UNSUPPORTED_CLAIM_PATTERN.test(text)

export const containsUnsafeGuidance = (text: string) => UNSAFE_PATTERN.test(text)

export const countOltrWords = (text: string) =>
  text
    .trim()
    .replace(/[;.,!?]/g, ' ')
    .split(/\s+/u)
    .filter(Boolean).length

export const validateOltr = (
  text: string,
  supportedVerbs?: readonly string[],
): GuidanceValidationResult => {
  const issues: GuidanceValidationIssue[] = []
  const semicolonCount = [...text].filter((character) => character === ';').length
  const sentenceTerminators = text.match(/[.!?]/g) ?? []
  const [fieldClause = '', responseClause = ''] = text.split(';')
  const responseVerb = responseClause
    .trim()
    .match(/^([A-Za-z]+)/)?.[1]
    ?.toLowerCase()
  const wordCount = countOltrWords(text)

  if (
    semicolonCount !== 1 ||
    sentenceTerminators.length !== 1 ||
    !text.endsWith('.') ||
    /[:()—\r\n]/u.test(text)
  ) {
    issues.push({
      code: 'format',
      message:
        'OLTR must be one sentence with one semicolon, one final period, and no banned punctuation.',
    })
  }

  if (wordCount < 14 || wordCount > 26) {
    issues.push({ code: 'word-count', message: 'OLTR must contain 14 to 26 words.' })
  }

  if (PRONOUN_PATTERN.test(text)) {
    issues.push({ code: 'pronoun', message: 'OLTR must not use first- or second-person pronouns.' })
  }

  if (
    PAST_OR_FUTURE_PATTERN.test(fieldClause) ||
    !PRESENT_TENSE_PATTERN.test(fieldClause) ||
    !responseVerb ||
    !IMPERATIVE_VERBS.has(responseVerb) ||
    (supportedVerbs && !supportedVerbs.includes(responseVerb))
  ) {
    issues.push({
      code: 'grammar',
      message: 'OLTR requires a present-tense field clause and an imperative response clause.',
    })
  }

  if (containsUnsupportedGuidanceClaim(text) || METADATA_PATTERN.test(text)) {
    issues.push({
      code: 'unsupported-claim',
      message: 'OLTR contains prediction, fate, generic spirituality, or metadata language.',
    })
  }

  if (containsUnsafeGuidance(text)) {
    issues.push({ code: 'unsafe', message: 'OLTR contains unsafe or high-stakes guidance.' })
  }

  return Object.freeze({ valid: issues.length === 0, issues })
}
