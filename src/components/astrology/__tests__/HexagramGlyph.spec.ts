import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { HexagramLines } from '@/domain/astrology/types'

import HexagramGlyph from '../HexagramGlyph.vue'

const lines: HexagramLines = ['yin', 'yang', 'yin', 'yang', 'yang', 'yin']

describe('HexagramGlyph', () => {
  it('renders exactly six lines', () => {
    const wrapper = mount(HexagramGlyph, { props: { lines } })

    expect(wrapper.findAll('.hexagram-line')).toHaveLength(6)
  })

  it('reverses bottom-to-top domain data only for visual display', () => {
    const wrapper = mount(HexagramGlyph, { props: { lines } })
    const renderedDomainIndexes = wrapper
      .findAll('.hexagram-line')
      .map((line) => line.attributes('data-domain-index'))
    const renderedPolarities = wrapper
      .findAll('.hexagram-line')
      .map((line) => line.attributes('data-polarity'))

    expect(renderedDomainIndexes).toEqual(['5', '4', '3', '2', '1', '0'])
    expect(renderedPolarities).toEqual([...lines].reverse())
  })

  it('renders one segment for yang and two equal-role segments for yin', () => {
    const wrapper = mount(HexagramGlyph, { props: { lines } })
    const yinLines = wrapper.findAll('.hexagram-line--yin')
    const yangLines = wrapper.findAll('.hexagram-line--yang')

    expect(yinLines).toHaveLength(3)
    expect(yangLines).toHaveLength(3)
    for (const line of yinLines) expect(line.findAll('.segment')).toHaveLength(2)
    for (const line of yangLines) expect(line.findAll('.segment')).toHaveLength(1)
  })
})
