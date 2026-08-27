import { beforeEach, describe, expect, it } from 'vitest'

import {
  GENE_KEYS_PROMPT_LAB_MODEL_KEY,
  GENE_KEYS_PROMPT_LAB_USER_KEY,
  loadPreferredModelId,
  loadPreferredUserId,
  savePreferredModelId,
  savePreferredUserId,
} from '@/features/gene-keys-prompt-lab/history'

describe('Gene Keys prompt lab browser preferences', () => {
  beforeEach(() => localStorage.clear())

  it('remembers the selected shared user and model in this browser', () => {
    savePreferredUserId('anthony-love')
    savePreferredModelId('openai-gpt-5.6-terra')

    expect(loadPreferredUserId()).toBe('anthony-love')
    expect(loadPreferredModelId()).toBe('openai-gpt-5.6-terra')
    expect(localStorage.getItem(GENE_KEYS_PROMPT_LAB_USER_KEY)).toBe('anthony-love')
    expect(localStorage.getItem(GENE_KEYS_PROMPT_LAB_MODEL_KEY)).toBe(
      'openai-gpt-5.6-terra',
    )
  })

  it('falls back to Llama when a stale model preference is found', () => {
    localStorage.setItem(GENE_KEYS_PROMPT_LAB_MODEL_KEY, 'retired-model')
    expect(loadPreferredModelId()).toBe('cloudflare-llama-3.1-8b-fast')
  })
})
