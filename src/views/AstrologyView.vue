<script setup lang="ts">
import { computed, ref } from 'vue'

import CalculationProvenanceDetails from '@/components/astrology/CalculationProvenanceDetails.vue'
import CurrentFlowGlance from '@/components/astrology/CurrentFlowGlance.vue'
import SynthesisPanel from '@/components/astrology/SynthesisPanel.vue'
import { useShichenPhaseClock } from '@/composables/useShichenPhaseClock'
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import type { CelestialCurrentSnapshot } from '@/domain/current-flow/celestial-instruments'
import { celestialCurrentProvider } from '@/providers/localDeterministicCelestialCurrent'
import { currentFlowProvider } from '@/providers/currentFlow'
import { usePreferencesStore } from '@/stores/preferences'

const preferences = usePreferencesStore()
const snapshot = ref<CurrentFlowSnapshot | null>(null)
const celestial = ref<CelestialCurrentSnapshot | null>(null)
const calculationDetails = ref<{ open: () => Promise<void> } | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const selectedInstant = ref<Date | null>(null)

const flowPresentation = {
  sectionLabel: 'The Current Flow',
} as const

const timezoneLabel = computed(
  () => snapshot.value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
)

const phaseClock = useShichenPhaseClock({
  selectedInstant,
  load: async (instant) => {
    const currentFlow = await currentFlowProvider.getSnapshot(instant, {
      timezone: preferences.timezone,
      ...(preferences.locationLabel ? { locationLabel: preferences.locationLabel } : {}),
    })
    const celestialCurrent = celestialCurrentProvider.calculate(instant, {
      mode: selectedInstant.value ? 'selected' : 'live',
    })
    if (
      currentFlow.generatedAtIso !== celestialCurrent.instantUtc ||
      currentFlow.generatedAtIso !== instant.toISOString()
    ) {
      throw new Error('Temporal and celestial snapshots did not use the same instant.')
    }
    return Object.freeze({ currentFlow, celestialCurrent })
  },
  toClockState: ({ currentFlow }) => ({
    shichenId: currentFlow.organ.shichen.id,
    hourPhase: currentFlow.organ.hourPhase,
  }),
  nextSampleAt: ({ celestialCurrent }) =>
    celestialCurrent.nextRecommendedUpdateUtc
      ? new Date(celestialCurrent.nextRecommendedUpdateUtc)
      : null,
  onValue: ({ currentFlow, celestialCurrent }) => {
    snapshot.value = currentFlow
    celestial.value = celestialCurrent
    loading.value = false
    errorMessage.value = ''
  },
  onError: () => {
    errorMessage.value = 'The snapshot is unavailable. No temporal data has been inferred.'
    loading.value = false
  },
})

const openOrganDetails = () => {
  void calculationDetails.value?.open()
}
</script>

<template>
  <div class="page-shell astrology-page">
    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    <div v-else-if="loading && !snapshot" class="loading-state" aria-live="polite">
      Calculating the current temporal factors…
    </div>
    <template v-else-if="snapshot && celestial">
      <CurrentFlowGlance
        :snapshot="snapshot"
        :celestial="celestial"
        :timezone="timezoneLabel"
        :section-label="flowPresentation.sectionLabel"
        :last-temporal-event="phaseClock.lastEvent.value"
        :selected-time-jump="selectedInstant !== null"
        @open-organ-details="openOrganDetails"
      />
      <CalculationProvenanceDetails
        ref="calculationDetails"
        :snapshot="snapshot"
        :last-temporal-event="phaseClock.lastEvent.value"
      />
      <SynthesisPanel :snapshot="snapshot" :show-oltr="false" :show-provenance="false" />
    </template>
  </div>
</template>

<style scoped>
.astrology-page {
  padding-top: 0;
}

.loading-state,
.error-message {
  min-height: 22rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 2rem;
  color: var(--ink-soft);
}
</style>
