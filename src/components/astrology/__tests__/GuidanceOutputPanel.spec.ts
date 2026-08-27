import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createGuidanceFixture } from '@/domain/guidance/__tests__/fixtures'
import {
  createGuidanceBundle,
  createUnavailableGuidanceBundle,
} from '@/domain/guidance/guidanceEngine'
import { createDemoGuidance } from '@/providers/demoGuidance'

import GuidanceOutputPanel from '../GuidanceOutputPanel.vue'

const at = new Date('2026-08-22T14:25:40.000Z')

describe('GuidanceOutputPanel', () => {
  it('renders three ranked intentions, three Elemental work domains, and the active Organ', () => {
    const bundle = createDemoGuidance(at)
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })

    expect(wrapper.text()).toContain(bundle.oltr.text)
    expect(wrapper.findAll('.intention-options button')).toHaveLength(3)
    expect(wrapper.findAll('.choice-rank').map((rank) => rank.text())).toEqual([
      'Rank 1',
      'Rank 2',
      'Rank 3',
    ])
    for (const selection of bundle.intentions) {
      expect(wrapper.text()).toContain(selection.definition.character)
      expect(wrapper.text()).toContain(selection.definition.englishLabel)
    }

    expect(wrapper.findAll('.execution-card')).toHaveLength(3)
    expect(wrapper.findAll('.execution-rank').map((rank) => rank.text())).toEqual(['1', '2', '3'])
    for (const selection of bundle.executions) {
      expect(wrapper.text()).toContain(selection.definition.title)
      expect(wrapper.text()).toContain(selection.definition.taskDomains[0])
    }

    expect(wrapper.get('.active-organ').text()).toContain('肝 Liver')
    expect(wrapper.get('.active-organ').text()).toContain('Wood')
    const activeOrganCards = wrapper.findAll('.execution-card--active-organ')
    expect(activeOrganCards).toHaveLength(1)
    expect(activeOrganCards[0]?.text()).toContain('Active-organ element')
    expect(activeOrganCards[0]?.text()).toContain('Wood · Mù')
  })

  it('delegates intention selection while keeping OLTR and ranked-domain invariants fixed', async () => {
    const bundle = createDemoGuidance(at)
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })
    const originalOltr = bundle.oltr.text
    const alternative = bundle.intentions[1]
    const alternativeButton = wrapper.findAll('.intention-options button')[1]
    expect(alternative).toBeDefined()
    expect(alternativeButton).toBeDefined()

    await alternativeButton!.trigger('click')

    expect(wrapper.text()).toContain(originalOltr)
    expect(alternativeButton!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[role="status"]').text()).toContain(
      `${alternative!.definition.englishLabel} selected`,
    )
    expect(wrapper.get('[role="status"]').text()).toContain('Execution ranking updated')
    expect(wrapper.findAll('.intention-options button')).toHaveLength(3)
    expect(wrapper.findAll('.execution-card')).toHaveLength(3)
    expect(wrapper.findAll('.execution-card--active-organ')).toHaveLength(1)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('visually hides the duplicate section heading when the OLTR is rendered elsewhere', () => {
    const wrapper = mount(GuidanceOutputPanel, {
      props: { bundle: createDemoGuidance(at), showOltr: false },
    })

    expect(wrapper.find('.guidance-oltr').exists()).toBe(false)
    expect(wrapper.get('#guidance-output-heading').classes()).toContain('visually-hidden')
  })

  it('distinguishes an active Fu organ from the Elemental spirit Zang correspondence', () => {
    const input = createGuidanceFixture('threshold')
    const bundle = createGuidanceBundle({
      ...input,
      operativeWork: {
        ...input.operativeWork,
        activeOrgan: {
          key: 'bladder',
          nameEnglish: 'Bladder',
          nameChinese: '膀胱',
          element: 'water',
          sourceLabel: 'Guidance panel Fu-organ test fixture',
          methodologyId: input.environmentVersion,
        },
      },
    })
    const wrapper = mount(GuidanceOutputPanel, { props: { bundle } })
    const waterCard = wrapper
      .findAll('.execution-card')
      .find((card) => card.text().includes('Water · Shuǐ'))

    expect(wrapper.get('.active-organ').text()).toContain('膀胱 Bladder')
    expect(waterCard).toBeDefined()
    expect(waterCard!.text()).toContain('志 Zhì · Kidney correspondence')
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
    expect(wrapper.find('.execution-list').exists()).toBe(false)
    expect(wrapper.find('.active-organ').exists()).toBe(false)
  })
})
