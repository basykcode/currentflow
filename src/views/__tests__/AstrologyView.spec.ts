import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AstrologyView from '../AstrologyView.vue'

describe('production Astrology Home', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('activates the local real-data Moon and Sun composition without network calls or runtime errors', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T12:00:00.000Z'))
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const unhandled: unknown[] = []
    const handleUnhandled = (event: PromiseRejectionEvent) => unhandled.push(event.reason)
    window.addEventListener('unhandledrejection', handleUnhandled)

    const wrapper = mount(AstrologyView, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
    await flushPromises()

    expect(wrapper.findAll('[data-celestial-instrument]')).toHaveLength(2)
    expect(wrapper.get('[data-celestial-instrument="lunar"]').text()).not.toContain('unavailable')
    expect(wrapper.get('[data-celestial-instrument="solar"]').text()).not.toContain('unavailable')
    expect(wrapper.get('h1').attributes('aria-label')).toBe('The Current Flow')
    expect(wrapper.get('h1').text()).toBe('The Current~Flow~')
    expect(wrapper.find('.yin-clock').exists()).toBe(true)
    expect(wrapper.find('[data-glance-row="temporal"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-row="active"]').exists()).toBe(true)
    expect(wrapper.find('[data-glance-section="oltr"]').exists()).toBe(true)
    const glance = wrapper.get('[data-moment-signature-instant]')
    expect(glance.attributes('data-moment-signature-instant')).toBe(
      glance.attributes('data-celestial-instant'),
    )
    expect(glance.get('.yin-clock').attributes('data-authoritative-instant')).toBe(
      glance.attributes('data-moment-signature-instant'),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expect(unhandled).toEqual([])

    wrapper.unmount()
    window.removeEventListener('unhandledrejection', handleUnhandled)
  })
})
