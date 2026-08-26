import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createUnavailableGuidanceBundle } from '@/domain/guidance/guidanceEngine'
import { createDemoGuidance } from '@/providers/demoGuidance'

import GuidanceOutputPanel from '../GuidanceOutputPanel.vue'

const at = new Date('2026-08-22T14:25:40.000Z')

describe('GuidanceOutputPanel', () => {
  it('renders the bundle and delegates alternative intention selection to the domain engine', async () => {
    const bundle = createDemoGuidance(at)
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })
    const originalOltr = bundle.oltr.text
    const alternativeButton = wrapper.findAll('.intention-options button')[1]

    expect(wrapper.text()).toContain(originalOltr)
    expect(wrapper.text()).toContain(bundle.selectedIntention.character)
    expect(wrapper.text()).toContain(bundle.selectedExecution.text)
    expect(alternativeButton).toBeDefined()

    await alternativeButton!.trigger('click')

    expect(wrapper.text()).toContain(originalOltr)
    expect(alternativeButton!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).not.toContain('No activity recommendations')
  })

  it('re-ranks execution by a user-selected safe category', async () => {
    const bundle = createDemoGuidance(at)
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })
    const originalAction = bundle.selectedExecution.text

    await wrapper.get('select').setValue('environment')

    expect(wrapper.text()).not.toContain(originalAction)
    expect(wrapper.text()).toContain('Place the materials for one supported task within reach')
  })

  it('renders explicit unavailability without inventing output', () => {
    const bundle = createUnavailableGuidanceBundle({
      synthesisId: 'unavailable-test',
      validFromUtc: at.toISOString(),
      boundaries: [
        {
          atUtc: new Date(at.getTime() + 60 * 60 * 1_000).toISOString(),
          reason: 'earthly-branch-hour-change',
        },
      ],
      reason: 'Reviewed semantic input is not connected.',
      sourceLabel: 'Test unavailable source',
    })
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })

    expect(wrapper.text()).toContain('Semantic input unavailable')
    expect(wrapper.text()).toContain(bundle.reason)
    expect(wrapper.find('.intention-options').exists()).toBe(false)
    expect(wrapper.find('select').exists()).toBe(false)
  })
})
