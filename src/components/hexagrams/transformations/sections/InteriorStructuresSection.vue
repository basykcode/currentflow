<script setup lang="ts">
import { computed } from 'vue'

import type { HexagramReference } from '@/domain/astrology/types'
import {
  getNuclearComparison,
  type LineNumber,
  type TransformationEngine,
  type TransformationResult,
} from '@/domain/yijing/transformations'

import TransformationHexagramCard from '../TransformationHexagramCard.vue'

const props = defineProps<{
  source: HexagramReference
  selectedMovingLines: readonly LineNumber[]
  visited: ReadonlySet<number>
  engine: TransformationEngine
}>()

const emit = defineEmits<{
  select: [result: TransformationResult]
}>()

const mutualField = computed(() => props.engine.getMutualField(props.source))
const deepNuclear = computed(() => props.engine.getDeepNuclear(props.source))
const nuclearComparison = computed(() =>
  getNuclearComparison(props.source, props.selectedMovingLines),
)
</script>

<template>
  <div class="section-stack">
    <header>
      <p>Overlapping structures</p>
      <h2>Interior</h2>
      <span>Traditional mutual structure and clearly labeled Current extensions.</span>
    </header>

    <section aria-labelledby="mutual-field-title">
      <h3 id="mutual-field-title">Complete Mutual Field</h3>
      <p class="section-note">
        Five projections expose the exact source-line geometry; no commentary is inferred.
      </p>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in mutualField"
          :key="result.id"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="deep-nuclear-title">
      <div class="section-heading">
        <div>
          <h3 id="deep-nuclear-title">Deep Nuclear Core</h3>
          <p class="section-note">
            N¹ is traditional; later iterations are Current structural exploration.
          </p>
        </div>
        <span v-if="deepNuclear.cycleLength">
          Cycle length {{ deepNuclear.cycleLength }} · repeats Hexagram
          {{ deepNuclear.repeatedHexagramNumber }}
        </span>
      </div>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in deepNuclear.stages"
          :key="result.id"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="nuclear-comparison-title">
      <h3 id="nuclear-comparison-title">Nuclear of the Relating Hexagram</h3>
      <p class="section-note">Visible source · inner source · visible result · inner result.</p>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in nuclearComparison"
          :key="`${result.id}-${result.operationLabels.join('-')}`"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-stack {
  display: grid;
  gap: 2rem;
}

header > p {
  margin: 0;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 {
  margin: 0.2rem 0;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 500;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 500;
}

header > span,
.section-note,
.section-heading > span {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.section-note {
  margin: 0.25rem 0 0.7rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (max-width: 700px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    display: grid;
  }
}
</style>
