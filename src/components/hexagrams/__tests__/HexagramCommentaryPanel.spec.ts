import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HexagramCommentaryPanel from '@/components/hexagrams/HexagramCommentaryPanel.vue'

describe('HexagramCommentaryPanel', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders six grounded lenses, source disclosure, and a calm insufficient state', async () => {
    const wrapper = mount(HexagramCommentaryPanel, {
      props: { hexagramNumber: 5 },
    })
    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.find('.commentary-panel__main').exists()).toBe(true)
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(6)
    expect(tabs[0]?.attributes('aria-selected')).toBe('true')
    expect(wrapper.get('.commentary-oltr-label').text()).toBe(
      'OLTR · One Line To Remember',
    )
    expect(wrapper.get('.commentary-panel__main').text()).toContain(
      'Stored strength meets danger',
    )

    await wrapper.get('.commentary-sources summary').trigger('click')
    expect(wrapper.get('.commentary-sources').text()).toContain(
      'The Classic of Changes',
    )
    expect(wrapper.get('.commentary-sources').text()).not.toContain(
      'daoist_2_wang_bi:hex-05',
    )

    await tabs[1]?.trigger('click')
    expect(wrapper.get('[role="tabpanel"]').text()).toContain(
      'No supported synthesis is available',
    )
    expect(wrapper.get('[role="tabpanel"]').text()).toContain('misidentified')
  })

  it('supports arrow-key navigation and remembers the last-selected school', async () => {
    const first = mount(HexagramCommentaryPanel, {
      props: { hexagramNumber: 5 },
      attachTo: document.body,
    })
    await flushPromises()

    const firstTabs = first.findAll('[role="tab"]')
    await firstTabs[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(firstTabs[1]?.attributes('aria-selected')).toBe('true')
    expect(window.localStorage.getItem('current.hexagram-commentary.school')).toBe(
      'buddhist',
    )
    first.unmount()

    const second = mount(HexagramCommentaryPanel, {
      props: { hexagramNumber: 5 },
    })
    await flushPromises()
    expect(second.findAll('[role="tab"]')[1]?.attributes('aria-selected')).toBe('true')
  })

  it('labels Human Design and Gene Keys as modern systems', async () => {
    const wrapper = mount(HexagramCommentaryPanel, {
      props: { hexagramNumber: 5 },
    })
    await flushPromises()

    await wrapper.findAll('[role="tab"]')[4]?.trigger('click')
    expect(wrapper.get('.commentary-meta').text()).toContain('Modern system')

    await wrapper.findAll('[role="tab"]')[5]?.trigger('click')
    expect(wrapper.get('.commentary-meta').text()).toContain('Modern system')
  })
})
