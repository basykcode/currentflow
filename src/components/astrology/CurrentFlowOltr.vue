<script setup lang="ts">
import type { GuidanceBundle } from '@/domain/guidance/types'

defineProps<{
  bundle: GuidanceBundle
}>()
</script>

<template>
  <section
    class="current-flow-oltr"
    :data-status="bundle.status"
    aria-labelledby="current-flow-oltr-heading"
  >
    <h2 id="current-flow-oltr-heading">
      {{ bundle.status === 'available' ? 'OLTR · One Line To Remember' : 'Guidance Status' }}
    </h2>
    <p>{{ bundle.status === 'available' ? bundle.oltr.text : bundle.reason }}</p>
  </section>
</template>

<style scoped>
.current-flow-oltr {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(0.7rem, 2vw, 1.4rem);
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--jade) 42%, var(--line));
  border-radius: var(--glance-card-radius, var(--radius-md));
  background: color-mix(in srgb, var(--paper-raised) 82%, var(--jade-wash));
  padding: var(--glance-oltr-padding, 0.65rem) clamp(0.7rem, 2vw, 1.1rem);
}

h2 {
  margin: 0;
  color: var(--jade);
  font-family: var(--font-sans);
  font-size: var(--glance-scope-size, 0.62rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-transform: uppercase;
}

p {
  max-width: 74ch;
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--glance-oltr-size, clamp(0.86rem, 3.5vw, 1.08rem));
  line-height: 1.28;
  text-align: center;
  text-wrap: balance;
}

@media (max-width: 680px) {
  .current-flow-oltr {
    grid-template-columns: 1fr;
    gap: 0.12rem;
    padding-inline: 0.2rem;
    text-align: center;
  }

  p {
    max-width: none;
    line-height: 1.18;
  }
}
</style>
