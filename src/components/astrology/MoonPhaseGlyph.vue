<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    illuminationFraction?: number | null
    waxing?: boolean | null
    variant?: 'compact' | 'card' | 'instrument'
    decorative?: boolean
    label?: string
  }>(),
  {
    illuminationFraction: null,
    waxing: null,
    variant: 'compact',
    decorative: false,
    label: 'Moon phase',
  },
)

const svgId = useId()
const darkGradientId = `${svgId}-moon-dark`
const lightGradientId = `${svgId}-moon-light`
const clipId = `${svgId}-moon-disk-clip`
const shadowId = `${svgId}-moon-soft-shadow`

const illuminatedPath = computed(() => {
  if (props.illuminationFraction === null || props.waxing === null) return ''
  const fraction = Math.min(1, Math.max(0, props.illuminationFraction))
  const center = 50
  const radius = 36
  const terminatorScale = 1 - fraction * 2
  const outerPoints: string[] = []
  const terminatorPoints: string[] = []
  const steps = 48

  for (let index = 0; index <= steps; index += 1) {
    const y = -radius + (index / steps) * radius * 2
    const halfWidth = Math.sqrt(Math.max(0, radius * radius - y * y))
    const outerX = props.waxing ? center + halfWidth : center - halfWidth
    const terminatorX = props.waxing
      ? center + terminatorScale * halfWidth
      : center - terminatorScale * halfWidth
    outerPoints.push(`${outerX.toFixed(3)},${(center + y).toFixed(3)}`)
    terminatorPoints.unshift(`${terminatorX.toFixed(3)},${(center + y).toFixed(3)}`)
  }

  return `M ${outerPoints.join(' L ')} L ${terminatorPoints.join(' L ')} Z`
})

const unavailable = computed(() => props.illuminationFraction === null || props.waxing === null)
</script>

<template>
  <svg
    class="moon-phase-glyph"
    :class="`moon-phase-glyph--${variant}`"
    viewBox="0 0 100 100"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
    :data-unavailable="unavailable"
  >
    <defs>
      <radialGradient :id="darkGradientId" cx="38%" cy="32%" r="74%">
        <stop offset="0" stop-color="#466486" />
        <stop offset="0.65" stop-color="#1d3553" />
        <stop offset="1" stop-color="#0a1930" />
      </radialGradient>
      <radialGradient :id="lightGradientId" cx="34%" cy="28%" r="72%">
        <stop offset="0" stop-color="#f8fbff" />
        <stop offset="0.58" stop-color="#cadbf0" />
        <stop offset="1" stop-color="#7f9fc4" />
      </radialGradient>
      <clipPath :id="clipId">
        <circle cx="50" cy="50" r="36" />
      </clipPath>
      <filter :id="shadowId" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.6" flood-color="#000a1d" flood-opacity="0.55" />
      </filter>
    </defs>

    <g :filter="`url(#${shadowId})`">
      <circle class="moon-base" cx="50" cy="50" r="36" :fill="`url(#${darkGradientId})`" />
      <path
        v-if="illuminatedPath"
        class="moon-illumination"
        :d="illuminatedPath"
        :fill="`url(#${lightGradientId})`"
      />
      <circle v-if="unavailable" class="moon-neutral" cx="50" cy="50" r="36" />
      <g class="moon-texture" :clip-path="`url(#${clipId})`" aria-hidden="true">
        <circle cx="36" cy="34" r="5.2" />
        <circle cx="62" cy="30" r="3.1" />
        <circle cx="68" cy="52" r="6.4" />
        <circle cx="43" cy="62" r="4.1" />
        <circle cx="29" cy="53" r="2.6" />
        <path d="M22 42c13 4 27 1 36-7M39 73c13-8 25-9 39-5" />
      </g>
      <circle class="moon-rim" cx="50" cy="50" r="36" />
    </g>
  </svg>
</template>

<style scoped>
.moon-phase-glyph {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.moon-base,
.moon-rim {
  vector-effect: non-scaling-stroke;
}

.moon-rim {
  fill: none;
  stroke: color-mix(in srgb, var(--ink) 30%, transparent);
  stroke-width: 0.8;
}

.moon-texture {
  fill: none;
  stroke: rgb(235 245 255 / 18%);
  stroke-width: 0.85;
}

.moon-neutral {
  fill: color-mix(in srgb, var(--ink-faint) 24%, transparent);
}
</style>
