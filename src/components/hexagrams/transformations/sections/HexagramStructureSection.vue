<script setup lang="ts">
import { computed } from 'vue'

import type { HexagramReference } from '@/domain/astrology/types'
import { getStructuralAnatomy } from '@/domain/yijing/transformations'

const props = defineProps<{
  source: HexagramReference
}>()

const anatomy = computed(() => getStructuralAnatomy(props.source))
</script>

<template>
  <div class="section-stack">
    <header>
      <p>Deterministic anatomy</p>
      <h2>Structure</h2>
      <span>
        Positional conventions describe the figure’s construction; they are not moral ratings.
      </span>
      <small class="structure-provenance">
        {{ anatomy.provenance.tradition }} · {{ anatomy.provenance.availability }} ·
        {{ anatomy.provenance.sourceIds.join(', ') }}
      </small>
    </header>

    <section aria-labelledby="line-anatomy-title">
      <h3 id="line-anatomy-title">Line positions</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Polarity</th>
              <th>Trigram</th>
              <th>Three Powers</th>
              <th>Centrality</th>
              <th>Position convention</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in [...anatomy.lines].reverse()" :key="line.lineNumber">
              <th scope="row">{{ line.lineNumber }}</th>
              <td>{{ line.polarity }}</td>
              <td>{{ line.trigramPosition }}</td>
              <td>{{ line.threePowers }}</td>
              <td>{{ line.central ? 'Central' : 'Noncentral' }}</td>
              <td>{{ line.positionConvention }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="correspondence-title">
      <h3 id="correspondence-title">Correspondence</h3>
      <div class="correspondence-grid">
        <article v-for="pair in anatomy.correspondence" :key="pair.lowerLine">
          <span>Lines {{ pair.lowerLine }} ↔ {{ pair.upperLine }}</span>
          <strong>{{ pair.classification }}</strong>
          <small>
            {{ pair.classification === 'responsive' ? 'Different' : 'Matching' }} polarities
          </small>
        </article>
      </div>
    </section>

    <section aria-labelledby="trigram-anatomy-title">
      <h3 id="trigram-anatomy-title">Trigram anatomy</h3>
      <dl class="trigram-grid">
        <div>
          <dt>Lower trigram</dt>
          <dd>{{ anatomy.trigrams.lower.nameEnglish }}</dd>
        </div>
        <div>
          <dt>Upper trigram</dt>
          <dd>{{ anatomy.trigrams.upper.nameEnglish }}</dd>
        </div>
        <div>
          <dt>Lower nuclear trigram</dt>
          <dd>{{ anatomy.trigrams.lowerNuclear.nameEnglish }}</dd>
        </div>
        <div>
          <dt>Upper nuclear trigram</dt>
          <dd>{{ anatomy.trigrams.upperNuclear.nameEnglish }}</dd>
        </div>
      </dl>
    </section>

    <section class="source-needed" aria-labelledby="extended-structure-title">
      <h3 id="extended-structure-title">Source-gated anatomy</h3>
      <p>
        Governing line, Support / Riding, and Body / Use remain unassigned until a verified rule set
        and the required moving-line or Plum Blossom context are selected.
      </p>
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
  margin: 0 0 0.7rem;
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 500;
}

header > span,
.source-needed p {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.structure-provenance {
  display: block;
  margin-top: 0.35rem;
  color: var(--ink-faint);
  font-size: 0.56rem;
  text-transform: capitalize;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.67rem;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 0.65rem 0.5rem;
  text-align: left;
}

thead th {
  color: var(--ink-faint);
  font-size: 0.54rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

tbody th {
  color: var(--jade);
}

.correspondence-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.trigram-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 0;
}

.trigram-grid > div {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.8rem;
}

.trigram-grid dt {
  color: var(--ink-faint);
  font-size: 0.56rem;
}

.trigram-grid dd {
  margin: 0.2rem 0 0;
  font-family: var(--font-serif);
}

article,
.source-needed {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.8rem;
}

article {
  display: grid;
  gap: 0.2rem;
}

article span,
article small {
  color: var(--ink-faint);
  font-size: 0.58rem;
}

article strong {
  font-family: var(--font-serif);
  font-weight: 500;
  text-transform: capitalize;
}

.source-needed {
  border-style: dashed;
}

.source-needed p {
  margin: 0;
}

@media (max-width: 600px) {
  .correspondence-grid,
  .trigram-grid {
    grid-template-columns: 1fr;
  }
}
</style>
