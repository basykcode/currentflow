import {
  isGeneKeysSourceId,
  type GeneKeysPromptLabGeneration,
} from '@/features/gene-keys-prompt-lab/domain'

export const GENE_KEYS_PROMPT_LAB_HISTORY_KEY = 'current.gene-keys-prompt-lab.history.v1'
const HISTORY_VERSION = 1
const MAX_HISTORY_ENTRIES = 200

export type GeneKeysPromptLabHistoryEntry = GeneKeysPromptLabGeneration & {
  id: string
}

type StoredHistory = {
  version: typeof HISTORY_VERSION
  entries: GeneKeysPromptLabHistoryEntry[]
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isHistoryEntry = (value: unknown): value is GeneKeysPromptLabHistoryEntry => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as Partial<GeneKeysPromptLabHistoryEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.generatedAt === 'string' &&
    Number.isInteger(entry.keyNumber) &&
    typeof entry.keyNumber === 'number' &&
    entry.keyNumber >= 1 &&
    entry.keyNumber <= 64 &&
    typeof entry.keyTitle === 'string' &&
    Array.isArray(entry.sourceIds) &&
    entry.sourceIds.every(isGeneKeysSourceId) &&
    typeof entry.prompt === 'string' &&
    Boolean(entry.output) &&
    typeof entry.output?.oltr === 'string' &&
    typeof entry.output?.commentary === 'string' &&
    typeof entry.model === 'string' &&
    entry.reviewStatus === 'draft-only' &&
    ['prompt-only', 'one-source', 'two-source'].includes(entry.evidenceMode ?? '') &&
    isStringArray(entry.warnings)
  )
}

export function loadPromptLabHistory(storage: Storage = window.localStorage) {
  try {
    const raw = storage.getItem(GENE_KEYS_PROMPT_LAB_HISTORY_KEY)
    if (!raw) {
      return []
    }

    const stored = JSON.parse(raw) as Partial<StoredHistory>
    if (stored.version !== HISTORY_VERSION || !Array.isArray(stored.entries)) {
      return []
    }

    return stored.entries.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES)
  } catch {
    return []
  }
}

function persist(entries: readonly GeneKeysPromptLabHistoryEntry[], storage: Storage) {
  const stored: StoredHistory = {
    version: HISTORY_VERSION,
    entries: entries.slice(0, MAX_HISTORY_ENTRIES),
  }
  storage.setItem(GENE_KEYS_PROMPT_LAB_HISTORY_KEY, JSON.stringify(stored))
}

export function savePromptLabGeneration(
  generation: GeneKeysPromptLabGeneration,
  storage: Storage = window.localStorage,
) {
  const entry: GeneKeysPromptLabHistoryEntry = {
    id: globalThis.crypto.randomUUID(),
    ...generation,
  }
  const entries = [entry, ...loadPromptLabHistory(storage)].slice(0, MAX_HISTORY_ENTRIES)
  persist(entries, storage)
  return entries
}

export function clearPromptLabHistory(storage: Storage = window.localStorage) {
  storage.removeItem(GENE_KEYS_PROMPT_LAB_HISTORY_KEY)
}

export function exportPromptLabHistory(entries: readonly GeneKeysPromptLabHistoryEntry[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: HISTORY_VERSION,
      entries,
    },
    null,
    2,
  )
}
