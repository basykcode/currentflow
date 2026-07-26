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
    expect(wrapper.findAll('.library-card')[0]?.attributes('aria-label')).toContain(
      'Hexagram 1',
    )

    await wrapper.get('select').setValue('fu-xi')

    expect(wrapper.findAll('.library-card')).toHaveLength(64)
    expect(wrapper.findAll('.library-card')[0]?.attributes('aria-label')).toContain(
      'Hexagram 2',
    )
  })
})
