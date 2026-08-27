import { describe, expect, it, vi } from 'vitest'

import {
  handleGenerate,
  hasExactSourceOverlap,
} from '../../../../server/gene-keys-prompt-lab/generate'
import {
  createSessionToken,
  SESSION_COOKIE,
  verifySessionToken,
} from '../../../../server/gene-keys-prompt-lab/session'
import type { PromptLabEnv } from '../../../../server/gene-keys-prompt-lab/types'

function emptyState() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [], list_complete: true }),
  }
}

describe('Gene Keys prompt lab server boundary', () => {
  it('signs scoped sessions and rejects expired or altered tokens', async () => {
    const now = Date.UTC(2026, 7, 26)
    const token = await createSessionToken('a-long-local-test-secret', now)

    await expect(verifySessionToken(token, 'a-long-local-test-secret', now)).resolves.toBe(true)
    await expect(verifySessionToken(`${token}x`, 'a-long-local-test-secret', now)).resolves.toBe(
      false,
    )
    await expect(
      verifySessionToken(token, 'a-long-local-test-secret', now + 13 * 60 * 60 * 1_000),
    ).resolves.toBe(false)
  })

  it('detects exact eight-word overlap without rejecting original phrasing', () => {
    const source = {
      text: 'A hidden current carries these eight exact words across the private chapter boundary.',
    }

    expect(
      hasExactSourceOverlap(
        {
          oltr: 'A hidden current carries these eight exact words across.',
          commentary: 'Original supporting language.',
        },
        [source],
      ),
    ).toBe(true)
    expect(
      hasExactSourceOverlap(
        {
          oltr: 'Fresh attention lets pressure reorganize into a coherent and newly imagined form.',
          commentary: 'Original supporting language.',
        },
        [source],
      ),
    ).toBe(false)
  })

  it('detects an eight-word source sequence split by inserted marker words', () => {
    const source = {
      text: 'A hidden current carries these eight exact words across the private chapter boundary.',
    }

    expect(
      hasExactSourceOverlap(
        {
          oltr: 'A hidden current carries these eight exact marker words across.',
          commentary: 'Original supporting language.',
        },
        [source],
      ),
    ).toBe(true)
  })

  it('loads only selected source IDs and returns draft metadata without source text', async () => {
    const secret = 'another-long-local-test-secret'
    const token = await createSessionToken(secret)
    const aiRun = vi.fn().mockResolvedValue({
      response: JSON.stringify({
        oltr: 'A fresh orientation appears when creative tension is held without collapsing into a fixed and familiar answer.',
        commentary:
          'The beginning carries pressure that has not yet found its shape. Patient attention can let a new arrangement emerge without treating uncertainty as failure. Freshness names the capacity to meet the same material without repeating its old organization. Beauty remains a contemplative horizon for recognizing coherence rather than forcing it.',
      }),
    })
    const kvGet = vi.fn().mockResolvedValue('Private source words that do not appear in the output.')
    const state = emptyState()
    const env: PromptLabEnv = {
      AI: { run: aiRun },
      GENE_KEYS_SOURCES: { ...emptyState(), get: kvGet },
      PROMPT_LAB_STATE: state,
      PROMPT_LAB_PASSWORD: 'unused-in-this-test',
      PROMPT_LAB_SESSION_SECRET: secret,
    }
    const request = new Request('https://current-flow.net/api/gene-keys-lab/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${token}`,
        Origin: 'https://current-flow.net',
      },
      body: JSON.stringify({
        keyNumber: 1,
        sourceIds: ['gene-keys'],
        prompt: 'Find a new synthesis voice.',
        userId: 'ben-kind',
        modelId: 'cloudflare-llama-3.1-8b-fast',
      }),
    })

    const response = await handleGenerate({ request, env })
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(kvGet).toHaveBeenCalledWith('v1/gene-keys/hex_01.txt', 'text')
    expect(aiRun).toHaveBeenCalledOnce()
    expect(JSON.stringify(aiRun.mock.calls)).toContain('From Entropy to Syntropy')
    expect(body).toMatchObject({
      keyNumber: 1,
      keyTitle: 'From Entropy to Syntropy',
      sourceIds: ['gene-keys'],
      evidenceMode: 'one-source',
      reviewStatus: 'draft-only',
      user: { id: 'ben-kind', name: 'Ben Kind' },
      modelId: 'cloudflare-llama-3.1-8b-fast',
    })
    expect(state.put).toHaveBeenCalledOnce()
    expect(JSON.stringify(body)).not.toContain('Private source words')
  })

  it('uses the OpenAI Responses API without provider-side response storage', async () => {
    const secret = 'openai-local-test-secret-that-is-long-enough'
    const state = emptyState()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  oltr: 'Creative pressure becomes fresh form when attention listens for the coherent pattern already trying to emerge.',
                  commentary:
                    'A beginning can feel dense before its inner pattern becomes legible. Receptive attention lets form gather without treating uncertainty as a mistake. Freshness describes a new relationship with familiar material rather than a rejection of what came before. Beauty remains a contemplative horizon where coherence is recognized without being forced or possessed.',
                }),
              },
            ],
          },
        ],
      }),
    )
    const env: PromptLabEnv = {
      AI: { run: vi.fn() },
      GENE_KEYS_SOURCES: emptyState(),
      PROMPT_LAB_STATE: state,
      PROMPT_LAB_PASSWORD: 'unused',
      PROMPT_LAB_SESSION_SECRET: secret,
      OPENAI_API_KEY: 'test-key',
    }
    const token = await createSessionToken(secret)
    const response = await handleGenerate({
      request: new Request('https://current-flow.net/api/gene-keys-lab/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE}=${token}`,
          Origin: 'https://current-flow.net',
        },
        body: JSON.stringify({
          keyNumber: 1,
          sourceIds: [],
          prompt: 'Try OpenAI.',
          userId: 'anthony-love',
          modelId: 'openai-gpt-5.6-terra',
        }),
      }),
      env,
    })

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    )
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(typeof init.body).toBe('string')
    const requestBody = JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Record<
      string,
      unknown
    >
    expect(requestBody).toMatchObject({ model: 'gpt-5.6-terra', store: false })
    expect(state.put).toHaveBeenCalledOnce()
    fetchMock.mockRestore()
  })
})
