import { describe, expect, it } from 'vitest'

import { getHexagram, getHexagrams } from '../hexagrams'
import { changeHexagramLine, getInitialTransformations } from '../transformations'

describe('hexagram transformations', () => {
  it('computes the four initial structural transformations from bottom-to-top lines', () => {
    const transformations = getInitialTransformations(getHexagram(28))

    expect(transformations.map((item) => item.key)).toEqual([
      'nuclear',
      'reverse',
      'complement',
      'trigram-exchange',
    ])
    expect(transformations.map((item) => item.hexagram.number)).toEqual([1, 28, 27, 61])
    expect(transformations.every((item) => item.status === 'computed')).toBe(true)
  })

  it('changes exactly the selected line counted from the bottom', () => {
    const source = getHexagram(1)
    const result = changeHexagramLine(source, 1)

    expect(result.hexagram.number).toBe(44)
    expect(result.hexagram.linesBottomToTop).toEqual([
      'yin',
      'yang',
      'yang',
      'yang',
      'yang',
      'yang',
    ])
  })

  it('keeps every preset and single-line result inside the verified 64-figure catalog', () => {
    for (const source of getHexagrams()) {
      expect(getInitialTransformations(source)).toHaveLength(4)

      for (const line of [1, 2, 3, 4, 5, 6] as const) {
        const result = changeHexagramLine(source, line)
        const differences = source.linesBottomToTop.filter(
          (polarity, index) => polarity !== result.hexagram.linesBottomToTop[index],
        )
        expect(differences).toHaveLength(1)
      }
    }
  })
})
