import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HexagramTransitionInsight from '@/components/hexagrams/HexagramTransitionInsight.vue'

describe('HexagramTransitionInsight', () => {
  it('renders a draft-only source-grounded summary and method disclosure', async () => {
    const wrapper = mount(HexagramTransitionInsight, {
      props: {
        sourceHexagramNumber: 1,
        targetHexagramNumber: 44,
        changingLine: 1,
      },
    })
    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Forest of Changes · 1 → 44')
    })

    expect(wrapper.text()).toContain('Humane Order Stabilizes')
    expect(wrapper.text()).toContain('Draft · review required')

    await wrapper.get('details summary').trigger('click')
    expect(wrapper.get('details').text()).toContain('Christopher Gait')
    expect(wrapper.get('details').text()).toContain('not a quotation')
  })

  it('discloses a redirected source locator without exposing source prose', async () => {
    const wrapper = mount(HexagramTransitionInsight, {
      props: {
        sourceHexagramNumber: 27,
        targetHexagramNumber: 23,
        changingLine: 1,
      },
    })
    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Leaving the Native Element')
    })

    expect(wrapper.get('details').text()).toContain('27-23')
    expect(wrapper.get('details').text()).toContain('11-60')
    expect(wrapper.text()).not.toContain('The turtle spurns')
  })
})
