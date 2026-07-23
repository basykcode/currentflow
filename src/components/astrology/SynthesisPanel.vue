<script setup lang="ts">
import type { CurrentFlowSnapshot, ExecutionFriction } from '@/domain/astrology/types'

import RelatedHexagramCard from './RelatedHexagramCard.vue'

defineProps<{
  snapshot: CurrentFlowSnapshot
}>()

const frictionLabel: Record<ExecutionFriction, string> = {
  lower: 'Lower friction',
  neutral: 'Neutral friction',
  higher: 'Higher friction',
}
</script>

<template>
  <section class="synthesis" aria-labelledby="oltr-heading">
    <div class="oltr-block">
      <p class="eyebrow">OLTR · One Line To Remember</p>
      <h2 id="oltr-heading">{{ snapshot.synthesis.oltr }}</h2>
    </div>

    <div class="synthesis-grid">
      <section class="intention panel" aria-labelledby="intention-heading">
        <p class="section-number">01</p>
        <p class="eyebrow">Internal orientation</p>
        <h3 id="intention-heading">Recommended Intention</h3>
        <p>{{ snapshot.synthesis.recommendedIntention }}</p>
      </section>

      <section class="execution panel" aria-labelledby="execution-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Available movements</p>
            <h3 id="execution-heading">Recommended Execution</h3>
          </div>
          <p class="section-number">02</p>
        </div>
        <ul>
          <li v-for="item in snapshot.synthesis.recommendedExecution" :key="item.label">
            <div>
              <strong>{{ item.label }}</strong>
              <p v-if="item.rationale">{{ item.rationale }}</p>
            </div>
            <span class="friction" :data-friction="item.friction">
              {{ frictionLabel[item.friction] }}
            </span>
          </li>
        </ul>
      </section>
    </div>

    <section class="related" aria-labelledby="related-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Illustrative relationships</p>
          <h3 id="related-heading">Related Hexagrams</h3>
        </div>
        <p class="demo-explainer">
          Demo only · Plum Blossom transformation logic is not connected.
        </p>
      </div>
      <div class="related-grid">
        <RelatedHexagramCard
          v-for="item in snapshot.synthesis.relatedHexagrams"
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

    <details class="provenance-details">
      <summary>Demo provenance and limits</summary>
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
.synthesis {
  margin-top: clamp(4rem, 9vw, 8rem);
}

.oltr-block {
  max-width: 58rem;
  margin-inline: auto;
  padding-inline: 1rem;
  text-align: center;
}

.oltr-block h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5.4vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.synthesis-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 1rem;
  margin-top: clamp(3rem, 7vw, 6rem);
}

.intention,
.execution {
  padding: clamp(1.25rem, 3vw, 2rem);
}

.section-number {
  margin: 0 0 3rem;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.8rem;
}

h3 {
  margin-bottom: 1rem;
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 500;
  letter-spacing: -0.02em;
}

.intention > p:last-child {
  max-width: 35ch;
  margin: 2.5rem 0 0;
  color: var(--ink-soft);
  font-size: 1.05rem;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.execution .section-number {
  margin: 0;
}

.execution ul,
.provenance-details ul {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.execution li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--line);
  padding-block: 1rem;
}

.execution strong {
  font-size: 0.93rem;
  font-weight: 600;
}

.execution li p {
  max-width: 47ch;
  margin: 0.3rem 0 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.friction {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  color: var(--ink-soft);
  font-size: 0.65rem;
}

.friction[data-friction='lower'] {
  border-color: color-mix(in srgb, var(--jade) 40%, var(--line));
  color: var(--jade);
}

.friction[data-friction='higher'] {
  border-style: dashed;
  color: var(--cinnabar);
}

.related {
  margin-top: clamp(3.5rem, 8vw, 7rem);
}

.related .section-heading {
  align-items: end;
}

.demo-explainer {
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
  .synthesis-grid {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .oltr-block {
    padding-inline: 0.4rem;
  }

  .execution li,
  .future-depth,
  .related .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .demo-explainer {
    text-align: left;
  }
}
</style>
