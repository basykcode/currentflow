<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  timezone: string
}>()

const sampledAt = ref(new Date())
let alignmentTimer: number | undefined
let clockTimer: number | undefined

const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: props.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(sampledAt.value),
)

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: props.timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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
    <p class="yin-clock__date">{{ dateLabel }}</p>
    <div class="yin-clock__time" aria-hidden="true">
      <span class="yin-clock__tilde">~</span>
      <Transition name="yin-clock-dissolve" mode="out-in">
        <time :key="timeLabel" :datetime="sampledAt.toISOString()">{{ timeLabel }}</time>
      </Transition>
      <span class="yin-clock__tilde">~</span>
    </div>
    <p class="yin-clock__timezone">{{ timezone }}</p>
  </div>
</template>

<style scoped>
.yin-clock {
  display: grid;
  justify-items: end;
  min-width: min(100%, 27rem);
}

.yin-clock__date,
.yin-clock__timezone {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.yin-clock__time {
  display: grid;
  grid-template-columns: 1.5rem minmax(8ch, auto) 1.5rem;
  align-items: center;
  gap: clamp(0.35rem, 1vw, 0.8rem);
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(2.45rem, 6vw, 5.35rem);
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
  white-space: nowrap;
}

.yin-clock__time time {
  display: block;
  min-width: 8ch;
  text-align: center;
}

.yin-clock__tilde {
  color: var(--jade);
  font-size: 0.58em;
  font-weight: 400;
  text-align: center;
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

@media (max-width: 680px) {
  .yin-clock {
    justify-items: start;
  }

  .yin-clock__time {
    grid-template-columns: 1.1rem minmax(8ch, auto) 1.1rem;
  }
}
</style>
