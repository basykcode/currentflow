<script setup lang="ts">
import { computed, ref } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import HexagramLibraryCard from '@/components/hexagrams/HexagramLibraryCard.vue'
import { getHexagrams, HEXAGRAM_ORDERS, type HexagramOrder } from '@/domain/astrology/hexagrams'
import { filterHexagrams } from '@/domain/astrology/hexagramSearch'

const order = ref<HexagramOrder>('king-wen')
const filter = ref('')
const hexagrams = computed(() => getHexagrams(order.value))
const activeOrder = computed(
  () => HEXAGRAM_ORDERS.find((option) => option.value === order.value) ?? HEXAGRAM_ORDERS[0],
)

const filteredHexagrams = computed(() => filterHexagrams(hexagrams.value, filter.value))

const clearFilter = () => {
  filter.value = ''
}
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

      <div class="library-controls">
        <label class="filter-control" for="hexagram-filter">
          <span>Filter hexagrams</span>
          <span class="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
            <input
              id="hexagram-filter"
              v-model="filter"
              class="control"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="Number, name, Chinese, pinyin, or Gene Key"
              @keydown.esc="clearFilter"
            />
            <button
              v-if="filter"
              class="clear-filter"
              type="button"
              aria-label="Clear hexagram filter"
              @click="clearFilter"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
          </span>
          <small>Search names, characters, pinyin, Shadow, Gift, or Siddhi.</small>
        </label>

        <label class="order-control">
          <span>Sequence</span>
          <select v-model="order" class="control">
            <option v-for="option in HEXAGRAM_ORDERS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <small>{{ activeOrder?.description }}</small>
        </label>
      </div>
    </header>

    <div class="library-provenance" role="note">
      <StatusBadge status="curated" label="64 verified entries" />
      <span>
        Zhouyi received names, King Wen numbers, line-derived trigram structures, and Wilhelm/Baynes
        English-title convention.
      </span>
    </div>

    <p class="filter-summary" aria-live="polite" aria-atomic="true">
      <strong>{{ filteredHexagrams.length }}</strong> of 64 hexagrams
      <span v-if="filter.trim()"> matching “{{ filter.trim() }}”</span>
    </p>

    <section
      v-if="filteredHexagrams.length"
      class="hexagram-grid"
      :aria-label="`${activeOrder?.label} hexagram sequence`"
    >
      <HexagramLibraryCard
        v-for="hexagram in filteredHexagrams"
        :key="hexagram.number"
        :hexagram="hexagram"
      />
    </section>

    <div v-else class="empty-state">
      <p>No hexagrams match “{{ filter.trim() }}”.</p>
      <button class="button button-secondary" type="button" @click="clearFilter">
        Clear filter
      </button>
    </div>
  </div>
</template>

<style scoped>
.hexagram-library-page {
  --content: 1380px;
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
}

.library-header {
  display: flex;
  align-items: flex-start;
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

.library-controls {
  display: grid;
  flex: 0 0 min(100%, 35rem);
  grid-template-columns: minmax(17rem, 1fr) minmax(12rem, 0.7fr);
  gap: 1rem;
}

.filter-control,
.order-control {
  display: grid;
  gap: 0.4rem;
}

.filter-control > span:first-child,
.order-control > span {
  color: var(--jade);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filter-control input,
.order-control select {
  width: 100%;
}

.filter-control small,
.order-control small {
  min-height: 2.2rem;
  color: var(--ink-faint);
  font-size: 0.63rem;
}

.search-field {
  position: relative;
  display: block;
}

.search-field > svg {
  position: absolute;
  top: 50%;
  left: 0.8rem;
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  fill: none;
  stroke: var(--ink-faint);
  stroke-linecap: round;
  stroke-width: 1.7;
  transform: translateY(-50%);
}

.search-field input {
  padding-right: 2.6rem;
  padding-left: 2.35rem;
}

.search-field input::-webkit-search-cancel-button {
  display: none;
}

.clear-filter {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  display: grid;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  padding: 0;
  color: var(--ink-faint);
  cursor: pointer;
  place-items: center;
  transform: translateY(-50%);
}

.clear-filter:hover {
  background: var(--jade-wash);
  color: var(--ink);
}

.clear-filter svg {
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.5;
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

.filter-summary {
  margin: 0 0 0.9rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.filter-summary strong {
  color: var(--ink-soft);
  font-weight: 700;
}

.hexagram-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.7rem;
}

.empty-state {
  display: grid;
  min-height: 16rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  color: var(--ink-faint);
  place-content: center;
  justify-items: center;
  text-align: center;
}

.empty-state p {
  margin: 0 0 1rem;
}

@media (max-width: 1180px) {
  .hexagram-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .library-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .library-controls {
    width: min(100%, 38rem);
  }

  .hexagram-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .library-controls {
    grid-template-columns: 1fr;
    width: 100%;
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
