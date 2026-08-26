import { describe, expect, it } from 'vitest'

import {
  convertToKingWenHexagram,
  XUAN_KONG_DA_GUA_LUO_PAN_ORDER_KING_WEN,
} from '../hexagramNumbering'

describe('hexagram numbering normalization', () => {
  it('keeps canonical King Wen identities unchanged', () => {
    expect(
      [1, 2, 29, 30].map((value) =>
        convertToKingWenHexagram({ numberingSystem: 'king-wen', value }),
      ),
    ).toEqual([1, 2, 29, 30])
  })

  it('converts bottom-line-LSB Fu Xi binary indexes for the four pure gua', () => {
    expect(convertToKingWenHexagram({ numberingSystem: 'fu-xi-binary', value: 63 })).toBe(1)
    expect(convertToKingWenHexagram({ numberingSystem: 'fu-xi-binary', value: 0 })).toBe(2)
    expect(convertToKingWenHexagram({ numberingSystem: 'fu-xi-binary', value: 18 })).toBe(29)
    expect(convertToKingWenHexagram({ numberingSystem: 'fu-xi-binary', value: 45 })).toBe(30)
  })

  it('converts one-based XKDG Luo Pan positions for the four pure gua', () => {
    expect(
      convertToKingWenHexagram({ numberingSystem: 'xuan-kong-da-gua-luo-pan', value: 32 }),
    ).toBe(1)
    expect(
      convertToKingWenHexagram({ numberingSystem: 'xuan-kong-da-gua-luo-pan', value: 64 }),
    ).toBe(2)
    expect(
      convertToKingWenHexagram({ numberingSystem: 'xuan-kong-da-gua-luo-pan', value: 46 }),
    ).toBe(29)
    expect(
      convertToKingWenHexagram({ numberingSystem: 'xuan-kong-da-gua-luo-pan', value: 14 }),
    ).toBe(30)
  })

  it('defines one complete, duplicate-free XKDG Luo Pan ring', () => {
    expect(XUAN_KONG_DA_GUA_LUO_PAN_ORDER_KING_WEN).toHaveLength(64)
    expect(new Set(XUAN_KONG_DA_GUA_LUO_PAN_ORDER_KING_WEN).size).toBe(64)
  })

  it('rejects ambiguous or out-of-range indexes', () => {
    expect(() => convertToKingWenHexagram({ numberingSystem: 'fu-xi-binary', value: 64 })).toThrow(
      /0 through 63/,
    )
    expect(() =>
      convertToKingWenHexagram({ numberingSystem: 'xuan-kong-da-gua-luo-pan', value: 0 }),
    ).toThrow(/1 through 64/)
  })
})
