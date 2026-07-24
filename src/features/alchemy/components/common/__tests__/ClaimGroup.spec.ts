import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { SourceClaim } from '../../../domain/types'
import ClaimGroup from '../ClaimGroup.vue'

const conflictedClaim: SourceClaim = {
  id: 'demo:claim:test',
  predicate: 'Thermal nature',
  value: 'Balanced — synthetic classification',
  status: 'conflicted',
  conflictGroupId: 'demo:conflict:test',
  citations: [
    {
      id: 'demo:citation:test',
      sourceId: 'demo:source:test',
      sourceTitle: 'Synthetic Test Index',
      locator: 'Leaf 1',
      url: 'javascript:alert(1)',
      reviewStatus: 'synthetic_fixture',
    },
  ],
}

describe('ClaimGroup', () => {
  it('renders source status, review status, conflict text, and safe citation behavior', () => {
    const wrapper = mount(ClaimGroup, {
      props: { title: 'Traditional nature', claims: [conflictedClaim] },
    })

    expect(wrapper.text()).toContain('Conflicting sources')
    expect(wrapper.text()).toContain('Synthetic fixture')
    expect(wrapper.text()).toContain('Unresolved alternative')
    expect(wrapper.text()).toContain('1 citation')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('keeps missing knowledge explicit', () => {
    const wrapper = mount(ClaimGroup, {
      props: { title: 'Compounds', claims: [] },
    })

    expect(wrapper.text()).toContain('Unavailable')
    expect(wrapper.text()).toContain('not available')
  })
})
