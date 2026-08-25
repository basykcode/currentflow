<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import CurrentTaijiMark from '@/components/common/CurrentTaijiMark.vue'
import {
  normalizeDegrees,
  pointOnCircle,
  type CelestialRingLabel,
  unwrapAngleForShortestPath,
} from '@/domain/current-flow/celestial-instruments'

const props = withDefaults(
  defineProps<{
    labels: readonly CelestialRingLabel[]
    labelStartAngleDegrees?: number
    ticks?: number
    cardinalTickIndexes?: readonly number[]
    activeIndex?: number | null
    markerAngleDegrees?: number | null
    interpolateMarker?: boolean
    reduceMotion?: boolean
    kind: 'lunar' | 'solar'
  }>(),
  {
    labelStartAngleDegrees: 0,
    ticks: 0,
    cardinalTickIndexes: () => [],
    activeIndex: null,
    markerAngleDegrees: null,
    interpolateMarker: true,
    reduceMotion: false,
  },
)

const mounted = ref(false)
const unwrappedMarkerAngle = ref(0)
let hasMarkerTarget = false

const labelPositions = computed(() =>
  props.labels.map((label, index) => ({
    label,
    index,
    point: pointOnCircle(
      50,
      50,
      43,
      props.labelStartAngleDegrees + index * (360 / props.labels.length),
    ),
  })),
)

const sectorLines = computed(() =>
  props.labels.map((_, index) => {
    const angle =
      props.labelStartAngleDegrees -
      360 / props.labels.length / 2 +
      index * (360 / props.labels.length)
    return {
      index,
      start: pointOnCircle(50, 50, 36.8, angle),
      end: pointOnCircle(50, 50, 48, angle),
    }
  }),
)

const tickLines = computed(() =>
  Array.from({ length: props.ticks }, (_, index) => {
    const angle = index * (360 / props.ticks)
    const cardinal = props.cardinalTickIndexes.includes(index)
    return {
      index,
      cardinal,
      start: pointOnCircle(50, 50, cardinal ? 45.5 : 46.7, angle),
      end: pointOnCircle(50, 50, 49, angle),
    }
  }),
)

watch(
  () => props.markerAngleDegrees,
  (nextAngle) => {
    if (nextAngle === null) {
      hasMarkerTarget = false
      return
    }
    const normalized = normalizeDegrees(nextAngle)
    if (!hasMarkerTarget || !props.interpolateMarker) {
      unwrappedMarkerAngle.value = normalized
      hasMarkerTarget = true
      return
    }
    unwrappedMarkerAngle.value = unwrapAngleForShortestPath(unwrappedMarkerAngle.value, normalized)
  },
  { immediate: true },
)

onMounted(() => {
  window.requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <figure
    class="celestial-cycle-ring"
    :class="[
      `celestial-cycle-ring--${kind}`,
      {
        'celestial-cycle-ring--transition-ready': mounted && interpolateMarker,
        'celestial-cycle-ring--without-marker': markerAngleDegrees === null,
        'celestial-cycle-ring--reduced-motion': reduceMotion,
      },
    ]"
    :data-ring-kind="kind"
    :data-marker-angle="markerAngleDegrees ?? 'unavailable'"
  >
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="ring-orbit ring-orbit--outer" cx="50" cy="50" r="49" />
      <circle class="ring-orbit ring-orbit--inner" cx="50" cy="50" r="36.8" />

      <line
        v-for="line in sectorLines"
        :key="`sector-${line.index}`"
        class="ring-sector-line"
        :x1="line.start.x"
        :y1="line.start.y"
        :x2="line.end.x"
        :y2="line.end.y"
      />

      <line
        v-for="tick in tickLines"
        :key="`tick-${tick.index}`"
        class="ring-tick"
        :class="{ 'ring-tick--cardinal': tick.cardinal }"
        :data-ring-tick="tick.index"
        :data-cardinal="tick.cardinal"
        :x1="tick.start.x"
        :y1="tick.start.y"
        :x2="tick.end.x"
        :y2="tick.end.y"
      />

      <g
        v-for="item in labelPositions"
        :key="item.label.character"
        class="ring-label"
        :class="{ 'ring-label--active': activeIndex === item.index }"
        :data-ring-label="item.label.character"
        :data-active="activeIndex === item.index"
      >
        <circle
          v-if="activeIndex === item.index"
          class="ring-label-active-mark"
          :cx="item.point.x"
          :cy="item.point.y"
          r="3.65"
        />
        <text :x="item.point.x" :y="item.point.y" dominant-baseline="central" text-anchor="middle">
          {{ item.label.character }}
        </text>
      </g>

      <g
        v-if="markerAngleDegrees !== null"
        class="celestial-marker-orbit"
        :style="{ transform: `rotate(${unwrappedMarkerAngle}deg)` }"
      >
        <g class="celestial-marker-position" transform="translate(50 8)">
          <foreignObject x="-4.5" y="-4.5" width="9" height="9">
            <div xmlns="http://www.w3.org/1999/xhtml" class="celestial-marker-spin">
              <CurrentTaijiMark size="celestial" />
            </div>
          </foreignObject>
        </g>
      </g>
    </svg>

    <div class="celestial-body" aria-hidden="true">
      <slot />
    </div>
  </figure>
</template>

<style scoped>
.celestial-cycle-ring {
  --celestial-taiji-rotation-duration: 90s;
  --celestial-marker-position-duration: 5s;

  position: relative;
  width: var(--celestial-instrument-size, 7rem);
  aspect-ratio: 1;
  margin: 0;
  flex: 0 0 auto;
}

svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ring-orbit,
.ring-sector-line,
.ring-tick {
  fill: none;
  stroke: color-mix(in srgb, var(--ink-faint) 36%, transparent);
  vector-effect: non-scaling-stroke;
}

.ring-orbit--outer {
  stroke-width: 0.8;
}

.ring-orbit--inner {
  stroke-width: 0.55;
}

.ring-sector-line {
  stroke-width: 0.45;
}

.ring-tick {
  stroke-width: 0.65;
}

.ring-tick--cardinal {
  stroke: color-mix(in srgb, var(--jade) 76%, var(--ink-faint));
  stroke-width: 1.35;
}

.ring-label text {
  fill: var(--ink-faint);
  font-family: var(--font-serif);
  font-size: 5px;
  font-weight: 500;
}

.celestial-cycle-ring--solar .ring-label text {
  font-size: 4.2px;
}

.ring-label-active-mark {
  fill: color-mix(in srgb, var(--jade-wash) 88%, transparent);
  stroke: var(--jade);
  stroke-width: 0.7;
  vector-effect: non-scaling-stroke;
}

.ring-label--active text {
  fill: var(--ink);
  font-weight: 800;
}

.celestial-body {
  position: absolute;
  inset: 16%;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.celestial-marker-orbit {
  transform-box: view-box;
  transform-origin: 50px 50px;
}

.celestial-cycle-ring--transition-ready .celestial-marker-orbit {
  transition: transform var(--celestial-marker-position-duration) cubic-bezier(0.22, 0.61, 0.36, 1);
}

.celestial-marker-spin {
  display: grid;
  width: 100%;
  height: 100%;
  color: var(--ink);
  place-items: center;
  animation: celestial-taiji-spin var(--celestial-taiji-rotation-duration) linear infinite;
  filter: drop-shadow(0 0.08rem 0.12rem rgb(0 8 24 / 40%));
}

.celestial-marker-spin :deep(.current-taiji-mark) {
  font-size: 7px;
}

.celestial-cycle-ring--without-marker .ring-orbit--outer {
  stroke-dasharray: 1.5 2.2;
}

.celestial-cycle-ring--reduced-motion .celestial-marker-orbit {
  transition: none !important;
}

.celestial-cycle-ring--reduced-motion .celestial-marker-spin {
  animation: none !important;
}

@keyframes celestial-taiji-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .celestial-marker-orbit {
    transition: none !important;
  }

  .celestial-marker-spin {
    animation: none !important;
  }
}
</style>
