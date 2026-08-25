<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  timezone: string
}>()

const sampledAt = ref(new Date())
let alignmentTimer: number | undefined
let clockTimer: number | undefined

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
    primary: `${value('hour')}:${value('minute')}`,
    seconds: `:${value('second')}`,
  }
})

const timeLabel = computed(() => `${timeParts.value.primary}${timeParts.value.seconds}`)

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: props.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(sampledAt.value),
)

const sampleTime = () => {
  sampledAt.value = new Date()
}

onMounted(() => {
  sampleTime()
  const millisecondsToNextFourSecondBoundary = 4_000 - (Date.now() % 4_000)
  alignmentTimer = window.setTimeout(() => {
    sampleTime()
    clockTimer = window.setInterval(sampleTime, 4_000)
  }, millisecondsToNextFourSecondBoundary)
})

onBeforeUnmount(() => {
  if (alignmentTimer !== undefined) window.clearTimeout(alignmentTimer)
  if (clockTimer !== undefined) window.clearInterval(clockTimer)
})
</script>

<template>
  <div class="yin-clock" :aria-label="`${dateLabel}, ${timeLabel}, ${timezone}`">
    <div class="yin-clock__time" aria-hidden="true">
      <Transition name="yin-clock-dissolve" mode="out-in">
        <time :key="timeLabel" :datetime="sampledAt.toISOString()">
          <span>{{ timeParts.primary }}</span
          ><small>{{ timeParts.seconds }}</small>
        </time>
      </Transition>
    </div>
    <p class="yin-clock__metadata">
      <span>{{ dateLabel }}</span>
      <span aria-hidden="true"> · </span>
      <span class="yin-clock__timezone" :title="timezone">{{ timezone }}</span>
    </p>
  </div>
</template>

<style scoped>
.yin-clock {
  display: grid;
  justify-items: center;
  min-width: 0;
}

.yin-clock__metadata {
  display: flex;
  align-items: baseline;
  justify-content: center;
  max-width: 100%;
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
  min-width: 5.7ch;
  text-align: center;
}

.yin-clock__time small {
  color: var(--jade);
  font-family: var(--font-sans);
  font-size: 0.36em;
  font-weight: 400;
  letter-spacing: 0;
}

.yin-clock-dissolve-enter-active,
.yin-clock-dissolve-leave-active {
  transition:
    opacity 750ms ease-in-out,
    filter 750ms ease-in-out;
}

.yin-clock-dissolve-enter-from,
.yin-clock-dissolve-leave-to {
  opacity: 0;
  filter: blur(5px);
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
