<script setup lang="ts">
import { computed } from 'vue'

import type { OrganMoment } from '@/domain/astrology/types'
import {
  MACRO_PRESENTATION,
  MICRO_PRESENTATION,
  type TemporalClockEvent,
} from '@/domain/time/chu-zheng-ke'

import OrganIllustration from './OrganIllustration.vue'
import ShichenFlowTimeline from './ShichenFlowTimeline.vue'

const props = withDefaults(
  defineProps<{
    organ: OrganMoment
    density?: 'glance' | 'standard'
    lastEvent?: TemporalClockEvent
  }>(),
  { density: 'standard', lastEvent: 'minute-passage' },
)

const emit = defineEmits<{
  select: []
}>()

const compactTimeRange = computed(() => props.organ.timeRangeLabel.split('·')[0]?.trim())
const organName = computed(() => props.organ.nameEnglish.replace(/ period$/i, ''))
const elementLabel = computed(
  () => props.organ.element[0]?.toUpperCase() + props.organ.element.slice(1),
)
const macro = computed(() => MACRO_PRESENTATION[props.organ.hourPhase.macroHour])
const micro = computed(() => MICRO_PRESENTATION[props.organ.hourPhase.microHour])
const accessibleSummary = computed(
  () =>
    `${organName.value} Organ System. ` +
    `Macro Hour: ${macro.value.pinyin}, ${macro.value.english}. ` +
    `Micro Hour: ${micro.value.pinyin}, Phase ${props.organ.hourPhase.microHour}, ${micro.value.english}. ` +
    `Next: ${props.organ.nextShichen.animalEnglish} Shíchen.`,
)
</script>

<template>
  <article
    class="organ-card"
    :class="`organ-card--${density}`"
    :data-density="density"
    :aria-label="accessibleSummary"
  >
    <button
      class="card-action"
      type="button"
      :aria-label="`Open Organ System details for ${organName}, active ${compactTimeRange}`"
      @click="emit('select')"
      @keydown.enter="emit('select')"
      @keydown.space.prevent="emit('select')"
    ></button>

    <div class="organ-copy">
      <p class="scope">
        {{ density === 'glance' ? 'Organ System' : 'Organ hour · active period' }}
      </p>

      <div class="organ-identity">
        <OrganIllustration :organ-key="organ.key" />
        <div>
          <h2>{{ organName }} <span aria-hidden="true">·</span> {{ elementLabel }}</h2>
        </div>
      </div>

      <dl class="phase-rows">
        <div>
          <dt>Macro Hour</dt>
          <dd>
            <span lang="zh-Hant">{{ organ.hourPhase.chineseMacroLabel }}</span>
            {{ macro.pinyin }} <span aria-hidden="true">·</span> {{ macro.english }}
          </dd>
        </div>
        <div>
          <dt>Micro Hour</dt>
          <dd>
            <span lang="zh-Hant">{{ organ.hourPhase.chineseKeLabel }}</span>
            {{ micro.pinyin }} <span aria-hidden="true">·</span> Phase
            {{ organ.hourPhase.microHour }}
          </dd>
        </div>
      </dl>

      <ShichenFlowTimeline
        :phase="organ.hourPhase"
        :next-shichen="organ.nextShichen"
        :accessible-summary="accessibleSummary"
        :density="density === 'glance' ? 'compact' : 'detailed'"
        :last-event="lastEvent"
      />

      <p class="time-range">{{ density === 'glance' ? compactTimeRange : organ.timeRangeLabel }}</p>
      <div v-if="density !== 'glance'" class="provenance">
        <span class="status-text">{{ organ.status }}</span>
        <span>{{ organ.sourceLabel }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.organ-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: clamp(1.1rem, 2.5vw, 1.8rem);
  box-shadow: var(--shadow-soft);
}

.card-action {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  background: transparent;
}

.card-action:focus-visible {
  outline-offset: -4px;
}

.organ-copy {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.scope {
  margin: 0;
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.organ-identity {
  display: grid;
  grid-template-columns: minmax(4rem, 6rem) minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
}

h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.35rem, 4vw, 2.25rem);
  font-weight: 500;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.time-range {
  margin: 0.2rem 0 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.phase-rows {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 0;
}

.phase-rows div {
  min-width: 0;
  border-left: 2px solid var(--line);
  padding-left: 0.55rem;
}

.phase-rows dt {
  color: var(--ink-faint);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.phase-rows dd {
  margin: 0.18rem 0 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 0.82rem;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.time-range {
  text-align: center;
}

.provenance {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-top: 1px solid var(--line);
  padding-top: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.3;
}

.status-text {
  flex: 0 0 auto;
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.organ-card--glance {
  min-height: 0;
  border-radius: var(--glance-card-radius, var(--radius-md));
  padding: var(--glance-card-padding, 0.65rem);
  box-shadow: 0 8px 24px rgb(0 8 24 / 18%);
  text-align: center;
}

.organ-card--glance .organ-copy {
  grid-template-rows: auto auto auto minmax(2rem, auto) auto;
  align-content: space-between;
  height: 100%;
  gap: clamp(0.16rem, 0.55vw, 0.32rem);
}

.organ-card--glance .scope {
  font-size: var(--glance-scope-size, 0.59rem);
  line-height: 1.15;
}

.organ-card--glance .organ-identity {
  grid-template-columns: auto;
  justify-items: center;
  gap: 0.05rem;
}

.organ-card--glance .organ-illustration {
  width: var(--glance-organ-size, clamp(2.4rem, 7vw, 4.2rem));
}

.organ-card--glance h2 {
  font-size: var(--glance-organ-title-size, 0.94rem);
  line-height: 1.12;
}

.organ-card--glance .phase-rows {
  width: 100%;
  gap: 0.2rem;
}

.organ-card--glance .phase-rows div {
  border-left: 0;
  padding: 0;
}

.organ-card--glance .phase-rows div + div {
  border-left: 1px solid var(--line);
}

.organ-card--glance .phase-rows dt {
  font-size: clamp(0.48rem, 1.05vw, 0.58rem);
}

.organ-card--glance .phase-rows dd {
  margin-top: 0.08rem;
  font-size: clamp(0.6rem, 1.35vw, 0.75rem);
}

.organ-card--glance .time-range {
  margin: 0;
  font-size: var(--glance-meta-size, 0.64rem);
  line-height: 1.1;
}

@media (max-width: 380px), (max-height: 720px) {
  .organ-card--glance .organ-illustration {
    width: 2.35rem;
  }

  .organ-card--glance .organ-copy {
    gap: 0.08rem;
  }

  .organ-card--glance .phase-rows dd {
    font-size: 0.54rem;
  }
}

@media (max-width: 500px) {
  .organ-card:not(.organ-card--glance) .organ-identity,
  .phase-rows {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-height: 900px) {
  .organ-card--glance .organ-identity {
    grid-template-columns: auto auto;
    justify-content: center;
    gap: 0.3rem;
  }
}
</style>
