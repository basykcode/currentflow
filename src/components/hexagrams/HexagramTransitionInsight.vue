<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import { createHexagramTransitionRepository } from '@/features/hexagram-transitions/repository'
import type { HexagramTransitionSummary } from '@/features/hexagram-transitions/types'

const props = defineProps<{
  sourceHexagramNumber: number
  targetHexagramNumber: number
  changingLine: number
}>()

const repository = createHexagramTransitionRepository()
const transition = ref<HexagramTransitionSummary | null>(null)
const loading = ref(true)
const unavailableReason = ref('')
let requestVersion = 0

const routeLabel = computed(() => `${props.sourceHexagramNumber} → ${props.targetHexagramNumber}`)
const reviewLabel = computed(() =>
  transition.value?.review.status === 'human-approved'
    ? 'Human reviewed'
    : 'Draft · review required',
)

watch(
  () => [props.sourceHexagramNumber, props.targetHexagramNumber, props.changingLine] as const,
  async ([sourceHexagramNumber, targetHexagramNumber, changingLine]) => {
    const currentRequest = ++requestVersion
    loading.value = true
    transition.value = null
    unavailableReason.value = ''

    const result = await repository.getTransition(sourceHexagramNumber, targetHexagramNumber)
    if (currentRequest !== requestVersion) return

    if (!result || result.changingLine !== changingLine) {
      unavailableReason.value =
        'No source-grounded Forest summary is available for this line change.'
    } else {
      transition.value = result
    }
    loading.value = false
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="transition-insight"
    :aria-label="`Forest of Changes commentary for ${routeLabel}`"
    aria-live="polite"
  >
    <div v-if="loading" class="transition-state">Loading the transition evidence…</div>

    <div v-else-if="!transition" class="transition-state">
      {{ unavailableReason }}
    </div>

    <template v-else>
      <header>
        <div>
          <p>Forest of Changes · {{ routeLabel }}</p>
          <h4>{{ transition.theme }}</h4>
        </div>
        <StatusBadge
          :status="transition.review.status === 'human-approved' ? 'curated' : 'demo'"
          :label="reviewLabel"
        />
      </header>

      <p class="transition-summary">{{ transition.summary }}</p>

      <details>
        <summary>Source and method</summary>
        <p>
          Original summary of the <span lang="zh-Hant">焦氏易林</span> entry
          {{ transition.source.sourceLocator }}, using Christopher Gait’s translation. It is not a
          quotation, prediction, or canonical line-text replacement.
        </p>
        <p v-if="transition.source.crossReferenceChain.length > 0">
          The supplied edition redirects this locator through
          {{ transition.source.crossReferenceChain.join(' → ') }} to
          {{ transition.source.resolvedLocator }}.
        </p>
      </details>
    </template>
  </section>
</template>

<style scoped>
.transition-insight {
  display: grid;
  gap: 0.6rem;
  margin-top: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--jade) 34%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--jade-wash) 42%, var(--paper-raised));
  padding: 0.8rem;
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

header p {
  margin: 0;
  color: var(--jade);
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h4 {
  margin: 0.18rem 0 0;
  font-family: var(--font-serif);
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.25;
}

header :deep(.status-label) {
  flex: 0 0 auto;
  padding: 0.18rem 0.38rem;
  font-size: 0.46rem;
}

.transition-summary,
details p,
.transition-state {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.66rem;
  line-height: 1.55;
}

details {
  border-top: 1px solid var(--line);
  padding-top: 0.55rem;
  color: var(--ink-faint);
  font-size: 0.6rem;
}

summary {
  width: fit-content;
  cursor: pointer;
  color: var(--jade);
  font-weight: 750;
}

details p {
  margin-top: 0.45rem;
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.transition-state {
  color: var(--ink-faint);
}
</style>
