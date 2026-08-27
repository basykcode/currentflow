import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HexagramLibraryView from '@/views/HexagramLibraryView.vue'

describe('HexagramLibraryView', () => {
  it('renders all 64 figures and changes their order without losing entries', async () => {
    const wrapper = mount(HexagramLibraryView, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.findAll('.library-card')).toHaveLength(64)
    expect(wrapper.findAll('.library-card')[0]?.attributes('aria-label')).toContain('Hexagram 1')

    await wrapper.get('select').setValue('fu-xi')

    expect(wrapper.findAll('.library-card')).toHaveLength(64)
    expect(wrapper.findAll('.library-card')[0]?.attributes('aria-label')).toContain('Hexagram 2')
  })

  it('filters by exact number and every requested identity field', async () => {
    const wrapper = mount(HexagramLibraryView, {
      global: {
        plugins: [createPinia()],
      },
    })
    const filter = wrapper.get('input[type="search"]')

    for (const query of [
      '28',
      'Preponderance of the Great',
      '大過',
      'Da Guo',
      'Purposelessness',
      'Totality',
      'Immortality',
    ]) {
      await filter.setValue(query)

      const cards = wrapper.findAll('.library-card')
      expect(cards).toHaveLength(1)
      expect(cards[0]?.attributes('aria-label')).toContain('Hexagram 28')
    }

    await filter.setValue('qian')
    const matchingLabels = wrapper
      .findAll('.library-card')
      .map((card) => card.attributes('aria-label'))
    expect(matchingLabels).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Hexagram 1'),
        expect.stringContaining('Hexagram 15'),
      ]),
    )
  })

  it('shows the Gene Keys spectrum on every card', () => {
    const wrapper = mount(HexagramLibraryView, {
      global: {
        plugins: [createPinia()],
      },
    })

    const firstSpectrum = wrapper.findAll('.gene-key-spectrum')[0]
    expect(firstSpectrum?.text()).toContain('ShadowEntropy')
    expect(firstSpectrum?.text()).toContain('GiftFreshness')
    expect(firstSpectrum?.text()).toContain('SiddhiBeauty')
    expect(
      firstSpectrum
        ?.findAll('.gene-key-frequency-icon')
        .map((icon) => icon.attributes('data-frequency-band')),
    ).toEqual(['shadow', 'gift', 'siddhi'])
  })

  it('reports an empty result and restores all cards when the filter is cleared', async () => {
    const wrapper = mount(HexagramLibraryView, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('input[type="search"]').setValue('no matching hexagram')

    expect(wrapper.findAll('.library-card')).toHaveLength(0)
    expect(wrapper.get('.empty-state').text()).toContain('No hexagrams match')
    expect(wrapper.get('.filter-summary').text()).toContain('0 of 64 hexagrams')

    await wrapper.get('.empty-state button').trigger('click')

    expect(wrapper.findAll('.library-card')).toHaveLength(64)
    expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('')
  })
})
