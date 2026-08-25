import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { calculateHourPhase, type ShichenPhaseCoordinate } from '@/domain/time/chu-zheng-ke'

import { millisecondsUntilNextMinute, useShichenPhaseClock } from '../useShichenPhaseClock'

const stateAt = (instant: Date) => {
  const elapsed = instant.getUTCMinutes()
  const coordinate: ShichenPhaseCoordinate = {
    timeBasis: 'local-civil',
    elapsedBasisMinutes: elapsed,
    totalBasisMinutes: 120,
    startUtc: '2026-08-25T12:00:00.000Z',
    endUtc: '2026-08-25T14:00:00.000Z',
    nextMinuteBoundaryUtc: '2026-08-25T12:01:00.000Z',
    nextMicroBoundaryUtc: '2026-08-25T12:15:00.000Z',
    nextMacroBoundaryUtc: '2026-08-25T13:00:00.000Z',
    nextShichenBoundaryUtc: '2026-08-25T14:00:00.000Z',
    warnings: [],
  }
  return { shichenId: 'wu', hourPhase: calculateHourPhase(coordinate) }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useShichenPhaseClock', () => {
  it('calculates the exact next live minute delay', () => {
    expect(millisecondsUntilNextMinute(new Date('2026-08-25T12:00:30.250Z'))).toBe(29_750)
    expect(millisecondsUntilNextMinute(new Date('2026-08-25T12:01:00.000Z'))).toBe(60_000)
  })

  it('uses recursive minute-aligned live samples', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T12:00:30.000Z'))
    const samples: string[] = []
    const component = defineComponent({
      setup() {
        useShichenPhaseClock({
          selectedInstant: ref<Date | null>(null),
          liveNow: () => new Date(),
          load: (instant) => {
            samples.push(instant.toISOString())
            return Promise.resolve(stateAt(instant))
          },
          toClockState: (value) => value,
          onValue: () => undefined,
        })
        return () => null
      },
    })
    const wrapper = mount(component)
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(30_000)

    expect(samples[0]).toBe('2026-08-25T12:00:30.000Z')
    expect(samples[1]).toBe('2026-08-25T12:01:00.000Z')
    wrapper.unmount()
  })

  it('does not let a live timer overwrite a frozen selected instant', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T12:00:30.000Z'))
    const selected = ref<Date | null>(new Date('1999-12-31T23:44:30.000Z'))
    const samples: string[] = []
    const component = defineComponent({
      setup() {
        useShichenPhaseClock({
          selectedInstant: selected,
          liveNow: () => new Date(),
          load: (instant) => {
            samples.push(instant.toISOString())
            return Promise.resolve(stateAt(new Date('2026-08-25T12:44:30.000Z')))
          },
          toClockState: (value) => value,
          onValue: () => undefined,
        })
        return () => null
      },
    })
    const wrapper = mount(component)
    await vi.advanceTimersByTimeAsync(180_000)

    expect(samples).toEqual(['1999-12-31T23:44:30.000Z'])
    wrapper.unmount()
  })
})
