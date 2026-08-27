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

  it('projects controlled intentions and up to three highest-ranked executions into the glance', () => {
    const bundle = createDemoGuidance(at)
    const wrapper = mount(GuidanceOutputPanel, {
      props: { bundle, density: 'glance', showOltr: false },
    })
    const intentionButtons = wrapper.findAll('.intention-glance-options button')
    const executionRecommendations = wrapper.findAll('.execution-glance-recommendation')

    expect(intentionButtons).toHaveLength(bundle.intentions.length)
    for (const selection of bundle.intentions) {
      expect(wrapper.get('[data-glance-item="intention"]').text()).toContain(
        selection.definition.character,
      )
      expect(wrapper.get('[data-glance-item="intention"]').text()).toContain(
        selection.definition.pinyin,
      )
      expect(wrapper.get('[data-glance-item="intention"]').text()).toContain(
        selection.definition.englishLabel,
      )
    }
    expect(wrapper.findAll('[data-intention-layout="identity-title-row"]')).toHaveLength(
      Math.min(bundle.intentions.length, 3),
    )
    expect(wrapper.get('[data-glance-item="intention"]').text()).not.toContain(
      bundle.selectedIntention.shortDefinition,
    )
    expect(wrapper.text()).not.toContain(bundle.primaryCurrent.label.value)
    expect(
      wrapper.get('[data-glance-item="intention"] .glance-panel-heading .eyebrow').text(),
    ).toBe('Intention')
    expect(
      wrapper.get('[data-glance-item="execution"] .glance-panel-heading .eyebrow').text(),
    ).toBe('Execution')

    expect(executionRecommendations).toHaveLength(Math.min(bundle.executions.length, 3))
    for (const selection of bundle.executions.slice(0, 3)) {
      expect(wrapper.text()).toContain(selection.definition.text)
      const recommendation = executionRecommendations.find((item) =>
        item.text().includes(selection.definition.text),
      )
      expect(recommendation?.attributes('aria-label')).toContain(
        selection.definition.observableEndpoint,
      )
      expect(recommendation?.attributes('aria-label')).toContain(selection.reasons[0])
    }
  })

  it('gives both glance regions an explicit unavailable state', () => {
    const bundle = createUnavailableGuidanceBundle({
      synthesisId: 'unavailable-glance-test',
      validFromUtc: at.toISOString(),
      boundaries: [
        {
          atUtc: new Date(at.getTime() + 60 * 60 * 1_000).toISOString(),
          reason: 'earthly-branch-hour-change',
        },
      ],
      reason: 'No reviewed day profile is connected.',
      sourceLabel: 'Test unavailable source',
    })
    const wrapper = mount(GuidanceOutputPanel, {
      props: { bundle, density: 'glance', showOltr: false },
    })

    expect(wrapper.get('[data-glance-item="intention"]').text()).toContain('Intention unavailable')
    expect(wrapper.get('[data-glance-item="execution"]').text()).toContain(
      'No execution recommendation',
    )
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.text()).toContain(bundle.reason)
  })
})
