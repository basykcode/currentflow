<script setup lang="ts">
import type { OrganMoment } from '@/domain/astrology/types'

import OrganIllustration from './OrganIllustration.vue'

defineProps<{
  organ: OrganMoment
}>()
</script>

<template>
  <article class="organ-card">
    <div class="organ-copy">
      <p class="scope">Organ hour · active period</p>
      <h2>{{ organ.nameEnglish }}</h2>
      <p v-if="organ.nameChinese" class="chinese" lang="zh">{{ organ.nameChinese }}</p>
      <p class="time-range">{{ organ.timeRangeLabel }}</p>
      <div class="provenance">
        <span class="status-text">{{ organ.status }}</span>
        <span>{{ organ.sourceLabel }}</span>
      </div>
    </div>
    <OrganIllustration :organ-key="organ.key" />
  </article>
</template>

<style scoped>
.organ-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(9rem, 0.75fr);
  min-height: 20rem;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: clamp(1.1rem, 2.5vw, 1.8rem);
  box-shadow: var(--shadow-soft);
}

.organ-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.scope {
  margin-bottom: 0.65rem;
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

h2 {
  margin-bottom: 0.1rem;
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.chinese {
  color: var(--ink-soft);
  font-size: 1rem;
}

.time-range {
  margin: auto 0 1rem;
  color: var(--ink-soft);
  font-size: 0.86rem;
  overflow-wrap: anywhere;
}

.provenance {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-top: 1px solid var(--line);
  padding-top: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.3;
}

.status-text {
  flex: 0 0 auto;
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.provenance > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.organ-illustration {
  align-self: center;
  justify-self: end;
}

@media (max-width: 500px) {
  .organ-card {
    grid-template-columns: 1fr 7rem;
    min-height: 17rem;
  }

  .time-range {
    margin-top: 1.5rem;
  }
}
</style>
