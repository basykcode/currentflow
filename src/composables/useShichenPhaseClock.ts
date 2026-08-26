import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import {
  classifyTemporalClockEvent,
  type ShichenClockState,
  type TemporalClockEvent,
} from '@/domain/time/chu-zheng-ke'

export type ShichenPhaseClockOptions<T> = Readonly<{
  selectedInstant: Readonly<Ref<Date | null>>
  load: (instant: Date) => Promise<T>
  toClockState: (value: T) => ShichenClockState
  onValue: (value: T, event: TemporalClockEvent) => void
  nextSampleAt?: (value: T) => Date | null
  onError?: (error: unknown) => void
  liveNow?: () => Date
}>

export const millisecondsUntilNextMinute = (instant: Date) => {
  if (Number.isNaN(instant.getTime())) throw new Error('A valid instant is required.')
  const remainder = instant.getTime() % 60_000
  return remainder === 0 ? 60_000 : 60_000 - remainder
}

export const useShichenPhaseClock = <T>(options: ShichenPhaseClockOptions<T>) => {
  const lastEvent = ref<TemporalClockEvent>('minute-passage')
  const liveNow = options.liveNow ?? (() => new Date())
  let previousState: ShichenClockState | undefined
  let timer: number | undefined
  let mounted = false
  let requestId = 0
  let recommendedSampleAt: Date | null = null

  const clearTimer = () => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = undefined
  }

  const scheduleLiveSample = () => {
    clearTimer()
    if (!mounted || options.selectedInstant.value || document.hidden) return
    const now = liveNow()
    const nextMinuteDelay = millisecondsUntilNextMinute(now)
    const recommendedDelay = recommendedSampleAt
      ? recommendedSampleAt.getTime() - now.getTime()
      : Number.POSITIVE_INFINITY
    const delay =
      recommendedDelay > 0 ? Math.min(nextMinuteDelay, recommendedDelay) : nextMinuteDelay
    timer = window.setTimeout(() => {
      void sample(liveNow())
    }, delay)
  }

  const sample = async (instant: Date) => {
    const activeRequest = ++requestId
    try {
      const value = await options.load(instant)
      if (!mounted || activeRequest !== requestId) return
      const nextState = options.toClockState(value)
      const event = previousState
        ? classifyTemporalClockEvent(previousState, nextState)
        : 'minute-passage'
      previousState = nextState
      lastEvent.value = event
      recommendedSampleAt = options.nextSampleAt?.(value) ?? null
      options.onValue(value, event)
    } catch (error) {
      if (mounted && activeRequest === requestId) options.onError?.(error)
    } finally {
      if (mounted && activeRequest === requestId) scheduleLiveSample()
    }
  }

  const sampleSelectedOrLive = () => {
    clearTimer()
    const selected = options.selectedInstant.value
    void sample(selected ? new Date(selected.getTime()) : liveNow())
  }

  const handleVisibility = () => {
    if (document.hidden) {
      clearTimer()
      return
    }
    sampleSelectedOrLive()
  }

  watch(options.selectedInstant, () => {
    if (mounted) sampleSelectedOrLive()
  })

  onMounted(() => {
    mounted = true
    document.addEventListener('visibilitychange', handleVisibility)
    sampleSelectedOrLive()
  })

  onBeforeUnmount(() => {
    mounted = false
    requestId += 1
    clearTimer()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return Object.freeze({ lastEvent })
}
