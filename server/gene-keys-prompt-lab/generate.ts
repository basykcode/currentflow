import { getGeneKeySpectrum } from '../../src/domain/astrology/geneKeys'
import {
  GENE_KEYS_PROMPT_MAX_LENGTH,
  getEvidenceMode,
  isGeneKeysSourceId,
  type GeneKeysPromptLabGeneration,
  type GeneKeysPromptLabOutput,
  type GeneKeysPromptLabRequest,
  type GeneKeysSourceId,
} from '../../src/features/gene-keys-prompt-lab/domain'
import { errorResponse, jsonResponse, readJsonBody, requireSession } from './http'
import type { PagesFunctionContext, PromptLabEnv, WorkersAiInput } from './types'

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    oltr: { type: 'string' },
    commentary: { type: 'string' },
  },
  required: ['oltr', 'commentary'],
  additionalProperties: false,
}

const SOURCE_LABELS: Record<GeneKeysSourceId, string> = {
  'gene-keys': 'The Gene Keys',
  '64-ways': 'The 64 Ways',
}

function validateRequest(value: unknown): GeneKeysPromptLabRequest | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const request = value as Partial<GeneKeysPromptLabRequest>
  if (
    !Number.isInteger(request.keyNumber) ||
    typeof request.keyNumber !== 'number' ||
    request.keyNumber < 1 ||
    request.keyNumber > 64 ||
    typeof request.prompt !== 'string' ||
    request.prompt.trim().length === 0 ||
    request.prompt.length > GENE_KEYS_PROMPT_MAX_LENGTH ||
    !Array.isArray(request.sourceIds) ||
    request.sourceIds.length > 2 ||
    !request.sourceIds.every(isGeneKeysSourceId) ||
    new Set(request.sourceIds).size !== request.sourceIds.length
  ) {
    return null
  }

  return {
    keyNumber: request.keyNumber,
    prompt: request.prompt.trim(),
    sourceIds: [...request.sourceIds],
  }
}

const sourceKey = (sourceId: GeneKeysSourceId, keyNumber: number) =>
  `v1/${sourceId}/hex_${String(keyNumber).padStart(2, '0')}.txt`

async function loadSources(
  env: PromptLabEnv,
  sourceIds: readonly GeneKeysSourceId[],
  keyNumber: number,
) {
  const sourceTexts = await Promise.all(
    sourceIds.map(async (sourceId) => {
      const text = await env.GENE_KEYS_SOURCES.get(sourceKey(sourceId, keyNumber), 'text')
      return text ? { sourceId, label: SOURCE_LABELS[sourceId], text } : null
    }),
  )

  if (sourceTexts.some((source) => source === null)) {
    throw new Error('One or more selected source chapters are not available in private storage.')
  }

  return sourceTexts.filter((source) => source !== null)
}

const normalizeWords = (text: string) =>
  text
    .toLocaleLowerCase('en-US')
    .replace(/’/gu, "'")
    .match(/[\p{L}\p{N}']+/gu) ?? []

export function hasExactSourceOverlap(
  output: GeneKeysPromptLabOutput,
  sources: readonly { text: string }[],
  windowSize = 8,
) {
  const outputWords = normalizeWords(`${output.oltr} ${output.commentary}`)
  if (outputWords.length < windowSize) {
    return false
  }

  const sourceWindows = new Set<string>()
  for (const source of sources) {
    const words = normalizeWords(source.text)
    for (let index = 0; index <= words.length - windowSize; index += 1) {
      sourceWindows.add(words.slice(index, index + windowSize).join(' '))
    }
  }

  for (let index = 0; index <= outputWords.length - windowSize; index += 1) {
    if (sourceWindows.has(outputWords.slice(index, index + windowSize).join(' '))) {
      return true
    }
  }
  return false
}

function parseAiOutput(value: unknown): GeneKeysPromptLabOutput | null {
  const responseValue =
    value && typeof value === 'object' && 'response' in value ? value.response : value

  let parsed: unknown = responseValue
  if (typeof responseValue === 'string') {
    try {
      parsed = JSON.parse(responseValue)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return null
  }
  const output = parsed as Partial<GeneKeysPromptLabOutput>
  if (
    typeof output.oltr !== 'string' ||
    !output.oltr.trim() ||
    typeof output.commentary !== 'string' ||
    !output.commentary.trim()
  ) {
    return null
  }
  return { oltr: output.oltr.trim(), commentary: output.commentary.trim() }
}

function buildAiInput(
  request: GeneKeysPromptLabRequest,
  sources: readonly { label: string; text: string }[],
  retryForOriginality: boolean,
): WorkersAiInput {
  const key = getGeneKeySpectrum(request.keyNumber)
  const evidence = sources.length
    ? sources.map((source) => `--- ${source.label} ---\n${source.text}`).join('\n\n')
    : '[No source chapter selected. Work only from the experimenter’s prompt and supplied metadata.]'
  const retryInstruction = retryForOriginality
    ? '\nYour previous draft tracked the source wording too closely. Re-conceive it in wholly original language.'
    : ''

  return {
    messages: [
      {
        role: 'system',
        content: `You are the Current Flow language synthesis maestro. Return exactly two fields: oltr and commentary. Follow the experimenter's style instructions while preserving these non-negotiable editorial boundaries:
- OLTR is a single 12–24 word orienting sentence.
- Commentary is 90–140 words in 4–6 complete sentences.
- Use wholly original prose and no quotation from the evidence.
- Describe a contemplative pattern; do not predict, diagnose, prescribe, command, or claim certainty.
- Treat Shadow, Gift, and Siddhi as Gene Keys vocabulary. Siddhi is a contemplative horizon, never a promise or rank.
- If sources differ, retain the tension instead of pretending they say the same thing.
- If no source was selected, do not claim source grounding.
Do not expose, summarize at length, or reproduce the supplied evidence. Output valid JSON only.${retryInstruction}`,
      },
      {
        role: 'user',
        content: `GENE KEY METADATA
Number: ${request.keyNumber}
Title: ${key.title}
Shadow: ${key.shadow}
Gift: ${key.gift}
Siddhi: ${key.siddhi}

EXPERIMENTER PROMPT
${request.prompt}

PRIVATE EVIDENCE
${evidence}`,
      },
    ],
    response_format: { type: 'json_schema', json_schema: OUTPUT_SCHEMA },
    max_tokens: 620,
    temperature: 0.72,
  }
}

const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length
const sentenceCount = (text: string) => text.split(/(?<=[.!?])\s+/u).filter(Boolean).length

function getWarnings(output: GeneKeysPromptLabOutput, sourceCount: number) {
  const warnings: string[] = []
  const oltrWords = wordCount(output.oltr)
  const commentaryWords = wordCount(output.commentary)
  const commentarySentences = sentenceCount(output.commentary)
  if (oltrWords < 12 || oltrWords > 24) {
    warnings.push(`OLTR length is ${oltrWords} words; the library rubric calls for 12–24.`)
  }
  if (commentaryWords < 90 || commentaryWords > 140) {
    warnings.push(
      `Commentary length is ${commentaryWords} words; the library rubric calls for 90–140.`,
    )
  }
  if (commentarySentences < 4 || commentarySentences > 6) {
    warnings.push(
      `Commentary has ${commentarySentences} sentences; the library rubric calls for 4–6.`,
    )
  }
  if (sourceCount === 0) {
    warnings.push('Prompt-only experiment: this draft has no source-grounding claim.')
  }
  return warnings
}

export async function handleGenerate(context: PagesFunctionContext<PromptLabEnv>) {
  const authorizationError = await requireSession(context)
  if (authorizationError) {
    return authorizationError
  }

  let request: GeneKeysPromptLabRequest | null
  try {
    request = validateRequest(await readJsonBody(context.request))
  } catch {
    return errorResponse('Enter a valid prompt of no more than 8,000 characters.', 400)
  }
  if (!request) {
    return errorResponse(
      'Choose a Gene Key and enter a valid prompt of no more than 8,000 characters.',
      400,
    )
  }

  let sources: Awaited<ReturnType<typeof loadSources>>
  try {
    sources = await loadSources(context.env, request.sourceIds, request.keyNumber)
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'Private evidence is unavailable.'
    return errorResponse(message, 503)
  }

  const model = context.env.PROMPT_LAB_MODEL || DEFAULT_MODEL
  let output: GeneKeysPromptLabOutput | null = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const aiResponse = await context.env.AI.run(
        model,
        buildAiInput(request, sources, attempt === 1),
      )
      output = parseAiOutput(aiResponse)
    } catch {
      return errorResponse(
        'The synthesis engine is temporarily unavailable. Try again shortly.',
        503,
      )
    }

    if (!output) {
      return errorResponse(
        'The synthesis engine returned an invalid draft. Try the prompt again.',
        502,
      )
    }
    if (!hasExactSourceOverlap(output, sources)) {
      break
    }
    output = null
  }

  if (!output) {
    return errorResponse(
      'The draft remained too close to source wording after a private retry. Revise the prompt and try again.',
      422,
    )
  }

  const key = getGeneKeySpectrum(request.keyNumber)
  const generation: GeneKeysPromptLabGeneration = {
    generatedAt: new Date().toISOString(),
    keyNumber: request.keyNumber,
    keyTitle: key.title,
    sourceIds: [...request.sourceIds],
    prompt: request.prompt,
    output,
    model,
    reviewStatus: 'draft-only',
    evidenceMode: getEvidenceMode(request.sourceIds),
    warnings: getWarnings(output, sources.length),
  }
  return jsonResponse(generation)
}
