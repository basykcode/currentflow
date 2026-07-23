<script setup lang="ts">
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'

import HexagramCard from './HexagramCard.vue'
import OrganCard from './OrganCard.vue'

defineProps<{
  snapshot: CurrentFlowSnapshot
}>()
</script>

<template>
  <section class="five-elements" aria-label="Five temporal elements">
    <div class="cell cell-year">
      <HexagramCard :item="snapshot.temporal.year" />
    </div>
    <div class="cell cell-day">
      <HexagramCard :item="snapshot.temporal.day" featured />
    </div>
    <div class="cell cell-month">
      <HexagramCard :item="snapshot.temporal.month" />
    </div>
    <div class="cell cell-organ">
      <OrganCard :organ="snapshot.organ" />
    </div>
    <div class="cell cell-hour">
      <HexagramCard :item="snapshot.temporal.hour" />
    </div>
  </section>
</template>

<style scoped>
.five-elements {
  display: grid;
  grid-template-areas:
    'year day day month'
    '. organ hour .';
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.05fr) minmax(0, 1.05fr) minmax(0, 0.9fr);
  gap: clamp(0.75rem, 2vw, 1.35rem);
  align-items: start;
}

.cell-year {
  grid-area: year;
}

.cell-day {
  grid-area: day;
}

.cell-month {
  grid-area: month;
}

.cell-organ {
  grid-area: organ;
}

.cell-hour {
  grid-area: hour;
}

.cell-day :deep(.hexagram-card) {
  width: min(100%, 30rem);
  margin-inline: auto;
}

.cell-organ {
  align-self: stretch;
}

.cell-hour :deep(.hexagram-card) {
  min-height: 20rem;
}

@media (max-width: 940px) {
  .five-elements {
    grid-template-areas:
      'day day'
      'year month'
      'organ organ'
      'hour hour';
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cell-day :deep(.hexagram-card),
  .cell-hour :deep(.hexagram-card) {
    width: min(100%, 36rem);
    margin-inline: auto;
  }
}

@media (max-width: 600px) {
  .five-elements {
    grid-template-areas:
      'day day'
      'year month'
      'organ organ'
      'hour hour';
    gap: 0.65rem;
  }

  .cell-year :deep(.hexagram-card),
  .cell-month :deep(.hexagram-card) {
    min-height: 18rem;
    padding: 0.9rem;
  }

  .cell-year :deep(.card-heading),
  .cell-month :deep(.card-heading) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cell-year :deep(.ganzhi),
  .cell-month :deep(.ganzhi) {
    text-align: left;
  }

  .cell-year :deep(.glyph-wrap),
  .cell-month :deep(.glyph-wrap) {
    min-height: 7.5rem;
  }

  .cell-year :deep(.hexagram-glyph),
  .cell-month :deep(.hexagram-glyph) {
    max-width: 5.5rem;
  }

  .cell-year :deep(.hexagram-name),
  .cell-month :deep(.hexagram-name) {
    align-items: flex-start;
    gap: 0.45rem;
  }

  .cell-year :deep(.number),
  .cell-month :deep(.number) {
    width: 1.9rem;
    height: 1.9rem;
    font-size: 0.78rem;
  }

  .cell-year :deep(h2),
  .cell-month :deep(h2) {
    font-size: 1rem;
  }

  .cell-year :deep(.hexagram-name p),
  .cell-month :deep(.hexagram-name p) {
    font-size: 0.78rem;
  }

  .cell-year :deep(.provenance),
  .cell-month :deep(.provenance) {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
