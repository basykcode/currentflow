<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    decorative?: boolean
    label?: string
    neutral?: boolean
  }>(),
  { decorative: false, label: 'Sun', neutral: false },
)

const svgId = useId()
const coronaId = `${svgId}-sun-corona`
const surfaceId = `${svgId}-sun-surface`
const softnessId = `${svgId}-sun-softness`
const clipId = `${svgId}-sun-surface-clip`
</script>

<template>
  <svg
    class="sun-disk"
    :class="{ 'sun-disk--neutral': neutral }"
    viewBox="0 0 100 100"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
  >
    <defs>
      <radialGradient :id="coronaId" cx="50%" cy="50%" r="50%">
        <stop offset="0.58" stop-color="#f9c963" stop-opacity="0" />
        <stop offset="0.77" stop-color="#f5a83b" stop-opacity="0.24" />
        <stop offset="1" stop-color="#f5a83b" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="surfaceId" cx="38%" cy="32%" r="70%">
        <stop offset="0" stop-color="#fff5b3" />
        <stop offset="0.45" stop-color="#ffd36e" />
        <stop offset="0.78" stop-color="#f4a83c" />
        <stop offset="1" stop-color="#b75d22" />
      </radialGradient>
      <filter :id="softnessId" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.11"
          numOctaves="2"
          seed="17"
          result="noise"
        />
        <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
        <feBlend in="SourceGraphic" in2="mono" mode="soft-light" />
      </filter>
      <clipPath :id="clipId">
        <circle cx="50" cy="50" r="32" />
      </clipPath>
    </defs>

    <circle class="sun-corona" cx="50" cy="50" r="47" :fill="`url(#${coronaId})`" />
    <g :clip-path="`url(#${clipId})`" :filter="`url(#${softnessId})`">
      <circle class="sun-surface" cx="50" cy="50" r="32" :fill="`url(#${surfaceId})`" />
      <path
        class="sun-current"
        d="M17 42c17-10 35-13 66-3M19 57c20 8 41 10 63 1M28 27c11 5 32 5 43-1"
      />
    </g>
    <circle class="sun-rim" cx="50" cy="50" r="32" />
  </svg>
</template>

<style scoped>
.sun-disk {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.sun-rim {
  fill: none;
  stroke: rgb(255 223 144 / 58%);
  stroke-width: 0.8;
  vector-effect: non-scaling-stroke;
}

.sun-current {
  fill: none;
  stroke: rgb(255 247 195 / 22%);
  stroke-linecap: round;
  stroke-width: 1.4;
}

.sun-disk--neutral {
  filter: saturate(0.18) opacity(0.62);
}
</style>
