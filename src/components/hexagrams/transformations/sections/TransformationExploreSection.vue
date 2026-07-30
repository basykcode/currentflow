<script setup lang="ts">
import { computed } from 'vue'

import { getHexagram } from '@/domain/astrology/hexagrams'
import type { HexagramReference } from '@/domain/astrology/types'
import {
  getKingWenContext,
  getRelatingResult,
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

const coreResults = computed(() => [
  getRelatingResult(props.source, props.selectedMovingLines),
  ...props.engine.getIntrinsic(props.source),
])
const symmetryResults = computed(() => props.engine.getSymmetry(props.source))
const textualResults = computed(() => getKingWenContext(props.source))
const centralNuclear = computed(() =>
  props.engine.getIntrinsic(props.source).find((result) => result.definitionId === 'nuclear'),
)
const nuclearTarget = computed(() =>
  centralNuclear.value?.targetHexagramNumber === undefined
    ? null
    : getHexagram(centralNuclear.value.targetHexagramNumber),
)
const quickInterior = computed(() => [
  ...(centralNuclear.value ? [centralNuclear.value] : []),
  ...props.engine.getDeepNuclear(props.source).stages.slice(1, 3),
])
</script>

<template>
  <div class="section-stack">
    <header>
      <p>Structural overview</p>
      <h2>Explore</h2>
      <span>
        A concise map of calculable relationships. Results are structures, not forecasts.
      </span>
    </header>

    <section aria-labelledby="explore-core-title">
      <h3 id="explore-core-title">Core transformations</h3>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in coreResults"
          :key="result.id"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="explore-symmetry-title">
      <div class="section-heading">
        <h3 id="explore-symmetry-title">Symmetry family</h3>
        <span>1–8 distinct targets; convergent operations stay visible.</span>
      </div>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in symmetryResults"
          :key="result.id"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="explore-textual-title">
      <div class="section-heading">
        <h3 id="explore-textual-title">Textual context</h3>
        <span>Sequence relationships remain distinct from geometric transformations.</span>
      </div>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in textualResults"
          :key="result.id"
          :result="result"
          :visited="
            result.targetHexagramNumber !== undefined && visited.has(result.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="explore-interior-title">
      <div class="section-heading">
        <h3 id="explore-interior-title">Quick interior</h3>
        <span>Central mutual structure and two deeper Current iterations.</span>
      </div>
      <p v-if="nuclearTarget" class="interior-trigrams">
        Lower nuclear trigram: {{ nuclearTarget.lowerTrigram.nameEnglish }} · Upper nuclear trigram:
        {{ nuclearTarget.upperTrigram.nameEnglish }}
      </p>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="result in quickInterior"
          :key="result.id"
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

header > span,
.section-heading > span {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 500;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.7rem;
}

.interior-trigrams {
  margin: 0.4rem 0 0;
  color: var(--ink-faint);
  font-size: 0.67rem;
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
