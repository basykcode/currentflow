export const GENE_KEYS_PROMPT_MAX_LENGTH = 8_000

export const GENE_KEYS_PROMPT_LAB_MODELS = [
  {
    id: 'cloudflare-llama-3.1-8b-fast',
    label: 'Llama 3.1 8B · Fast',
    provider: 'Cloudflare Workers AI',
  },
  {
    id: 'openai-gpt-5.6-terra',
    label: 'ChatGPT · GPT-5.6 Terra',
    provider: 'OpenAI',
  },
  {
    id: 'openai-gpt-5.6-luna',
    label: 'ChatGPT · GPT-5.6 Luna',
    provider: 'OpenAI',
  },
  {
    id: 'openai-gpt-5.6-sol',
    label: 'ChatGPT · GPT-5.6 Sol',
    provider: 'OpenAI',
  },
] as const

export type GeneKeysPromptLabModelId = (typeof GENE_KEYS_PROMPT_LAB_MODELS)[number]['id']
export const DEFAULT_GENE_KEYS_PROMPT_LAB_MODEL_ID: GeneKeysPromptLabModelId =
  'cloudflare-llama-3.1-8b-fast'

export type GeneKeysPromptLabUser = {
  id: string
  name: string
  createdAt: string
}

export const GENE_KEYS_SOURCE_OPTIONS = [
  {
    id: 'gene-keys',
    label: 'The Gene Keys',
    description: 'Richard Rudd’s full Gene Key chapter',
  },
  {
    id: '64-ways',
    label: 'The 64 Ways',
    description: 'Richard Rudd’s personal contemplation for the key',
  },
] as const

export type GeneKeysSourceId = (typeof GENE_KEYS_SOURCE_OPTIONS)[number]['id']

export type GeneKeysPromptLabRequest = {
  keyNumber: number
  sourceIds: GeneKeysSourceId[]
  prompt: string
  userId: string
  modelId: GeneKeysPromptLabModelId
}

export type GeneKeysPromptLabOutput = {
  oltr: string
  commentary: string
}

export type GeneKeysPromptLabGeneration = {
  id: string
  generatedAt: string
  keyNumber: number
  keyTitle: string
  sourceIds: GeneKeysSourceId[]
  prompt: string
  output: GeneKeysPromptLabOutput
  user: GeneKeysPromptLabUser
  modelId: GeneKeysPromptLabModelId
  model: string
  modelLabel: string
  modelProvider: string
  reviewStatus: 'draft-only'
  evidenceMode: 'prompt-only' | 'one-source' | 'two-source'
  warnings: string[]
}

export const isGeneKeysSourceId = (value: unknown): value is GeneKeysSourceId =>
  GENE_KEYS_SOURCE_OPTIONS.some((source) => source.id === value)

export const isGeneKeysPromptLabModelId = (
  value: unknown,
): value is GeneKeysPromptLabModelId =>
  GENE_KEYS_PROMPT_LAB_MODELS.some((model) => model.id === value)

export const getGeneKeysPromptLabModel = (modelId: GeneKeysPromptLabModelId) =>
  GENE_KEYS_PROMPT_LAB_MODELS.find((model) => model.id === modelId) ??
  GENE_KEYS_PROMPT_LAB_MODELS[0]

export const getEvidenceMode = (
  sourceIds: readonly GeneKeysSourceId[],
): GeneKeysPromptLabGeneration['evidenceMode'] => {
  if (sourceIds.length === 0) {
    return 'prompt-only'
  }

  return sourceIds.length === 1 ? 'one-source' : 'two-source'
}
