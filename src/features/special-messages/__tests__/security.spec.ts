import { describe, expect, it } from 'vitest'

import {
  decryptSpecialMessage,
  type EncryptedSpecialMessage,
} from '@/features/special-messages/security'

const testMessage: EncryptedSpecialMessage = {
  algorithmVersion: 1,
  iterations: 1_000,
  saltBase64: 'dGVzdC1zYWx0LTE2LWJ5dGU=',
  ivBase64: 'dGVzdC1pdi0xMi1i',
  ciphertextBase64:
    'SPEzKYvrSLRZZaCp3JGODNoiVUIcT7cGKa+0Wvt0Pa3hQoDMY+bWNwWs1bMnw/h+m90nHZm+w1mOuQ==',
}

describe('special message decryption', () => {
  it('returns the message for the matching test-only password', async () => {
    await expect(decryptSpecialMessage('example-only-password', testMessage)).resolves.toEqual({
      paragraphs: ['A private test message.'],
    })
  })

  it('does not expose the message for an incorrect password', async () => {
    await expect(decryptSpecialMessage('incorrect-password', testMessage)).resolves.toBeNull()
  })
})
