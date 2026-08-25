import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BrandMark from '../BrandMark.vue'

describe('BrandMark', () => {
  it('renders the official transparent logo as decorative wordmark artwork', () => {
    const wrapper = mount(BrandMark)
    const logo = wrapper.get('img.brand-mark')

    expect(logo.attributes('src')).toContain('current-flow-logo.png')
    expect(logo.attributes('alt')).toBe('')
    expect(logo.attributes('aria-hidden')).toBe('true')
    expect(logo.attributes('width')).toBe('512')
    expect(logo.attributes('height')).toBe('512')
  })
})
