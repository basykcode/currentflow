<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import FiveElementComposition from '@/components/astrology/FiveElementComposition.vue'
import SynthesisPanel from '@/components/astrology/SynthesisPanel.vue'
import YinClock from '@/components/astrology/YinClock.vue'
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import { currentFlowProvider } from '@/providers/currentFlow'
import { usePreferencesStore } from '@/stores/preferences'

const preferences = usePreferencesStore()
const snapshot = ref<CurrentFlowSnapshot | null>(null)
const loading = ref(true)
const errorMessage = ref('')
let clockTimer: number | undefined

const timezoneLabel = computed(
  () => snapshot.value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
)

const refresh = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    snapshot.value = await currentFlowProvider.getSnapshot(new Date(), {
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
      <div class="flow-meta">
        <YinClock :timezone="timezoneLabel" />
        <p v-if="snapshot?.locationLabel" class="location-label">{{ snapshot.locationLabel }}</p>
      </div>
    </header>

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
  align-items: center;
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
  min-width: min(44vw, 27rem);
}

.location-label {
  margin: 0.5rem 0 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
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
  }
}
</style>
