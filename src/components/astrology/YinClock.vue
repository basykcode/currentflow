<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { formatGmtOffsetLabel } from './celestialFormatting'

const props = withDefaults(
  defineProps<{
    timezone: string
    compact?: boolean
    instantUtc?: string | undefined
    live?: boolean
  }>(),
  { compact: false, live: true },
)

const SAMPLE_INTERVAL_MS = 4_000
const DISSOLVE_DURATION_MS = 1_500
const explicitInstant = () => {
  const parsed = props.instantUtc ? new Date(props.instantUtc) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}
const sampledAt = ref(explicitInstant())
const activeDissolveDurationMs = ref(DISSOLVE_DURATION_MS)
let alignmentTimer: number | undefined

const timeParts = computed(() => {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(sampledAt.value)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    hours: value('hour'),
    minutes: value('minute'),
    seconds: value('second'),
  }
})

const timeLabel = computed(
  () => `${timeParts.value.hours}:${timeParts.value.minutes}:${timeParts.value.seconds}`,
)

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: props.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(sampledAt.value),
)

const timezoneLabel = computed(() => formatGmtOffsetLabel(sampledAt.value, props.timezone))

const sampleTime = () => {
  sampledAt.value = props.live ? new Date() : explicitInstant()
}

function scheduleDissolveForBoundary(boundaryMs: number) {
  const idealStartMs = boundaryMs - DISSOLVE_DURATION_MS
  const delayMs = Math.max(0, idealStartMs - Date.now())
  alignmentTimer = window.setTimeout(() => {
    if (Date.now() >= boundaryMs + SAMPLE_INTERVAL_MS) {
      restartClock()
      return
    }
    activeDissolveDurationMs.value = Math.max(
      0,
      Math.min(DISSOLVE_DURATION_MS, boundaryMs - Date.now()),
    )
    sampledAt.value = new Date(boundaryMs)
    scheduleDissolveForBoundary(boundaryMs + SAMPLE_INTERVAL_MS)
  }, delayMs)
}

function restartClock() {
  if (alignmentTimer !== undefined) window.clearTimeout(alignmentTimer)
  sampleTime()
  if (!props.live) return
  const nextBoundaryMs =
    Math.floor(Date.now() / SAMPLE_INTERVAL_MS) * SAMPLE_INTERVAL_MS + SAMPLE_INTERVAL_MS
  scheduleDissolveForBoundary(nextBoundaryMs)
}

watch(
  () => [props.instantUtc, props.live] as const,
  () => restartClock(),
)

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') restartClock()
}

onMounted(() => {
  restartClock()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (alignmentTimer !== undefined) window.clearTimeout(alignmentTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div
    class="yin-clock"
    :class="{ 'yin-clock--compact': compact }"
    :aria-label="`${dateLabel}, ${timeLabel}, ${timezoneLabel}`"
    :style="{ '--yin-clock-dissolve-duration': `${activeDissolveDurationMs}ms` }"
    :data-sample-interval-ms="SAMPLE_INTERVAL_MS"
    :data-dissolve-duration-ms="DISSOLVE_DURATION_MS"
    :data-authoritative-instant="instantUtc"
    :data-clock-mode="live ? 'live' : 'selected'"
  >
    <div class="yin-clock__time" aria-hidden="true">
      <time :datetime="sampledAt.toISOString()">
        <span class="yin-clock__segment" data-clock-segment="hours" :data-value="timeParts.hours">
          <Transition name="yin-clock-dissolve">
            <span :key="timeParts.hours">{{ timeParts.hours }}</span>
          </Transition>
        </span>
        <span class="yin-clock__colon" aria-hidden="true">:</span>
        <span
          class="yin-clock__segment"
          data-clock-segment="minutes"
          :data-value="timeParts.minutes"
        >
          <Transition name="yin-clock-dissolve">
            <span :key="timeParts.minutes">{{ timeParts.minutes }}</span>
          </Transition>
        </span>
        <span class="yin-clock__colon" aria-hidden="true">:</span>
        <span
          class="yin-clock__segment"
          data-clock-segment="seconds"
          :data-value="timeParts.seconds"
        >
          <Transition name="yin-clock-dissolve">
            <span :key="timeParts.seconds">{{ timeParts.seconds }}</span>
          </Transition>
        </span>
      </time>
    </div>
    <p class="yin-clock__metadata">
      <span>{{ dateLabel }}</span>
      <span aria-hidden="true">·</span>
      <span class="yin-clock__timezone" :title="`${timezone} · ${timezoneLabel}`">
        {{ timezoneLabel }}
      </span>
    </p>
  </div>
</template>

<style scoped>
.yin-clock {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  justify-items: center;
  min-width: 0;
}

.yin-clock__metadata {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.16rem;
  max-width: 100%;
  width: 100%;
  margin: 0;
  color: var(--ink-faint);
  font-size: clamp(0.64rem, 2.3vw, 0.78rem);
  line-height: 1.25;
  white-space: nowrap;
}

.yin-clock__timezone {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yin-clock__time {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(2.05rem, 8vw, 4rem);
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 0.95;
  white-space: nowrap;
}

.yin-clock__time time {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  min-width: 8.15ch;
  text-align: center;
}

.yin-clock__segment {
  display: inline-grid;
  min-width: 2ch;
  text-align: center;
}

.yin-clock__segment > span {
  grid-area: 1 / 1;
}

.yin-clock__colon {
  color: var(--jade);
}

.yin-clock--compact .yin-clock__time {
  font-size: clamp(1.55rem, 6.7vw, 1.95rem);
}

.yin-clock--compact .yin-clock__metadata {
  font-size: 0.61rem;
}

.yin-clock-dissolve-enter-active,
.yin-clock-dissolve-leave-active {
  transition:
    opacity var(--yin-clock-dissolve-duration, 1500ms) ease-in-out,
    filter var(--yin-clock-dissolve-duration, 1500ms) ease-in-out;
}

.yin-clock-dissolve-enter-from,
.yin-clock-dissolve-leave-to {
  opacity: 0;
  filter: blur(5px);
}

@media (prefers-reduced-motion: reduce) {
  .yin-clock-dissolve-enter-active,
  .yin-clock-dissolve-leave-active {
    transition: none;
  }
}

@media (max-width: 767px) and (max-height: 720px) {
  .yin-clock__time {
    font-size: clamp(1.8rem, 7.6vw, 2.2rem);
  }

  .yin-clock__metadata {
    font-size: 0.61rem;
  }
}
</style>
