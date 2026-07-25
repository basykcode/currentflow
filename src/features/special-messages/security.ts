export interface EncryptedSpecialMessage {
  readonly algorithmVersion: 1
  readonly iterations: number
  readonly saltBase64: string
  readonly ivBase64: string
  readonly ciphertextBase64: string
}

export interface SpecialMessageContent {
  readonly paragraphs: readonly string[]
}

const ADDITIONAL_DATA = 'current-flow:special-message:vh:v1'

const vhMessage: EncryptedSpecialMessage = {
  algorithmVersion: 1,
  iterations: 310_000,
  saltBase64: 'HNMklu7/nTL66wCYdPG7fg==',
  ivBase64: 'werdornDdO+Svq+E',
  ciphertextBase64:
    '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',
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(globalThis.atob(value), (character) => character.charCodeAt(0))
}

function parseMessage(value: string): SpecialMessageContent | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null || !('paragraphs' in parsed)) {
    return null
  }

  const paragraphs = parsed.paragraphs
  if (
    !Array.isArray(paragraphs) ||
    paragraphs.length === 0 ||
    !paragraphs.every((paragraph) => typeof paragraph === 'string')
  ) {
    return null
  }

  return {
    paragraphs,
  }
}

export async function decryptSpecialMessage(
  password: string,
  encryptedMessage: EncryptedSpecialMessage,
): Promise<SpecialMessageContent | null> {
  if (password.length === 0 || encryptedMessage.algorithmVersion !== 1) {
    return null
  }

  try {
    const passwordKey = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password.normalize('NFKC')),
      'PBKDF2',
      false,
      ['deriveKey'],
    )
    const encryptionKey = await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: decodeBase64(encryptedMessage.saltBase64),
        iterations: encryptedMessage.iterations,
      },
      passwordKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt'],
    )
    const decrypted = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: decodeBase64(encryptedMessage.ivBase64),
        additionalData: new TextEncoder().encode(ADDITIONAL_DATA),
      },
      encryptionKey,
      decodeBase64(encryptedMessage.ciphertextBase64),
    )

    return parseMessage(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

export function unlockVhMessage(password: string): Promise<SpecialMessageContent | null> {
  return decryptSpecialMessage(password, vhMessage)
}
