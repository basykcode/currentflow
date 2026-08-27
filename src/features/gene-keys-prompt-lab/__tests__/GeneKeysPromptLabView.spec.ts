import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GeneKeysPromptLabView from '@/features/gene-keys-prompt-lab/views/GeneKeysPromptLabView.vue'

const generation = {
  id: 'generation-1',
  generatedAt: '2026-08-26T23:00:00.000Z',
  keyNumber: 1,
  keyTitle: 'From Entropy to Syntropy',
  sourceIds: [] as [],
  prompt: 'Try an original voice.',
  output: {
    oltr: 'Creative pressure becomes fresh form when attention stops forcing an answer and begins listening for coherence.',
    commentary:
      'A dense beginning can look inert before its pattern becomes visible. Receptive attention allows new form to gather without denying the pressure that preceded it. The movement is less an escape than a reorganization of what is already present. Beauty names the horizon where coherence can be recognized without being possessed.',
  },
  model: '@cf/meta/llama-3.1-8b-instruct-fast',
  modelId: 'cloudflare-llama-3.1-8b-fast' as const,
  modelLabel: 'Llama 3.1 8B · Fast',
  modelProvider: 'Cloudflare Workers AI',
  user: { id: 'ben-kind', name: 'Ben Kind', createdAt: '2026-08-27T00:00:00.000Z' },
  reviewStatus: 'draft-only' as const,
  evidenceMode: 'prompt-only' as const,
  warnings: ['Prompt-only experiment: this draft has no source-grounding claim.'],
}

const mocks = vi.hoisted(() => ({
  getPromptLabSession: vi.fn().mockResolvedValue(true),
  getPromptLabWorkspace: vi.fn(),
  createPromptLabUser: vi.fn(),
  generatePromptLabCommentary: vi.fn(),
  logOutOfPromptLab: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/gene-keys-prompt-lab/api', () => {
  return {
    ...mocks,
    GeneKeysPromptLabApiError: class extends Error {
      readonly status = 500
    },
  }
})

describe('GeneKeysPromptLabView', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.generatePromptLabCommentary.mockReset().mockResolvedValue(generation)
    mocks.getPromptLabWorkspace.mockReset().mockResolvedValue({
      users: [
        { id: 'ben-kind', name: 'Ben Kind', createdAt: '2026-08-27T00:00:00.000Z' },
        { id: 'anthony-love', name: 'Anthony Love', createdAt: '2026-08-27T00:00:00.000Z' },
      ],
      history: [],
    })
    mocks.createPromptLabUser.mockReset().mockResolvedValue({
      id: 'new-user',
      name: 'New User',
      createdAt: '2026-08-27T01:00:00.000Z',
    })
    mocks.logOutOfPromptLab.mockReset().mockResolvedValue(undefined)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000002',
    )
  })

  it('offers all keys, allows no source, generates, and restores the saved iteration', async () => {
    const wrapper = mount(GeneKeysPromptLabView)
    await flushPromises()

    const keySelect = wrapper.get<HTMLSelectElement>('#gene-key-selection')
    expect(keySelect.findAll('option')).toHaveLength(64)
    expect(keySelect.findAll('option')[0]?.text()).toContain('1 · From Entropy to Syntropy')

    const sourceChoices = wrapper.findAll<HTMLInputElement>('.source-choice input')
    expect(sourceChoices).toHaveLength(2)
    await sourceChoices[0]?.setValue(false)
    await sourceChoices[1]?.setValue(false)
    await wrapper.get<HTMLTextAreaElement>('#prompt-lab-prompt').setValue('Try an original voice.')
    await wrapper.get('form.composer').trigger('submit')
    await flushPromises()

    expect(mocks.generatePromptLabCommentary).toHaveBeenCalledWith({
      keyNumber: 1,
      sourceIds: [],
      prompt: 'Try an original voice.',
      userId: 'ben-kind',
      modelId: 'cloudflare-llama-3.1-8b-fast',
    })
    expect(wrapper.get('.oltr-block').text()).toContain('Creative pressure becomes fresh form')
    expect(wrapper.findAll('.history-entry')).toHaveLength(1)

    await keySelect.setValue(64)
    await wrapper.get<HTMLTextAreaElement>('#prompt-lab-prompt').setValue('Temporary edit')
    await wrapper.get('.history-entry').trigger('click')

    expect(keySelect.element.value).toBe('1')
    expect(wrapper.get<HTMLTextAreaElement>('#prompt-lab-prompt').element.value).toBe(
      'Try an original voice.',
    )
  })

  it('adds a shared user and remembers the selection', async () => {
    const wrapper = mount(GeneKeysPromptLabView)
    await flushPromises()

    await wrapper.get<HTMLSelectElement>('#prompt-lab-user').setValue('__add__')
    await wrapper.get<HTMLInputElement>('#prompt-lab-new-user').setValue('New User')
    await wrapper.get('form.add-user').trigger('submit')
    await flushPromises()

    expect(mocks.createPromptLabUser).toHaveBeenCalledWith('New User')
    expect(wrapper.get<HTMLSelectElement>('#prompt-lab-user').element.value).toBe('new-user')
  })

  it('keeps the workspace unlocked when the server cannot end the session', async () => {
    mocks.logOutOfPromptLab.mockRejectedValueOnce(new Error('Network unavailable'))
    const wrapper = mount(GeneKeysPromptLabView)
    await flushPromises()

    await wrapper.get('button.quiet-button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.prompt-lab-page').exists()).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toContain('session remains active')
  })
})
