import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CurrentTaijiMark from '@/components/common/CurrentTaijiMark.vue'
import { getShichenIdentity } from '@/domain/astrology/shichen'
import { calculateHourPhase, type ShichenPhaseCoordinate } from '@/domain/time/chu-zheng-ke'

import ShichenFlowTimeline from '../ShichenFlowTimeline.vue'

const phaseAt = (elapsedBasisMinutes: number) => {
  const coordinate: ShichenPhaseCoordinate = {
    timeBasis: 'local-civil',
    elapsedBasisMinutes,
    totalBasisMinutes: 120,
    startUtc: '2026-08-25T18:00:00.000Z',
    endUtc: '2026-08-25T20:00:00.000Z',
    nextMinuteBoundaryUtc: '2026-08-25T18:01:00.000Z',
    nextMicroBoundaryUtc: '2026-08-25T18:15:00.000Z',
    nextMacroBoundaryUtc: '2026-08-25T19:00:00.000Z',
    nextShichenBoundaryUtc: '2026-08-25T20:00:00.000Z',
    warnings: [],
  }
  return calculateHourPhase(coordinate)
}

const summary =
  'Heart Organ System, Horse Shíchen. Macro Hour: Zhèng, Established. Micro Hour: Phase 2, Third Kè. Next: Goat Shíchen.'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ShichenFlowTimeline', () => {
  it('renders the complete structural Shíchen without progress language', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    const wrapper = mount(ShichenFlowTimeline, {
      props: {
        phase: phaseAt(90.8),
        nextShichen: getShichenIdentity(13),
        accessibleSummary: summary,
      },
    })

    expect(wrapper.findAll('[data-node-kind="major"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-node-kind="minor"]')).toHaveLength(6)
    expect(wrapper.findAll('[data-segment]')).toHaveLength(8)
    expect(wrapper.findAllComponents(CurrentTaijiMark)).toHaveLength(1)
    expect(wrapper.get('[data-marker-position]').attributes('data-marker-position')).toBe('90')
    expect(wrapper.get('figcaption').text()).toBe(summary)
    expect(wrapper.text()).toContain('NEXT')
    expect(wrapper.text()).not.toMatch(/END|percent|countdown|seconds/i)
    expect(wrapper.classes()).not.toContain('shichen-timeline--transition-ready')
  })

  it('moves the marker on ordinary minute passage without changing phase labels', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    const wrapper = mount(ShichenFlowTimeline, {
      props: {
        phase: phaseAt(21),
        nextShichen: getShichenIdentity(13),
        accessibleSummary: summary,
        lastEvent: 'minute-passage',
      },
    })
    const before = wrapper.get('[data-marker-position]').attributes('style')
    await wrapper.setProps({ phase: phaseAt(22) })

    expect(wrapper.get('[data-marker-position]').attributes('style')).not.toBe(before)
    expect(wrapper.text()).toContain('初')
    expect(wrapper.classes()).toContain('shichen-timeline--transition-ready')
  })

  it('disables the long position transition for a Shíchen reset', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    const wrapper = mount(ShichenFlowTimeline, {
      props: {
        phase: phaseAt(0),
        nextShichen: getShichenIdentity(15),
        accessibleSummary: summary,
        lastEvent: 'shichen-change',
      },
    })

    expect(wrapper.attributes('data-last-event')).toBe('shichen-change')
    expect(wrapper.classes()).not.toContain('shichen-timeline--transition-ready')
    expect(wrapper.get('[data-marker-position]').attributes('data-marker-position')).toBe('0')
  })

  it('exposes all eight Kè only in detailed density', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    const wrapper = mount(ShichenFlowTimeline, {
      props: {
        phase: phaseAt(60),
        nextShichen: getShichenIdentity(13),
        accessibleSummary: summary,
        density: 'detailed',
      },
    })

    expect(wrapper.findAll('.ke-legend li')).toHaveLength(8)
    expect(wrapper.text()).toContain('Established · fourth Kè')
    expect(wrapper.text()).toContain('NEXT · 未')
  })
})
