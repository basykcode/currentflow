<script setup lang="ts">
import { computed } from 'vue'

import {
  EARTHLY_BRANCH_MONTH_DEFINITIONS,
  type CelestialRingLabel,
  type SolarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

import CelestialCycleRing from './CelestialCycleRing.vue'
import CelestialInstrumentText from './CelestialInstrumentText.vue'
import SunDisk from './SunDisk.vue'

const props = withDefaults(
  defineProps<{
    viewModel: SolarHomeInstrumentViewModel
    alignment?: 'left' | 'right'
    interpolateMarker?: boolean
    reduceMotion?: boolean
    compact?: boolean
  }>(),
  { alignment: 'right', interpolateMarker: true, reduceMotion: false, compact: false },
)

const emit = defineEmits<{
  openDetails: []
}>()

const ringLabels: readonly CelestialRingLabel[] = EARTHLY_BRANCH_MONTH_DEFINITIONS.map(
  ({ character, pinyin, animalEnglish }) => ({
    character,
    accessibleLabel: `${pinyin}, ${animalEnglish}`,
  }),
)

const termLine = computed(() =>
  props.viewModel.solarTerm
    ? {
        characters: props.viewModel.solarTerm.chineseTraditional,
        pinyin: props.viewModel.solarTerm.pinyin,
        english: props.viewModel.solarTerm.contextualEnglish,
      }
    : null,
)

const seasonLine = computed(() => props.viewModel.season ?? 'Seasonal data unavailable')
const movementLine = computed(
  () => props.viewModel.yinYangMovement ?? 'Annual movement unavailable',
)
const branchDecode = computed(() =>
  props.viewModel.branchMonth
    ? `${props.viewModel.branchMonth.character} ${props.viewModel.branchMonth.pinyin}`
    : 'Branch unavailable',
)

const accessibleLabel = computed(() => {
  if (props.viewModel.status === 'unavailable') {
    return 'Solar Current. Seasonal data unavailable. Open details for methodology and availability.'
  }
  const term = props.viewModel.solarTerm
    ? `${props.viewModel.solarTerm.pinyin}, ${props.viewModel.solarTerm.contextualEnglish}`
    : 'Solar Term unavailable'
  const branch = props.viewModel.branchMonth
    ? `Active Branch ${props.viewModel.branchMonth.pinyin}`
    : 'Active Branch unavailable'
  return `Solar Current. ${seasonLine.value}. ${term}. ${movementLine.value}. ${branch}.`
})
</script>

<template>
  <button
    class="celestial-instrument celestial-instrument--solar"
    :class="[`celestial-instrument--${alignment}`, { 'celestial-instrument--compact': compact }]"
    type="button"
    :aria-label="accessibleLabel"
    data-celestial-instrument="solar"
    @click="emit('openDetails')"
  >
    <span class="solar-ring-wrap">
      <CelestialCycleRing
        :labels="ringLabels"
        :ticks="24"
        :cardinal-tick-indexes="[0, 6, 12, 18]"
        :active-index="viewModel.branchMonth?.index ?? null"
        :marker-angle-degrees="viewModel.markerAngleDegrees"
        :interpolate-marker="interpolateMarker"
        :reduce-motion="reduceMotion"
        kind="solar"
      >
        <SunDisk :neutral="viewModel.status === 'unavailable'" decorative />
      </CelestialCycleRing>
      <span class="branch-decode" data-active-branch>{{ branchDecode }}</span>
    </span>

    <CelestialInstrumentText
      :line-one="seasonLine"
      :line-two="termLine"
      line-two-fallback="Solar Term unavailable"
      :line-three="movementLine"
    />
  </button>
</template>

<style scoped>
.celestial-instrument {
  display: grid;
  grid-template-columns: auto minmax(0, 10.5rem);
  align-items: center;
  gap: clamp(0.45rem, 1.2vw, 0.9rem);
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  padding: 0.25rem;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.celestial-instrument:hover {
  border-color: color-mix(in srgb, var(--jade) 40%, transparent);
  background: color-mix(in srgb, var(--jade-wash) 35%, transparent);
}

.celestial-instrument:focus-visible {
  border-color: var(--jade);
  outline-offset: 2px;
}

.celestial-instrument--right {
  grid-template-columns: minmax(0, 10.5rem) auto;
  text-align: right;
}

.celestial-instrument--right .solar-ring-wrap {
  order: 2;
}

.solar-ring-wrap {
  display: grid;
  justify-items: center;
  min-width: 0;
}

.celestial-instrument--compact,
.celestial-instrument--compact.celestial-instrument--right {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: 0.2rem;
  padding: 0.1rem;
  text-align: center;
}

.celestial-instrument--compact.celestial-instrument--right .solar-ring-wrap {
  order: 0;
}

.branch-decode {
  z-index: 1;
  margin-top: -0.12rem;
  border: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper-raised) 88%, transparent);
  padding: 0.08rem 0.35rem;
  color: var(--ink-soft);
  font-size: 0.56rem;
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 767px) {
  .celestial-instrument,
  .celestial-instrument--right {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 0.2rem;
    padding: 0.1rem;
    text-align: center;
  }

  .celestial-instrument--right .solar-ring-wrap {
    order: 0;
  }
}
</style>
