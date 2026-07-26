<script setup lang="ts">
import { computed, ref } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import HexagramLibraryCard from '@/components/hexagrams/HexagramLibraryCard.vue'
import {
  getHexagrams,
  HEXAGRAM_ORDERS,
  type HexagramOrder,
} from '@/domain/astrology/hexagrams'

const order = ref<HexagramOrder>('king-wen')
const hexagrams = computed(() => getHexagrams(order.value))
const activeOrder = computed(
  () => HEXAGRAM_ORDERS.find((option) => option.value === order.value) ?? HEXAGRAM_ORDERS[0],
)
</script>

<template>
  <div class="page-shell hexagram-library-page">
    <header class="library-header">
      <div class="page-intro">
        <p class="eyebrow">Other Tools · Reference library</p>
        <h1 class="page-title">The 64 Hexagrams</h1>
        <p class="page-lede">
          Browse the complete received set as structures, names, and relationships. Select any
          hexagram to open the shared inspection workspace.
        </p>
      </div>

      <label class="order-control">
        <span>Sequence</span>
        <select v-model="order" class="control">
          <option v-for="option in HEXAGRAM_ORDERS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <small aria-live="polite">{{ activeOrder?.description }}</small>
      </label>
    </header>

    <div class="library-provenance" role="note">
      <StatusBadge status="curated" label="64 verified entries" />
      <span>
        Zhouyi received names, King Wen numbers, line-derived trigram structures, and
        Wilhelm/Baynes English-title convention.
      </span>
    </div>

    <section class="hexagram-grid" :aria-label="`${activeOrder?.label} hexagram sequence`">
      <HexagramLibraryCard
        v-for="hexagram in hexagrams"
        :key="hexagram.number"
        :hexagram="hexagram"
      />
    </section>
  </div>
</template>

<style scoped>
.hexagram-library-page {
  --content: 1380px;
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
}

.library-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.page-intro {
  margin-bottom: 0;
}

.page-title {
  margin-bottom: 0.8rem;
  font-size: clamp(3rem, 7vw, 6.2rem);
}

.order-control {
  display: grid;
  flex: 0 0 min(100%, 17rem);
  gap: 0.4rem;
}

.order-control > span {
  color: var(--jade);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.order-control select {
  width: 100%;
}

.order-control small {
  min-height: 2.2rem;
  color: var(--ink-faint);
  font-size: 0.63rem;
}

.library-provenance {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1rem;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 0.75rem 0;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.library-provenance :deep(.status-label) {
  flex: 0 0 auto;
}

.hexagram-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.7rem;
}

@media (max-width: 1180px) {
  .hexagram-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hexagram-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .library-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-control {
    flex-basis: auto;
    width: min(100%, 24rem);
  }
}

@media (max-width: 520px) {
  .library-provenance {
    align-items: flex-start;
    flex-direction: column;
  }

  .hexagram-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }
}
</style>
