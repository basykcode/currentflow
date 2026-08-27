<script setup lang="ts">
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'

import GuidanceOutputPanel from './GuidanceOutputPanel.vue'
import RelatedHexagramCard from './RelatedHexagramCard.vue'

withDefaults(
  defineProps<{
    snapshot: CurrentFlowSnapshot
    showGuidance?: boolean
    showOltr?: boolean
    showProvenance?: boolean
  }>(),
  {
    showGuidance: true,
    showOltr: true,
    showProvenance: true,
  },
)
</script>

<template>
  <section
    class="synthesis"
    :class="{ 'synthesis--depth-only': !showGuidance }"
    aria-label="Current guidance and related hexagrams"
  >
    <GuidanceOutputPanel v-if="showGuidance" :bundle="snapshot.guidance" :show-oltr="showOltr" />

    <section class="related" aria-labelledby="related-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Line-derived relationships</p>
          <h3 id="related-heading">Related Hexagrams</h3>
        </div>
        <p class="relationship-explainer">
          Deterministic nuclear, reverse, and complementary forms of the day hexagram.
        </p>
      </div>
      <div class="related-grid">
        <RelatedHexagramCard
          v-for="item in snapshot.relatedHexagrams"
          :key="`${item.hexagram.number ?? 'unknown'}-${item.relationshipLabel}`"
          :item="item"
        />
      </div>
    </section>

    <section class="future-depth panel" aria-labelledby="future-heading">
      <div>
        <p class="eyebrow">Depth layer</p>
        <h3 id="future-heading">
          The visible result will eventually open into its verified factors.
        </h3>
      </div>
      <button class="quiet-button" type="button" disabled>
        Explore the factors · Coming later
      </button>
    </section>

    <details v-if="showProvenance" class="provenance-details">
      <summary>Calculation provenance and limits</summary>
      <div>
        <p>
          Provider <strong>{{ snapshot.provenance.providerId }}</strong> · version
          {{ snapshot.provenance.modelVersion }}
        </p>
        <ul>
          <li v-for="note in snapshot.provenance.notes" :key="note">{{ note }}</li>
        </ul>
      </div>
    </details>
  </section>
</template>

<style scoped>
.synthesis:not(.synthesis--depth-only) {
  margin-top: clamp(4rem, 9vw, 8rem);
}

h3 {
  margin-bottom: 1rem;
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 500;
  letter-spacing: -0.02em;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.provenance-details ul {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.related {
  margin-top: clamp(3.5rem, 8vw, 7rem);
}

.synthesis--depth-only .related {
  margin-top: clamp(2.5rem, 6vw, 5rem);
}

.related .section-heading {
  align-items: end;
}

.relationship-explainer {
  max-width: 28rem;
  margin: 0 0 1rem;
  color: var(--ink-faint);
  font-size: 0.75rem;
  text-align: right;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.future-depth {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 4rem;
  padding: clamp(1.25rem, 3vw, 2rem);
}

.future-depth h3 {
  max-width: 35rem;
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.65rem);
}

.future-depth button:disabled {
  opacity: 0.62;
}

.provenance-details {
  margin-top: 1rem;
  border-bottom: 1px solid var(--line);
  padding: 1rem 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.provenance-details summary {
  width: fit-content;
  cursor: pointer;
  font-weight: 600;
}

.provenance-details > div {
  max-width: 48rem;
  padding-top: 1rem;
}

.provenance-details li {
  margin-top: 0.35rem;
}

@media (max-width: 800px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .future-depth,
  .related .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .relationship-explainer {
    text-align: left;
  }
}
</style>
