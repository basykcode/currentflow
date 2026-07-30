<script setup lang="ts">
import { computed } from 'vue'

import {
  SOURCE_GATED_MODULES,
  type TransformationLabSectionId,
} from '@/domain/yijing/transformations'

const props = defineProps<{
  section: Extract<TransformationLabSectionId, 'classical-systems' | 'time-maps'>
}>()

const modules = computed(() =>
  SOURCE_GATED_MODULES.filter((module) => module.section === props.section),
)
const title = computed(() =>
  props.section === 'classical-systems' ? 'Classical Systems' : 'Time & Maps',
)
const kicker = computed(() =>
  props.section === 'classical-systems'
    ? 'Lineage-specific modules'
    : 'Temporal and precelestial maps',
)
</script>

<template>
  <div class="section-stack">
    <header>
      <p>{{ kicker }}</p>
      <h2>{{ title }}</h2>
      <span>
        Typed extension points are ready. Targets remain unavailable until verified tables are
        connected.
      </span>
    </header>

    <div class="module-grid">
      <article v-for="module in modules" :key="module.id">
        <div class="module-heading">
          <span>{{ module.tradition }}</span>
          <span class="status">Source needed</span>
        </div>
        <h3>{{ module.label }}</h3>
        <p>{{ module.sourceRequirement }}</p>
        <small>No target or interpretation is inferred.</small>
      </article>
    </div>

    <article v-if="section === 'time-maps'" class="availability-note">
      <span>Daoist alchemical overlay</span>
      <h3>Cantong Qi remains an interpretive source module</h3>
      <p>
        Current does not manufacture one alchemical destination for every hexagram. Only reviewed
        claims may activate this module.
      </p>
    </article>
  </div>
</template>

<style scoped>
.section-stack {
  display: grid;
  gap: 1.5rem;
}

header > p,
.module-heading > span:first-child,
.availability-note > span {
  margin: 0;
  color: var(--jade);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

h2 {
  margin: 0.2rem 0;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 500;
}

header > span,
article p,
article small {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

article {
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 62%, transparent);
  padding: 1rem;
}

.module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.18rem 0.4rem;
  color: var(--ink-faint);
  font-size: 0.5rem;
}

h3 {
  margin: 0.45rem 0 0;
  font-family: var(--font-serif);
  font-size: 1.08rem;
  font-weight: 500;
}

article p {
  margin: 0.4rem 0;
}

.availability-note {
  border-style: solid;
  border-color: color-mix(in srgb, var(--jade) 30%, var(--line));
}

@media (max-width: 700px) {
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
