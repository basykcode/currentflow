import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import YinClock from '../YinClock.vue'

describe('YinClock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('hands continuous four-second dissolves directly from one target to the next', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T16:00:01.000Z'))
    const wrapper = mount(YinClock, { props: { timezone: 'UTC' } })
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.get('time').text()).toBe('16:00:04')
    expect(wrapper.get('.yin-clock').attributes('data-sample-interval-ms')).toBe('4000')
    expect(wrapper.get('.yin-clock').attributes('data-dissolve-duration-ms')).toBe('4000')
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-duration: 4000ms',
    )
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-delay: -1000ms',
    )
    expect(vi.getTimerCount()).toBe(1)
    const hoursElement = wrapper.get('[data-clock-segment="hours"] transition-stub > span').element
    const minutesElement = wrapper.get(
      '[data-clock-segment="minutes"] transition-stub > span',
    ).element
    const colonElements = wrapper.findAll('.yin-clock__colon').map((colon) => colon.element)

    await vi.advanceTimersByTimeAsync(2_999)
    expect(wrapper.get('[data-clock-segment="seconds"]').attributes('data-value')).toBe('04')

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.get('[data-clock-segment="seconds"]').attributes('data-value')).toBe('08')
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-duration: 4000ms',
    )
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-delay: 0ms',
    )
    expect(vi.getTimerCount()).toBe(1)
    expect(wrapper.get('[data-clock-segment="hours"]').attributes('data-value')).toBe('16')
    expect(wrapper.get('[data-clock-segment="minutes"]').attributes('data-value')).toBe('00')
    expect(wrapper.get('[data-clock-segment="hours"] transition-stub > span').element).toBe(
      hoursElement,
    )
    expect(wrapper.get('[data-clock-segment="minutes"] transition-stub > span').element).toBe(
      minutesElement,
    )
    expect(wrapper.findAll('.yin-clock__colon').map((colon) => colon.element)).toEqual(
      colonElements,
    )

    await vi.advanceTimersByTimeAsync(4_000)
    expect(wrapper.get('[data-clock-segment="seconds"]').attributes('data-value')).toBe('12')
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('dissolves hours, minutes, and seconds together at an hour boundary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T16:59:58.000Z'))
    const wrapper = mount(YinClock, { props: { timezone: 'UTC' } })
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.get('time').text()).toBe('17:00:00')
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-duration: 4000ms',
    )
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-delay: -2000ms',
    )
    expect(wrapper.get('[data-clock-segment="hours"]').attributes('data-value')).toBe('17')
    expect(wrapper.get('[data-clock-segment="minutes"]').attributes('data-value')).toBe('00')
    expect(wrapper.get('[data-clock-segment="seconds"]').attributes('data-value')).toBe('00')

    wrapper.unmount()
  })

  it('resynchronizes instead of replaying missed four-second targets after a delayed timer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T16:00:01.000Z'))
    const wrapper = mount(YinClock, { props: { timezone: 'UTC' } })
    await vi.advanceTimersByTimeAsync(0)

    vi.setSystemTime(new Date('2026-08-22T16:01:01.000Z'))
    await vi.runOnlyPendingTimersAsync()
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.get('[data-clock-segment="hours"]').attributes('data-value')).toBe('16')
    expect(wrapper.get('[data-clock-segment="minutes"]').attributes('data-value')).toBe('01')
    expect(wrapper.get('[data-clock-segment="seconds"]').attributes('data-value')).toBe('04')
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-duration: 4000ms',
    )
    expect(wrapper.get('.yin-clock').attributes('style')).toContain(
      '--yin-clock-dissolve-delay: -1000ms',
    )
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
  })

  it('keeps two blue colon anchors outside the independently keyed segments', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T14:25:40.000Z'))
    const wrapper = mount(YinClock, { props: { timezone: 'America/Los_Angeles' } })

    expect(wrapper.get('.yin-clock__metadata').text()).toContain('GMT−07:00')
    expect(wrapper.get('.yin-clock__metadata').text()).not.toContain('America/Los_Angeles')
    expect(wrapper.get('.yin-clock__timezone').attributes('title')).toContain('America/Los_Angeles')
    expect(wrapper.text()).not.toContain('~')
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    expect(wrapper.get('time').text()).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(wrapper.findAll('[data-clock-segment]')).toHaveLength(3)
    expect(wrapper.findAll('.yin-clock__colon')).toHaveLength(2)
    expect(wrapper.get('.yin-clock').attributes('aria-label')).toContain('07:25:40')
    expect(wrapper.get('.yin-clock').attributes('aria-label')).toContain('GMT−07:00')

    wrapper.unmount()
  })

  it('freezes an explicit selected instant without scheduling live updates', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T14:25:40.000Z'))
    const wrapper = mount(YinClock, {
      props: {
        timezone: 'Asia/Shanghai',
        instantUtc: '1999-12-31T23:44:30.000Z',
        live: false,
      },
    })

    expect(wrapper.get('.yin-clock').attributes('data-clock-mode')).toBe('selected')
    expect(wrapper.get('.yin-clock').attributes('data-authoritative-instant')).toBe(
      '1999-12-31T23:44:30.000Z',
    )
    expect(wrapper.get('time').attributes('datetime')).toBe('1999-12-31T23:44:30.000Z')
    expect(wrapper.get('time').text()).toBe('07:44:30')
    expect(wrapper.get('.yin-clock__timezone').text()).toBe('GMT+08:00')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(wrapper.get('time').text()).toBe('07:44:30')
    wrapper.unmount()
  })
})
