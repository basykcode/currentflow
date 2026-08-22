import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganIllustration from '../OrganIllustration.vue'
import { ORGAN_ICON_KEYS, ORGAN_ICONS } from '../organIcons'

describe('OrganIllustration', () => {
  it('provides a distinct SVG definition for every organ-clock period', () => {
    expect(ORGAN_ICON_KEYS).toHaveLength(12)
    expect(new Set(ORGAN_ICON_KEYS.map((key) => ORGAN_ICONS[key].silhouette.join(' '))).size).toBe(
      12,
    )
  })

  it.each(ORGAN_ICON_KEYS)('renders the %s icon without a generic check mark', (organKey) => {
    const wrapper = mount(OrganIllustration, { props: { organKey } })

    expect(wrapper.attributes('data-organ')).toBe(organKey)
    expect(wrapper.findAll('.silhouette')).toHaveLength(ORGAN_ICONS[organKey].silhouette.length)
    expect(wrapper.find('.inner-line').exists()).toBe(false)
  })
})
