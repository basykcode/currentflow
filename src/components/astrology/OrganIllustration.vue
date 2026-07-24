<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    organKey?: string
  }>(),
  { organKey: 'heart' },
)

const periodOrder = [
  'gallbladder',
  'liver',
  'lung',
  'large-intestine',
  'stomach',
  'spleen',
  'heart',
  'small-intestine',
  'bladder',
  'kidney',
  'pericardium',
  'san-jiao',
] as const

const activeRotation = computed(() => {
  const index = periodOrder.findIndex((key) => key === props.organKey)
  return `rotate(${Math.max(index, 0) * 30} 110 110)`
})
</script>

<template>
  <div class="organ-illustration" aria-hidden="true" :data-organ="organKey">
    <svg viewBox="0 0 220 220">
      <circle class="orbit orbit-outer" cx="110" cy="110" r="82" />
      <circle class="orbit orbit-inner" cx="110" cy="110" r="56" />
      <g class="clock-marks">
        <circle
          v-for="index in 12"
          :key="index"
          cx="110"
          cy="28"
          r="2.4"
          :transform="`rotate(${(index - 1) * 30} 110 110)`"
        />
      </g>
      <path class="current-line" d="M22 118c34-28 62-28 88 0s54 28 88 0" />
      <path class="center-mark" d="M110 73 136 110 110 147 84 110Z" />
      <path class="inner-line" d="m91 110 13 13 27-31" />
      <g class="active-period" :transform="activeRotation">
        <circle cx="110" cy="28" r="8" />
        <circle class="active-core" cx="110" cy="28" r="3" />
      </g>
      <circle class="accent" cx="45" cy="160" r="5" />
    </svg>
  </div>
</template>

<style scoped>
.organ-illustration {
  width: min(100%, 14rem);
  aspect-ratio: 1;
  color: var(--jade);
}

svg {
  width: 100%;
  height: 100%;
}

.orbit,
.current-line,
.inner-line {
  fill: none;
  stroke: currentColor;
}

.orbit {
  opacity: 0.22;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
}

.orbit-inner {
  opacity: 0.12;
}

.current-line {
  opacity: 0.42;
  stroke-linecap: round;
  stroke-width: 2;
}

.center-mark {
  fill: var(--jade-wash);
  stroke: var(--jade-deep);
  stroke-width: 2;
}

.inner-line {
  stroke: var(--jade-deep);
  stroke-linecap: round;
  stroke-width: 2;
}

.accent {
  fill: var(--cinnabar);
}

.clock-marks {
  fill: currentColor;
  opacity: 0.35;
}

.active-period {
  fill: var(--paper-raised);
  stroke: var(--cinnabar);
  stroke-width: 1.5;
}

.active-core {
  fill: var(--cinnabar);
  stroke: none;
}
</style>
