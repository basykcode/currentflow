import {
  DEFAULT_GENE_KEYS_PROMPT_LAB_MODEL_ID,
  isGeneKeysPromptLabModelId,
  type GeneKeysPromptLabGeneration,
  type GeneKeysPromptLabModelId,
} from '@/features/gene-keys-prompt-lab/domain'

export const GENE_KEYS_PROMPT_LAB_USER_KEY = 'current.gene-keys-prompt-lab.user.v1'
export const GENE_KEYS_PROMPT_LAB_MODEL_KEY = 'current.gene-keys-prompt-lab.model.v1'

export type GeneKeysPromptLabHistoryEntry = GeneKeysPromptLabGeneration

export function loadPreferredUserId(storage: Storage = window.localStorage) {
  return storage.getItem(GENE_KEYS_PROMPT_LAB_USER_KEY)
}

export function savePreferredUserId(userId: string, storage: Storage = window.localStorage) {
  storage.setItem(GENE_KEYS_PROMPT_LAB_USER_KEY, userId)
}

export function loadPreferredModelId(storage: Storage = window.localStorage) {
  const value = storage.getItem(GENE_KEYS_PROMPT_LAB_MODEL_KEY)
  return isGeneKeysPromptLabModelId(value) ? value : DEFAULT_GENE_KEYS_PROMPT_LAB_MODEL_ID
}

export function savePreferredModelId(
  modelId: GeneKeysPromptLabModelId,
  storage: Storage = window.localStorage,
) {
  storage.setItem(GENE_KEYS_PROMPT_LAB_MODEL_KEY, modelId)
}

export function exportPromptLabHistory(entries: readonly GeneKeysPromptLabHistoryEntry[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 2,
      storage: 'shared-server-history',
      entries,
    },
    null,
    2,
  )
}
