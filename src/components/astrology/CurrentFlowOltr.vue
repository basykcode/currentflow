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
      {{ bundle.status === 'available' ? 'One Line to Remember' : 'Guidance Status' }}
    </h2>
    <p>{{ bundle.status === 'available' ? bundle.oltr.text : bundle.reason }}</p>
  </section>
</template>

<style scoped>
.current-flow-oltr {
  min-width: 0;
  border-top: 1px solid color-mix(in srgb, var(--jade) 36%, var(--line));
  padding: var(--glance-oltr-padding, 0.65rem) clamp(0.25rem, 2vw, 0.75rem) 0;
  text-align: center;
}

h2 {
  margin: 0 0 0.2rem;
  color: var(--jade);
  font-family: var(--font-sans);
  font-size: var(--glance-scope-size, 0.62rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-transform: uppercase;
}

p {
  max-width: 68ch;
  margin: 0 auto;
  font-family: var(--font-serif);
  font-size: var(--glance-oltr-size, clamp(0.86rem, 3.5vw, 1.08rem));
  line-height: 1.28;
  text-wrap: balance;
}
</style>
