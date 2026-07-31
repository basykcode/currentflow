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
    expect(wrapper.findAll('.transformation-card')).toHaveLength(4)
    expect(wrapper.get('.advanced-lab-button').text()).toContain('Advanced Transformation Lab')
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
    expect(wrapper.findAll('.transformation-card')[0]?.text()).toContain(
      'Relating / Changed Hexagram',
    )
    expect(wrapper.findAll('.transformation-card')[0]?.text()).toContain('13')

    await wrapper.findAll('.transformation-card')[2]?.trigger('click')
    expect(inspector.hexagram?.number).toBe(2)
  })

  it('opens the Lab in the same dialog and restores the exact base state', async () => {
    const wrapper = mount(HexagramInspector, {
      attachTo: document.body,
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })
    const inspector = useHexagramInspectorStore()

    inspector.open(5)
    await nextTick()
    const originalDialog = wrapper.get('[role="dialog"]').element
    const baseLineButtons = wrapper.findAll('[role="radio"]')
    await baseLineButtons[3]?.trigger('click')
    await wrapper.get('.advanced-lab-button').trigger('click')

    expect(wrapper.get('[role="dialog"]').element).toBe(originalDialog)
    expect(wrapper.get('#transformation-lab-title').text()).toBe('Transformation Lab')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(6)
    expect(wrapper.get('.source-panel').text()).toContain('Waiting')
    expect(wrapper.get('.source-panel').text()).toContain('4')

    await wrapper.get('.lab-back').trigger('click')
    expect(wrapper.get('.hexagram-identity').text()).toContain('Waiting')
    expect(wrapper.findAll('[role="radio"]')[3]?.attributes('aria-checked')).toBe('true')
  })

  it('opens a Lab target in the base view and returns to preserved Lab state', async () => {
    const wrapper = mount(HexagramInspector, {
      attachTo: document.body,
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })
    const inspector = useHexagramInspectorStore()

    inspector.open(5)
    await nextTick()
    await wrapper.get('.advanced-lab-button').trigger('click')
    await wrapper.findAll('[role="tab"]')[2]?.trigger('click')
    expect(inspector.screen?.kind).toBe('transformation-lab')
    expect(
      inspector.screen?.kind === 'transformation-lab' ? inspector.screen.activeSection : null,
    ).toBe('interior')

    const targetCard = wrapper
      .findAll('.transformation-card')
      .find((card) => card.text().includes('Central Nuclear'))
    expect(targetCard).toBeDefined()
    await targetCard?.trigger('click')

    expect(inspector.hexagram?.number).toBe(38)
    expect(wrapper.get('.arrival-context').text()).toContain('Central Nuclear')
    await wrapper.get('.modal-back').trigger('click')
    expect(wrapper.get('#transformation-lab-title').text()).toBe('Transformation Lab')
    expect(
      inspector.screen?.kind === 'transformation-lab' ? inspector.screen.activeSection : null,
    ).toBe('interior')
  })

  it('exposes all Lab sections, keyboard tab navigation, line controls, counts, and source gates', async () => {
    const wrapper = mount(HexagramInspector, {
      attachTo: document.body,
      global: {
        plugins: [createPinia()],
        stubs: {
          teleport: true,
        },
      },
    })
    const inspector = useHexagramInspectorStore()

    inspector.open(5)
    await nextTick()
    await wrapper.get('.advanced-lab-button').trigger('click')

    const tabs = wrapper.findAll('.lab-navigation [role="tab"]')
    expect(tabs.map((tab) => tab.text())).toEqual([
      'Explore',
      'Change Lab',
      'Interior',
      'Classical Systems',
      'Time & Maps',
      'Structure',
    ])

    await tabs[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(
      inspector.screen?.kind === 'transformation-lab' ? inspector.screen.activeSection : null,
    ).toBe('change-lab')

    const lineControls = wrapper.findAll('.interactive-glyph > button')
    expect(lineControls).toHaveLength(6)
    expect(lineControls.map((control) => control.attributes('aria-label'))).toEqual([
      expect.stringContaining('Line 6'),
      expect.stringContaining('Line 5'),
      expect.stringContaining('Line 4'),
      expect.stringContaining('Line 3'),
      expect.stringContaining('Line 2'),
      expect.stringContaining('Line 1'),
    ])

    const actionButtons = wrapper.findAll('.selector-actions button')
    await actionButtons.find((button) => button.text() === 'Select all')?.trigger('click')
    expect(
      inspector.screen?.kind === 'transformation-lab' ? inspector.screen.selectedMovingLines : [],
    ).toEqual([1, 2, 3, 4, 5, 6])
    expect(wrapper.get('.destination-details').text()).toContain('720 minimal paths')
    expect(wrapper.get('.destination-details').text()).toContain('Hamming distance')

    const changedLineFilter = wrapper.findAll('.filters select')[0]
    await changedLineFilter?.setValue('2')
    expect(wrapper.get('#destination-browser-title').element.parentElement?.textContent).toContain(
      '15 match the current filters',
    )
    expect(wrapper.text()).toContain('Counts: 6 · 15 · 20 · 15 · 6 · 1')
    expect(wrapper.text()).toContain('Transition repository not connected')

    await tabs[3]?.trigger('click')
    expect(wrapper.text()).toContain('Jing Fang Eight Palaces')
    expect(wrapper.text()).toContain('Source needed')
    expect(wrapper.text()).not.toContain('auspiciousness')
  })
})
