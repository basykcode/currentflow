import { getHexagram, getHexagrams } from './hexagrams'

export type HexagramNumberReference =
  | {
      numberingSystem: 'king-wen'
      /** Canonical received-sequence ID, 1-64. */
      value: number
    }
  | {
      numberingSystem: 'fu-xi-binary'
      /** Six-bit value, 0-63, with the bottom line as the least-significant bit. */
      value: number
    }
  | {
      numberingSystem: 'xuan-kong-da-gua-luo-pan'
      /** One-based clockwise Luo Pan ring position, 1-64, beginning with 復 at north. */
      value: number
    }

/**
 * Canonical King Wen IDs by one-based clockwise XKDG Luo Pan position.
 *
 * This is intentionally named as a Luo Pan position rather than a generic "XKDG number". XKDG
 * tables also publish Gua Qi and Gua Yun numbers, which are classifications rather than identities.
 */
export const XUAN_KONG_DA_GUA_LUO_PAN_ORDER_KING_WEN: readonly number[] = [
  24, 27, 3, 42, 51, 21, 17, 25, 36, 22, 63, 37, 55, 30, 49, 13, 19, 41, 60, 61, 54, 38, 58, 10, 11,
  26, 5, 9, 34, 14, 43, 1, 44, 28, 50, 32, 57, 48, 18, 46, 6, 47, 64, 40, 59, 29, 4, 7, 33, 31, 56,
  62, 53, 39, 52, 15, 12, 45, 35, 16, 20, 8, 23, 2,
]

const assertIntegerInRange = (value: number, minimum: number, maximum: number, label: string) => {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${label} must be an integer from ${minimum} through ${maximum}; received ${value}.`,
    )
  }
}

export const convertToKingWenHexagram = (reference: HexagramNumberReference): number => {
  switch (reference.numberingSystem) {
    case 'king-wen':
      assertIntegerInRange(reference.value, 1, 64, 'King Wen ID')
      return getHexagram(reference.value).number
    case 'fu-xi-binary': {
      assertIntegerInRange(reference.value, 0, 63, 'Fu Xi binary index')
      const hexagram = getHexagrams('fu-xi')[reference.value]
      if (!hexagram) {
        throw new Error(`No hexagram exists at Fu Xi binary index ${reference.value}.`)
      }
      return hexagram.number
    }
    case 'xuan-kong-da-gua-luo-pan': {
      assertIntegerInRange(reference.value, 1, 64, 'Xuan Kong Da Gua Luo Pan position')
      const kingWenId = XUAN_KONG_DA_GUA_LUO_PAN_ORDER_KING_WEN[reference.value - 1]
      if (!kingWenId) {
        throw new Error(`No hexagram exists at XKDG Luo Pan position ${reference.value}.`)
      }
      return getHexagram(kingWenId).number
    }
  }
}
