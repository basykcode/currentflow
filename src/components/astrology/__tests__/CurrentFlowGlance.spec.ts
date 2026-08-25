import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import { DemoCurrentFlowProvider } from '@/providers/demoCurrentFlow'
import { createDemoGuidance } from '@/providers/demoGuidance'
import { LunarScriptCurrentFlowProvider } from '@/providers/lunarScriptCurrentFlow'
import { LocalDeterministicCelestialCurrentProvider } from '@/providers/localDeterministicCelestialCurrent'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

import CalculationProvenanceDetails from '../CalculationProvenanceDetails.vue'
import CurrentFlowGlance from '../CurrentFlowGlance.vue'
import CurrentFlowOltr from '../CurrentFlowOltr.vue'

const getSnapshot = () =>
  new DemoCurrentFlowProvider().getSnapshot(new Date('2026-08-22T14:25:40.000Z'))

const mountGlance = (snapshot: CurrentFlowSnapshot, timezone = 'America/Los_Angeles') => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(CurrentFlowGlance, {
    props: { snapshot, timezone },
    global: { plugins: [pinia] },
  })
}

describe('CurrentFlowGlance', () => {
  it('preserves the canonical snapshot and locked glance order', async () => {
    const snapshot = await getSnapshot()
    const wrapper = mountGlance(snapshot)

    expect(
      wrapper
        .findAll('[data-glance-section]')
        .map((node) => node.attributes('data-glance-section')),
    ).toEqual(['header', 'signature', 'oltr'])
    expect(
      wrapper
        .get('[data-glance-row="temporal"]')
        .findAll('[data-glance-item]')
        .map((node) => node.attributes('data-glance-item')),
    ).toEqual(['year', 'day', 'month'])
    expect(
      wrapper
        .get('[data-glance-row="active"]')
        .findAll('[data-glance-item]')
        .map((node) => node.attributes('data-glance-item')),
    ).toEqual(['organ', 'hour'])

    expect(wrapper.get('[data-glance-item="year"] .hexagram-title').text()).toBe(
      snapshot.temporal.year.hexagram.nameEnglish,
    )
    expect(wrapper.get('[data-glance-item="day"] .hexagram-title').text()).toBe(
      snapshot.temporal.day.hexagram.nameEnglish,
    )
    expect(wrapper.get('[data-glance-item="month"] .hexagram-title').text()).toBe(
      snapshot.temporal.month.hexagram.nameEnglish,
    )
    expect(wrapper.get('[data-glance-item="hour"] .hexagram-title').text()).toBe(
      snapshot.temporal.hour.hexagram.nameEnglish,
    )
    expect(wrapper.get('[data-glance-item="organ"]').text()).toContain(
      snapshot.organ.nameEnglish.replace(/ period$/i, ''),
    )
    expect(snapshot.guidance.status).toBe('available')
    if (snapshot.guidance.status !== 'available') throw new Error('Expected demo guidance.')
    expect(wrapper.get('[data-glance-section="oltr"]').text()).toContain(
      snapshot.guidance.oltr.text,
    )

    expect(wrapper.get('[data-glance-item="year"] .hexagram-card').attributes('data-density')).toBe(
      'glance-compact',
    )
    expect(wrapper.get('[data-glance-item="day"] .hexagram-card').attributes('data-density')).toBe(
      'glance-featured',
    )
    expect(
      wrapper.get('[data-glance-item="month"] .hexagram-card').attributes('data-density'),
    ).toBe('glance-compact')
    expect(wrapper.text()).not.toContain('Exact bounds')
    expect(wrapper.text()).not.toContain('Interface fixture · not calculated')

    wrapper.unmount()
  })

  it('opens the existing inspector for the selected temporal card and emits organ details', async () => {
    const snapshot = await getSnapshot()
    const wrapper = mountGlance(snapshot)
    const inspector = useHexagramInspectorStore()

    await wrapper.get('[data-glance-item="day"] .card-action').trigger('keydown', { key: 'Enter' })
    expect(inspector.hexagram?.number).toBe(snapshot.temporal.day.hexagram.number)

    await wrapper.get('[data-glance-item="organ"] .card-action').trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('openOrganDetails')).toHaveLength(1)

    wrapper.unmount()
  })

  it('keeps long titles, timezone metadata, and the complete OLTR in the document', async () => {
    const base = await getSnapshot()
    const longOltr =
      'Reduce the load and repair the source before asking the system to move, leaving enough room for the next useful opening to become visible.'
    if (base.guidance.status !== 'available') throw new Error('Expected demo guidance.')
    const snapshot: CurrentFlowSnapshot = {
      ...base,
      temporal: {
        ...base.temporal,
        year: {
          ...base.temporal.year,
          hexagram: {
            ...base.temporal.year.hexagram,
            nameEnglish: 'Preponderance of the Great',
          },
        },
      },
      guidance: {
        ...base.guidance,
        oltr: { ...base.guidance.oltr, text: longOltr },
      },
    }
    const wrapper = mountGlance(snapshot, 'America/Argentina/Buenos_Aires')

    expect(wrapper.get('[data-glance-item="year"] .hexagram-title').text()).toBe(
      'Preponderance of the Great',
    )
    expect(wrapper.get('.yin-clock__timezone').text()).toBe('GMT−03:00')
    expect(wrapper.get('.yin-clock__timezone').attributes('title')).toContain(
      'America/Argentina/Buenos_Aires',
    )
    expect(wrapper.get('[data-glance-section="oltr"] p').text()).toBe(longOltr)

    wrapper.unmount()
  })

  it('accepts a future personalized section label without duplicating the layout', async () => {
    const snapshot = await getSnapshot()
    const pinia = createPinia()
    const wrapper = mount(CurrentFlowGlance, {
      props: {
        snapshot,
        timezone: 'UTC',
        sectionLabel: 'Your Current Flow',
      },
      global: { plugins: [pinia] },
    })

    expect(wrapper.get('h1').text()).toBe('Your Current Flow')
    expect(wrapper.findAll('[data-glance-section="signature"]')).toHaveLength(1)

    wrapper.unmount()
  })

  it('keeps zodiac art above proportionally scaled glyphs and renders canonical identity data', async () => {
    const snapshot = await new LunarScriptCurrentFlowProvider().getSnapshot(
      new Date('2026-08-22T23:05:30.000Z'),
      { timezone: 'America/Los_Angeles' },
    )
    const wrapper = mountGlance(snapshot)
    const expectedSources = {
      year: '/media/zodiac/horse/horse_fire.avif',
      day: '/media/zodiac/dragon/dragon_earth.avif',
      month: '/media/zodiac/monkey/monkey_fire.avif',
      hour: '/media/zodiac/monkey/monkey_metal.avif',
    } as const

    for (const [scope, source] of Object.entries(expectedSources)) {
      const item = wrapper.get(`[data-glance-item="${scope}"]`)
      const card = item.get('.hexagram-card')
      const glyphRow = card.get('.glyph-wrap')
      const zodiacRow = card.get('.zodiac-wrap')
      const image = zodiacRow.get('.zodiac-illustration')
      const temporal = snapshot.temporal[scope as keyof typeof snapshot.temporal]

      expect(glyphRow.element.firstElementChild?.classList.contains('hexagram-glyph')).toBe(true)
      expect(zodiacRow.element.nextElementSibling).toBe(glyphRow.element)
      expect(image.attributes('src')).toBe(source)
      expect(image.attributes('alt')).toBe('')
      expect(item.get('.ganzhi').text()).not.toMatch(/\b(?:Yin|Yang)\b/)
      expect(item.get('.hexagram-language').text()).toBe(
        `${temporal.hexagram.nameChinese} ~ ${temporal.hexagram.namePinyin}`,
      )
      expect(item.get('.gene-key-spectrum').text()).toContain(temporal.hexagram.geneKey.shadow)
      expect(item.get('.gene-key-spectrum').text()).toContain(temporal.hexagram.geneKey.gift)
      expect(item.get('.gene-key-spectrum').text()).toContain(temporal.hexagram.geneKey.siddhi)
      expect(
        item
          .findAll('.gene-key-frequency-icon')
          .map((icon) => icon.attributes('data-frequency-band')),
      ).toEqual(['shadow', 'gift', 'siddhi'])
    }

    const organCard = wrapper.get('[data-glance-item="organ"]')
    expect(organCard.get('.scope').text()).toBe('Organ System')
    expect(organCard.get('.organ-identity .organ-illustration').attributes('data-organ')).toBe(
      snapshot.organ.key,
    )
    expect(organCard.get('h2').text()).toContain('Bladder · Water')
    expect(organCard.text()).not.toContain('Monkey Hour')
    expect(organCard.get('.organ-card').attributes('aria-label')).not.toContain('Monkey Shíchen')
    expect(organCard.get('.phase-rows').text()).toContain('正 Zhèng · Established')
    expect(organCard.get('.phase-rows').text()).toContain('初刻 Chū Kè · Phase 0')
    expect(organCard.findAll('[data-node-kind="major"]')).toHaveLength(3)
    expect(organCard.findAll('[data-node-kind="minor"]')).toHaveLength(6)
    expect(organCard.findAll('[data-segment]')).toHaveLength(8)
    expect(organCard.get('[data-timeline-label="next"]').text()).toBe('次')
    expect(organCard.text()).not.toContain('NEXT')
    expect(organCard.text()).not.toContain('END')
    expect(organCard.text()).not.toContain('Cultivation')
    expect(organCard.get('.organ-copy').element.lastElementChild?.classList).toContain('time-range')

    for (const scope of ['year', 'day', 'month', 'hour']) {
      expect(
        wrapper.get(`[data-glance-item="${scope}"] .hexagram-card`).element.lastElementChild
          ?.classList,
      ).toContain('gene-key-spectrum')
    }

    wrapper.unmount()
  })

  it('renders real production celestial instruments from the same selected instant', async () => {
    const instant = new Date('2026-08-25T12:00:00.000Z')
    const snapshot = await new LunarScriptCurrentFlowProvider().getSnapshot(instant, {
      timezone: 'America/Los_Angeles',
    })
    const celestial = new LocalDeterministicCelestialCurrentProvider().calculate(instant, {
      mode: 'selected',
    })
    const pinia = createPinia()
    const wrapper = mount(CurrentFlowGlance, {
      props: {
        snapshot,
        celestial,
        timezone: snapshot.timezone,
        selectedTimeJump: true,
      },
      global: { plugins: [pinia] },
    })

    expect(wrapper.findAll('[data-celestial-instrument]')).toHaveLength(2)
    expect(wrapper.get('[data-celestial-instrument="lunar"]').text()).toContain('Waxing Gibbous')
    expect(wrapper.get('[data-celestial-instrument="solar"]').text()).toContain('Autumn')
    expect(
      wrapper
        .get('[data-celestial-instrument="lunar"] [data-primary-value="period-bounds"]')
        .text(),
    ).toBe('Aug 22–27')
    expect(
      wrapper
        .get('[data-celestial-instrument="solar"] [data-primary-value="period-bounds"]')
        .text(),
    ).toBe('Aug 22–Sep 7')
    expect(wrapper.find('[data-active-branch]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Development fixture')
    expect(wrapper.text()).not.toContain('data unavailable')
    expect(wrapper.attributes('data-moment-signature-instant')).toBe(instant.toISOString())
    expect(wrapper.attributes('data-celestial-instant')).toBe(instant.toISOString())
    expect(wrapper.get('.yin-clock').attributes('data-authoritative-instant')).toBe(
      instant.toISOString(),
    )
    expect(wrapper.get('.yin-clock').attributes('data-clock-mode')).toBe('selected')
    expect(wrapper.get('time').attributes('datetime')).toBe(instant.toISOString())
    expect(wrapper.find('[data-glance-item="year"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-item="day"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-item="month"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-item="organ"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-item="hour"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-section="oltr"]').exists()).toBe(true)

    await wrapper.get('[data-celestial-instrument="lunar"]').trigger('click')
    const lunarDetails = wrapper.get('[role="dialog"]').text()
    expect(lunarDetails).toContain('Lunar Current details')
    expect(lunarDetails).toContain('Previous New Moon')
    expect(lunarDetails).not.toContain('Previous term began')
    await wrapper.get('[aria-label="Close celestial details"]').trigger('click')
    await wrapper.get('[data-celestial-instrument="solar"]').trigger('click')
    const solarDetails = wrapper.get('[role="dialog"]').text()
    expect(solarDetails).toContain('Seasonal Current details')
    expect(solarDetails).toContain('Previous term began')
    expect(solarDetails).not.toContain('Previous New Moon')
    wrapper.unmount()
  })
})

describe('CurrentFlowOltr', () => {
  it.each([50, 100, 150])(
    'renders all %i representative characters without truncation',
    (length) => {
      const text = 'Flow with the conditions and preserve useful room. '.repeat(4).slice(0, length)
      const demoBundle = createDemoGuidance(new Date('2026-08-22T14:25:40.000Z'))
      const bundle = { ...demoBundle, oltr: { ...demoBundle.oltr, text } }
      const wrapper = mount(CurrentFlowOltr, { props: { bundle } })

      expect(wrapper.get('p').text()).toBe(text)
      expect(wrapper.text()).not.toContain('…')
    },
  )
})

describe('CalculationProvenanceDetails', () => {
  it('keeps exact bounds, pillar conventions, status, and engine sources accessible', async () => {
    const snapshot = await new LunarScriptCurrentFlowProvider().getSnapshot(
      new Date('2026-08-22T23:05:30.000Z'),
      { timezone: 'America/Los_Angeles' },
    )
    const wrapper = mount(CalculationProvenanceDetails, { props: { snapshot } })

    expect(wrapper.text()).toContain('Calculated From')
    expect(wrapper.text()).toContain(snapshot.temporal.day.label)
    expect(wrapper.text()).toContain(snapshot.temporal.day.timeBoundsLabel)
    expect(wrapper.text()).toContain(snapshot.temporal.day.sourceLabel)
    expect(wrapper.text()).toContain('六十甲子配卦')
    expect(wrapper.text()).toContain(snapshot.provenance.mappingVersion)
    expect(wrapper.text()).toContain('King Wen · canonical 1–64 ID')
    expect(wrapper.text()).toContain(snapshot.organ.sourceLabel)
    expect(wrapper.text()).toContain(snapshot.organ.hourPhase.methodologyId)
    expect(wrapper.text()).toContain(snapshot.organ.hourPhase.timeBasis)
    expect(wrapper.text()).toContain('Micro Hour is observational')
    expect(wrapper.text()).not.toContain('cultivation phase model')
    expect(wrapper.text()).toContain(snapshot.provenance.providerId)
    expect(wrapper.findAll('.temporal-details article')).toHaveLength(4)
  })
})
