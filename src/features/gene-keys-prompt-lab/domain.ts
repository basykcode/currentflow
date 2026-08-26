export const GENE_KEYS_PROMPT_MAX_LENGTH = 8_000
export const GENE_KEYS_PROMPT_LAB_MODEL_LABEL = 'Cloudflare Workers AI'

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
}

export type GeneKeysPromptLabOutput = {
  oltr: string
  commentary: string
}

export type GeneKeysPromptLabGeneration = {
  generatedAt: string
  keyNumber: number
  keyTitle: string
  sourceIds: GeneKeysSourceId[]
  prompt: string
  output: GeneKeysPromptLabOutput
  model: string
  reviewStatus: 'draft-only'
  evidenceMode: 'prompt-only' | 'one-source' | 'two-source'
  warnings: string[]
}

export const isGeneKeysSourceId = (value: unknown): value is GeneKeysSourceId =>
  GENE_KEYS_SOURCE_OPTIONS.some((source) => source.id === value)

export const getEvidenceMode = (
  sourceIds: readonly GeneKeysSourceId[],
): GeneKeysPromptLabGeneration['evidenceMode'] => {
  if (sourceIds.length === 0) {
    return 'prompt-only'
  }

  return sourceIds.length === 1 ? 'one-source' : 'two-source'
}
