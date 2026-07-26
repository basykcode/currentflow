import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import HexagramInspector from '@/components/hexagrams/HexagramInspector.vue'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

describe('HexagramInspector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('shows identity, transformations, Gene Key vocabulary, and commentary views', async () => {
    const wrapper = mount(HexagramInspector, {
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })
    const inspector = useHexagramInspectorStore()

    inspector.open(28)
    await nextTick()

    expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true')
    expect(wrapper.get('.hexagram-identity').text()).toContain('Preponderance of the Great')
    expect(wrapper.get('.hexagram-identity').text()).toContain('大過')
    expect(wrapper.get('.hexagram-identity').text()).toContain('Dà Guò')
    expect(wrapper.findAll('.transformation-button')).toHaveLength(5)
    expect(wrapper.get('.gene-key-spectrum').text()).toContain('Purposelessness')
    expect(wrapper.get('.gene-key-spectrum').text()).toContain('Totality')
    expect(wrapper.get('.gene-key-spectrum').text()).toContain('Immortality')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(6)

    await wrapper.findAll('[role="tab"]')[2]?.trigger('click')
    expect(wrapper.get('[role="tabpanel"]').text()).toContain('Buddhism')

    await wrapper.get('.inspector-close').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('recomputes a selected changing line and switches to a transformation', async () => {
    const wrapper = mount(HexagramInspector, {
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })
    const inspector = useHexagramInspectorStore()

    inspector.open(1)
    await nextTick()

    const lineButtons = wrapper.findAll('[role="radio"]')
    await lineButtons[1]?.trigger('click')

    expect(lineButtons[1]?.attributes('aria-checked')).toBe('true')
    expect(wrapper.findAll('.transformation-button')[4]?.text()).toContain('Line 2 changes')

    await wrapper.findAll('.transformation-button')[2]?.trigger('click')
    expect(inspector.hexagram?.number).toBe(2)
  })
})
