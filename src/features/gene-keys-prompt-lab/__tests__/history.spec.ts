import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GeneKeysPromptLabGeneration } from '@/features/gene-keys-prompt-lab/domain'
import {
  clearPromptLabHistory,
  GENE_KEYS_PROMPT_LAB_HISTORY_KEY,
  loadPromptLabHistory,
  savePromptLabGeneration,
} from '@/features/gene-keys-prompt-lab/history'

const generation: GeneKeysPromptLabGeneration = {
  generatedAt: '2026-08-26T23:00:00.000Z',
  keyNumber: 1,
  keyTitle: 'From Entropy to Syntropy',
  sourceIds: ['gene-keys', '64-ways'],
  prompt: 'Find a spacious language for this pattern.',
  output: {
    oltr: 'A fresh pattern gathers where creative pressure is allowed to find its own coherent form.',
    commentary:
      'Creative tension first appears as density without direction. Attention can make room for a fresher pattern to gather. The shift does not require force, only enough receptivity for form to reveal itself. Beauty becomes a horizon for recognizing coherence without possessing it.',
  },
  model: '@cf/meta/llama-3.1-8b-instruct-fast',
  reviewStatus: 'draft-only',
  evidenceMode: 'two-source',
  warnings: [],
}

describe('Gene Keys prompt lab history', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000001',
    )
  })

  it('saves a complete generation and reloads it', () => {
    const entries = savePromptLabGeneration(generation)

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ id: '00000000-0000-4000-8000-000000000001', ...generation })
    expect(loadPromptLabHistory()).toEqual(entries)
  })

  it('recovers safely from malformed storage and clears the versioned record', () => {
    localStorage.setItem(GENE_KEYS_PROMPT_LAB_HISTORY_KEY, '{broken')
    expect(loadPromptLabHistory()).toEqual([])

    clearPromptLabHistory()
    expect(localStorage.getItem(GENE_KEYS_PROMPT_LAB_HISTORY_KEY)).toBeNull()
  })
})
