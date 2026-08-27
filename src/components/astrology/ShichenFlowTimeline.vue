<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import CurrentTaijiMark from '@/components/common/CurrentTaijiMark.vue'
import type { ShichenIdentity } from '@/domain/astrology/shichen'
import type { HourPhase, TemporalClockEvent } from '@/domain/time/chu-zheng-ke'

export type TemporalFlowDensity = 'compact' | 'detailed'

const props = withDefaults(
  defineProps<{
    phase: HourPhase
    nextShichen: ShichenIdentity
    accessibleSummary: string
    density?: TemporalFlowDensity
    lastEvent?: TemporalClockEvent
  }>(),
  { density: 'compact', lastEvent: 'minute-passage' },
)

const mounted = ref(false)
const nodePositions = [4, 15.5, 27, 38.5, 50, 61.5, 73, 84.5, 96] as const
const segmentPositions = nodePositions.slice(0, -1).map((start, index) => ({
  start,
  end: nodePositions[index + 1] ?? start,
  index,
}))
const markerPosition = computed(() => 4 + props.phase.timelinePosition * 92)
const activeSegment = computed(() =>
  Math.min(7, Math.floor(props.phase.shichenElapsedWholeMinutes / 15)),
)
const transitionEnabled = computed(() => mounted.value && props.lastEvent !== 'shichen-change')

onMounted(() => {
  window.requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <figure
    class="shichen-timeline"
    :class="[
      `shichen-timeline--${density}`,
      { 'shichen-timeline--transition-ready': transitionEnabled },
    ]"
    :data-last-event="lastEvent"
  >
    <figcaption class="visually-hidden">{{ accessibleSummary }}</figcaption>
    <div class="timeline-stage">
      <svg viewBox="0 0 100 18" aria-hidden="true" focusable="false">
        <line
          v-for="segment in segmentPositions"
          :key="`segment-${segment.index}`"
          :class="[
            'timeline-segment',
            { 'timeline-segment--active': segment.index === activeSegment },
          ]"
          :data-segment="segment.index"
          :x1="segment.start"
          y1="9"
          :x2="segment.end"
          y2="9"
        />
        <circle
          v-for="(position, index) in nodePositions"
          :key="`node-${index}`"
          :class="[
            'timeline-node',
            index % 4 === 0 ? 'timeline-node--major' : 'timeline-node--minor',
          ]"
          :data-node-kind="index % 4 === 0 ? 'major' : 'minor'"
          :cx="position"
          cy="9"
          :r="index % 4 === 0 ? 1.8 : 1"
        />
      </svg>
      <span
        class="timeline-marker"
        :style="{ left: `${markerPosition}%` }"
        :data-marker-position="phase.shichenElapsedWholeMinutes"
      >
        <CurrentTaijiMark />
      </span>
    </div>

    <div class="timeline-labels" aria-hidden="true">
      <span class="timeline-label timeline-label--chu" data-timeline-label="chu" lang="zh-Hant">
        初
      </span>
      <span class="timeline-label timeline-label--zheng" data-timeline-label="zheng" lang="zh-Hant">
        正
      </span>
      <span class="timeline-label timeline-label--next" data-timeline-label="next">
        <span v-if="density === 'detailed'" class="timeline-label__next-branch" lang="zh-Hant">
          {{ nextShichen.branchChinese }} ·
        </span>
        <span lang="zh-Hant">次</span>
      </span>
    </div>

    <ol v-if="density === 'detailed'" class="ke-legend" aria-label="Eight Kè structure">
      <li><span lang="zh-Hant">初 · 初刻</span><span>Entering · first Kè</span></li>
      <li><span lang="zh-Hant">初 · 一刻</span><span>Entering · second Kè</span></li>
      <li><span lang="zh-Hant">初 · 二刻</span><span>Entering · third Kè</span></li>
      <li><span lang="zh-Hant">初 · 三刻</span><span>Entering · fourth Kè</span></li>
      <li><span lang="zh-Hant">正 · 初刻</span><span>Established · first Kè</span></li>
      <li><span lang="zh-Hant">正 · 一刻</span><span>Established · second Kè</span></li>
      <li><span lang="zh-Hant">正 · 二刻</span><span>Established · third Kè</span></li>
      <li><span lang="zh-Hant">正 · 三刻</span><span>Established · fourth Kè</span></li>
    </ol>
  </figure>
</template>

<style scoped>
.shichen-timeline {
  --shichen-marker-transition-duration: 4s;
  --shichen-taiji-rotation-duration: 90s;

  width: 100%;
  min-width: 0;
  margin: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.timeline-stage {
  position: relative;
  width: 100%;
  min-height: 1.5rem;
}

svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.timeline-segment {
  stroke: color-mix(in srgb, var(--ink-faint) 55%, transparent);
  stroke-linecap: round;
  stroke-width: 0.75;
}

.timeline-segment--active {
  stroke: var(--jade);
  stroke-width: 1.45;
}

.timeline-node {
  fill: var(--paper-raised);
  stroke: var(--ink-faint);
  stroke-width: 0.65;
}

.timeline-node--major {
  fill: var(--jade-wash);
  stroke: var(--jade);
  stroke-width: 0.9;
}

.timeline-marker {
  position: absolute;
  top: 50%;
  display: block;
  width: 1.05rem;
  height: 1.05rem;
  color: var(--ink);
  transform: translate(-50%, -52%);
}

.shichen-timeline--transition-ready .timeline-marker {
  transition: left var(--shichen-marker-transition-duration) cubic-bezier(0.22, 0.61, 0.36, 1);
}

.timeline-marker :deep(.current-taiji-mark) {
  animation: shichen-taiji-rotation var(--shichen-taiji-rotation-duration) linear infinite;
  filter: drop-shadow(0 0.07rem 0.11rem rgb(0 8 24 / 28%));
}

.timeline-labels {
  position: relative;
  height: 0.55rem;
  margin-top: -0.22rem;
  color: var(--ink-faint);
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  line-height: 1;
}

.timeline-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}

.timeline-label--chu {
  left: 4%;
}

.timeline-label--zheng {
  left: 50%;
}

.timeline-label--next {
  left: 96%;
}

.timeline-label__next-branch {
  position: absolute;
  top: 0;
  right: calc(100% + 0.28em);
}

.shichen-timeline--compact svg {
  height: 1.5rem;
}

.shichen-timeline--detailed .timeline-stage {
  min-height: 2.15rem;
}

.shichen-timeline--detailed .timeline-marker {
  width: 1.35rem;
  height: 1.35rem;
}

.shichen-timeline--detailed .timeline-labels {
  font-size: 0.65rem;
}

.ke-legend {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.ke-legend li {
  display: grid;
  gap: 0.1rem;
  border-left: 2px solid var(--line);
  padding-left: 0.4rem;
  color: var(--ink-faint);
  font-size: 0.65rem;
}

.ke-legend li:nth-child(4n + 1) {
  border-left-color: var(--jade);
}

.ke-legend li span:first-child {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 0.72rem;
}

@keyframes shichen-taiji-rotation {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 420px) {
  .timeline-marker {
    width: 0.92rem;
    height: 0.92rem;
  }

  .ke-legend {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .shichen-timeline--transition-ready .timeline-marker {
    transition: none;
  }

  .timeline-marker :deep(.current-taiji-mark) {
    animation: none;
  }
}
</style>
