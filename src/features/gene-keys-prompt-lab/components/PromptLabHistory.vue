<script setup lang="ts">
import { computed } from 'vue'

import { GENE_KEYS_SOURCE_OPTIONS } from '@/features/gene-keys-prompt-lab/domain'
import type { GeneKeysPromptLabHistoryEntry } from '@/features/gene-keys-prompt-lab/history'

defineProps<{
  entries: readonly GeneKeysPromptLabHistoryEntry[]
  activeId: string | null
}>()

const emit = defineEmits<{
  load: [entry: GeneKeysPromptLabHistoryEntry]
  clear: []
  export: []
}>()

const sourceLabels = computed(() =>
  Object.fromEntries(GENE_KEYS_SOURCE_OPTIONS.map((source) => [source.id, source.label])),
)

function formatSources(entry: GeneKeysPromptLabHistoryEntry) {
  if (entry.sourceIds.length === 0) {
    return 'No source text'
  }
  return entry.sourceIds.map((sourceId) => sourceLabels.value[sourceId]).join(' + ')
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
</script>

<template>
  <section class="history-panel" aria-labelledby="prompt-lab-history-title">
    <header class="history-header">
      <div>
        <p class="eyebrow">Device-local archive</p>
        <h2 id="prompt-lab-history-title">Saved iterations</h2>
        <p>Each successful generation is saved in this browser. Select one to restore it fully.</p>
      </div>
      <div v-if="entries.length" class="history-actions">
        <button class="quiet-button" type="button" @click="emit('export')">Export JSON</button>
        <button class="quiet-button" type="button" @click="emit('clear')">Clear history</button>
      </div>
    </header>

    <p v-if="!entries.length" class="history-empty">
      Your first generated experiment will appear here.
    </p>
    <ol v-else class="history-list">
      <li v-for="entry in entries" :key="entry.id">
        <button
          class="history-entry"
          :class="{ 'is-active': activeId === entry.id }"
          type="button"
          @click="emit('load', entry)"
        >
          <span class="history-key">Gene Key {{ entry.keyNumber }}</span>
          <strong>{{ entry.keyTitle }}</strong>
          <span>{{ formatSources(entry) }}</span>
          <time :datetime="entry.generatedAt">{{ formatDate(entry.generatedAt) }}</time>
          <small>{{ entry.prompt }}</small>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.history-panel {
  margin-top: clamp(3rem, 7vw, 5rem);
  border-top: 1px solid var(--line-strong);
  padding-top: 2rem;
}

.history-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.history-header h2 {
  margin-bottom: 0.5rem;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 500;
}

.history-header p:last-child,
.history-empty {
  margin-bottom: 0;
  color: var(--ink-soft);
}

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.history-empty {
  margin-top: 1.5rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.history-entry {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 0.28rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 86%, transparent);
  padding: 1rem;
  color: var(--ink-soft);
  text-align: left;
}

.history-entry:hover,
.history-entry.is-active {
  border-color: var(--jade);
  background: var(--jade-wash);
}

.history-entry strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.08rem;
}

.history-key {
  color: var(--jade);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.history-entry time {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.history-entry small {
  display: -webkit-box;
  margin-top: 0.35rem;
  overflow: hidden;
  color: var(--ink-faint);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 900px) {
  .history-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .history-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-list {
    grid-template-columns: 1fr;
  }
}
</style>
