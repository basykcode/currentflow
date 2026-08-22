import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import YinClock from '../YinClock.vue'

describe('YinClock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('samples the displayed seconds on four-second wall-clock boundaries', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T16:00:01.000Z'))
    const wrapper = mount(YinClock, { props: { timezone: 'UTC' } })

    expect(wrapper.get('time').text()).toBe('16:00:01')

    await vi.advanceTimersByTimeAsync(3_000)
    expect(wrapper.get('time').text()).toBe('16:00:04')

    await vi.advanceTimersByTimeAsync(4_000)
    expect(wrapper.get('time').text()).toBe('16:00:08')

    wrapper.unmount()
  })
})
