<script setup lang="ts">
import { computed } from 'vue'

import {
  CANTONG_QI_DISPLAY_DEFINITIONS,
  type CelestialRingLabel,
  type LunarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

import CelestialCycleRing from './CelestialCycleRing.vue'
import CelestialInstrumentText from './CelestialInstrumentText.vue'
import MoonPhaseGlyph from './MoonPhaseGlyph.vue'

const props = withDefaults(
  defineProps<{
    viewModel: LunarHomeInstrumentViewModel
    alignment?: 'left' | 'right'
    interpolateMarker?: boolean
    reduceMotion?: boolean
    compact?: boolean
  }>(),
  { alignment: 'left', interpolateMarker: true, reduceMotion: false, compact: false },
)

const emit = defineEmits<{
  openDetails: []
}>()

const ringLabels: readonly CelestialRingLabel[] = CANTONG_QI_DISPLAY_DEFINITIONS.map(
  ({ character, pinyin, englishLabel }) => ({
    character,
    accessibleLabel: `${pinyin}, ${englishLabel}`,
  }),
)

const nodeLine = computed(() =>
  props.viewModel.cantongQi
    ? {
        characters: props.viewModel.cantongQi.character,
        pinyin: props.viewModel.cantongQi.pinyin,
        english: props.viewModel.cantongQi.englishLabel,
      }
    : null,
)

const movementLine = computed(() => props.viewModel.yinYangMovement ?? 'Lunar movement unavailable')

const accessibleLabel = computed(() => {
  if (props.viewModel.status === 'unavailable') {
    return 'Lunar Current. Lunar data unavailable. Open details for methodology and availability.'
  }
  const node = props.viewModel.cantongQi
    ? `${props.viewModel.cantongQi.pinyin}, ${props.viewModel.cantongQi.englishLabel}`
    : 'Cantong qi node unavailable'
  return `Lunar Current. ${props.viewModel.phaseName}. ${node}. ${movementLine.value}.`
})
</script>

<template>
  <button
    class="celestial-instrument celestial-instrument--lunar"
    :class="[`celestial-instrument--${alignment}`, { 'celestial-instrument--compact': compact }]"
    type="button"
    :aria-label="accessibleLabel"
    data-celestial-instrument="lunar"
    @click="emit('openDetails')"
  >
    <CelestialCycleRing
      :labels="ringLabels"
      :label-start-angle-degrees="30"
      :active-index="viewModel.activeNodeIndex"
      :marker-angle-degrees="viewModel.markerAngleDegrees"
      :interpolate-marker="interpolateMarker"
      :reduce-motion="reduceMotion"
      kind="lunar"
    >
      <MoonPhaseGlyph
        :illumination-fraction="viewModel.illuminationFraction"
        :waxing="viewModel.waxing"
        :label="viewModel.phaseName"
        variant="instrument"
        decorative
      />
    </CelestialCycleRing>

    <CelestialInstrumentText
      :line-one="viewModel.phaseName"
      :line-two="nodeLine"
      line-two-fallback="Cantong qi node unavailable"
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

.celestial-instrument--right :deep(.celestial-cycle-ring) {
  order: 2;
}

.celestial-instrument--compact,
.celestial-instrument--compact.celestial-instrument--right {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: 0.2rem;
  padding: 0.1rem;
  text-align: center;
}

.celestial-instrument--compact.celestial-instrument--right :deep(.celestial-cycle-ring) {
  order: 0;
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

  .celestial-instrument--right :deep(.celestial-cycle-ring) {
    order: 0;
  }
}
</style>
