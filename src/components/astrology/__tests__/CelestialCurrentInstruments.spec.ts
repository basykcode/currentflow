import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createCelestialDevelopmentFixture,
  presentLunarHomeInstrument,
  presentSolarHomeInstrument,
} from '@/domain/current-flow/celestial-instruments'

import CelestialCurrentDetails from '../CelestialCurrentDetails.vue'
import CelestialCurrentHeader from '../CelestialCurrentHeader.vue'
import CelestialCycleRing from '../CelestialCycleRing.vue'
import LunarCurrentInstrument from '../LunarCurrentInstrument.vue'
import MoonPhaseGlyph from '../MoonPhaseGlyph.vue'
import SolarCurrentInstrument from '../SolarCurrentInstrument.vue'

const fixture = createCelestialDevelopmentFixture()
const lunar = presentLunarHomeInstrument(fixture.lunar)
const solar = presentSolarHomeInstrument(fixture.seasonal)

describe('LunarCurrentInstrument', () => {
  it('renders the complete phase disk, six-sector ring, marker, and exactly three Home values', async () => {
    const wrapper = mount(LunarCurrentInstrument, { props: { viewModel: lunar } })

    expect(wrapper.find('.moon-base').exists()).toBe(true)
    expect(wrapper.find('.moon-illumination').exists()).toBe(true)
    expect(wrapper.find('.moon-texture').attributes('clip-path')).toMatch(/^url\(#.+\)$/)
    expect(wrapper.findAll('[data-ring-label]')).toHaveLength(6)
    expect(wrapper.findAll('[data-active="true"]')).toHaveLength(1)
    expect(wrapper.get('.celestial-marker-orbit').attributes('style')).toContain('rotate(225deg)')
    expect(wrapper.findAll('[data-primary-value]')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('%')
    expect(wrapper.text()).not.toMatch(/\d+°/)
    expect(wrapper.get('button').attributes('aria-label')).toContain(
      'Xùn, Distribution. Yin Emerging',
    )
    expect(wrapper.find('.current-taiji-mark').attributes('data-taiji-size')).toBe('celestial')
    expect(wrapper.find('[src^="http"], [href^="http"]').exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('openDetails')).toHaveLength(1)
  })

  it('renders a neutral disk and explicit text when astronomical data are unavailable', () => {
    const wrapper = mount(LunarCurrentInstrument, {
      props: { viewModel: presentLunarHomeInstrument(null) },
    })

    expect(wrapper.find('.moon-neutral').exists()).toBe(true)
    expect(wrapper.text()).toContain('Lunar data unavailable')
    expect(wrapper.find('.celestial-marker-orbit').exists()).toBe(false)
  })
})

describe('SolarCurrentInstrument', () => {
  it('renders the static Sun, twelve Branches, twenty-four ticks, and three Home values', async () => {
    const wrapper = mount(SolarCurrentInstrument, { props: { viewModel: solar } })

    expect(wrapper.find('.sun-surface').exists()).toBe(true)
    expect(wrapper.findAll('[data-ring-label]')).toHaveLength(12)
    expect(wrapper.findAll('[data-ring-tick]')).toHaveLength(24)
    expect(wrapper.findAll('[data-cardinal="true"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-active="true"]')).toHaveLength(1)
    expect(wrapper.get('.celestial-marker-orbit').attributes('style')).toContain('rotate(240deg)')
    expect(wrapper.findAll('[data-primary-value]')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('%')
    expect(wrapper.text()).not.toMatch(/\d+°/)
    expect(wrapper.get('[data-active-branch]').text()).toContain('申 Shēn')
    expect(wrapper.get('button').attributes('aria-label')).toContain('Active Branch Shēn')
    expect(wrapper.find('.current-taiji-mark').exists()).toBe(true)
    expect(wrapper.find('[src^="http"], [href^="http"]').exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('openDetails')).toHaveLength(1)
  })

  it('keeps the Sun complete while making unavailable Seasonal data explicit', () => {
    const wrapper = mount(SolarCurrentInstrument, {
      props: { viewModel: presentSolarHomeInstrument(null) },
    })

    expect(wrapper.find('.sun-surface').exists()).toBe(true)
    expect(wrapper.find('.sun-disk--neutral').exists()).toBe(true)
    expect(wrapper.text()).toContain('Seasonal data unavailable')
  })
})

describe('celestial marker motion policy', () => {
  const labels = [{ character: '子', accessibleLabel: 'Zǐ, Rat' }] as const

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the supplied angle on first render without enabling an initial sweep', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    const wrapper = mount(CelestialCycleRing, {
      props: { labels, markerAngleDegrees: 315, kind: 'lunar' },
    })

    expect(wrapper.get('.celestial-marker-orbit').attributes('style')).toContain('rotate(315deg)')
    expect(wrapper.classes()).not.toContain('celestial-cycle-ring--transition-ready')
    expect(wrapper.get('.ring-orbit').attributes('transform')).toBeUndefined()
  })

  it('suppresses interpolation for selected-time jumps and all motion in reduced mode', () => {
    const wrapper = mount(CelestialCycleRing, {
      props: {
        labels,
        markerAngleDegrees: 180,
        interpolateMarker: false,
        reduceMotion: true,
        kind: 'solar',
      },
    })

    expect(wrapper.classes()).toContain('celestial-cycle-ring--reduced-motion')
    expect(wrapper.classes()).not.toContain('celestial-cycle-ring--transition-ready')
  })
})

describe('celestial composition and details', () => {
  it('keeps the central clock functional when either instrument is unavailable', () => {
    vi.useFakeTimers()
    const wrapper = mount(CelestialCurrentHeader, {
      props: {
        lunar: presentLunarHomeInstrument(null),
        solar,
        timezone: 'UTC',
      },
    })

    expect(wrapper.findAll('[data-celestial-instrument]')).toHaveLength(2)
    expect(wrapper.get('h1').text()).toBe('The Current Flow')
    expect(wrapper.find('.yin-clock').exists()).toBe(true)
    expect(wrapper.get('.yin-clock__time').text()).toMatch(/^\d{2}:\d{2}$/)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('opens one shared details shell at the requested section and exposes provenance', async () => {
    const wrapper = mount(CelestialCurrentDetails, { props: { lunar, solar } })
    const exposed = wrapper.vm as unknown as {
      open: (target: { kind: 'lunar-current' | 'seasonal-current' }) => Promise<void>
    }

    await exposed.open({ kind: 'lunar-current' })
    expect(wrapper.get('[role="dialog"]').text()).toContain('Lunar Current details')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Astronomical calculation')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Chinese calendar classification')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Current Flow visual mapping')

    await wrapper.get('[aria-label="Close celestial details"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await exposed.open({ kind: 'seasonal-current' })
    expect(wrapper.get('[role="dialog"]').text()).toContain('Seasonal Current details')
    expect(wrapper.get('[role="dialog"]').text()).toContain('150.000°')
  })

  it('generates collision-safe local SVG definition IDs for repeated bodies', () => {
    const RepeatedMoons = defineComponent({
      components: { MoonPhaseGlyph },
      template:
        '<div><MoonPhaseGlyph :illumination-fraction="0.5" waxing /><MoonPhaseGlyph :illumination-fraction="0.5" waxing /></div>',
    })
    const wrapper = mount(RepeatedMoons)
    const clipIds = wrapper.findAll('clipPath').map((clip) => clip.attributes('id'))

    expect(new Set(clipIds).size).toBe(2)
  })
})
