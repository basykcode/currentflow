<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import FiveElementComposition from '@/components/astrology/FiveElementComposition.vue'
import SynthesisPanel from '@/components/astrology/SynthesisPanel.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import { currentFlowProvider } from '@/providers/currentFlow'
import { usePreferencesStore } from '@/stores/preferences'

const preferences = usePreferencesStore()
const snapshot = ref<CurrentFlowSnapshot | null>(null)
const now = ref(new Date())
const loading = ref(true)
const errorMessage = ref('')
let clockTimer: number | undefined

const dateTimeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'medium',
    ...(snapshot.value ? { timeZone: snapshot.value.timezone } : {}),
  }).format(now.value),
)

const timezoneLabel = computed(
  () => snapshot.value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
)

const refresh = async () => {
  loading.value = true
  errorMessage.value = ''
  now.value = new Date()
  try {
    snapshot.value = await currentFlowProvider.getSnapshot(now.value, {
      timezone: preferences.timezone,
      ...(preferences.locationLabel ? { locationLabel: preferences.locationLabel } : {}),
    })
  } catch {
    errorMessage.value = 'The snapshot is unavailable. No temporal data has been inferred.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refresh()
  clockTimer = window.setInterval(() => {
    void refresh()
  }, 60_000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<template>
  <div class="page-shell astrology-page">
    <header class="flow-header">
      <div>
        <p class="eyebrow">Situational awareness for timing</p>
        <h1>The Current Flow</h1>
      </div>
      <div class="flow-meta" aria-live="polite">
        <StatusBadge
          :status="snapshot?.status ?? 'unavailable'"
          :label="snapshot ? 'Live calculation' : 'Awaiting calculation'"
        />
        <p>{{ dateTimeLabel }}</p>
        <p>{{ timezoneLabel }}</p>
        <p v-if="snapshot?.locationLabel">{{ snapshot.locationLabel }}</p>
        <button class="refresh-button" type="button" :disabled="loading" @click="refresh">
          <span aria-hidden="true">↻</span>
          {{ loading ? 'Loading' : 'Refresh snapshot' }}
        </button>
      </div>
    </header>

    <div class="calculation-boundary" role="note">
      <strong>Live, bounded calculation.</strong>
      GanZhi pillars, 60 Jia Zi hexagrams, organ period, and structural relationships are calculated
      for the selected timezone. Interpretive forecasts remain unavailable rather than inferred.
    </div>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    <div v-else-if="loading && !snapshot" class="loading-state" aria-live="polite">
      Calculating the current temporal factors…
    </div>
    <template v-else-if="snapshot">
      <FiveElementComposition :snapshot="snapshot" />
      <SynthesisPanel :snapshot="snapshot" />
    </template>
  </div>
</template>

<style scoped>
.astrology-page {
  padding-top: clamp(2rem, 4vw, 4rem);
}

.flow-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.25rem;
}

h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(3rem, 8vw, 7.2rem);
  font-weight: 400;
  letter-spacing: -0.055em;
}

.flow-meta {
  display: grid;
  justify-items: end;
  min-width: 16rem;
  padding-bottom: 0.75rem;
}

.flow-meta p {
  margin: 0.5rem 0 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.flow-meta p + p {
  margin-top: 0.05rem;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.refresh-button {
  margin-top: 0.75rem;
  background: transparent;
  padding: 0.25rem;
  color: var(--jade);
  font-size: 0.75rem;
}

.refresh-button span {
  display: inline-block;
  margin-right: 0.35rem;
}

.refresh-button:disabled {
  opacity: 0.5;
}

.calculation-boundary {
  margin-bottom: clamp(2rem, 5vw, 4rem);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 0.8rem 0;
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.calculation-boundary strong {
  color: var(--jade);
}

.loading-state,
.error-message {
  min-height: 22rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 2rem;
  color: var(--ink-soft);
}

@media (max-width: 680px) {
  .flow-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 1.25rem;
  }

  .flow-meta {
    justify-items: start;
    min-width: 0;
    padding: 0;
  }
}
</style>
