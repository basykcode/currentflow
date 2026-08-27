<script setup lang="ts">
import GeneKeyFrequencyIcon from '@/components/astrology/GeneKeyFrequencyIcon.vue'
import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import type { HexagramReference } from '@/domain/astrology/types'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

const props = defineProps<{
  hexagram: HexagramReference
}>()

const inspector = useHexagramInspectorStore()
</script>

<template>
  <button
    class="library-card"
    type="button"
    :aria-label="`Inspect Hexagram ${hexagram.number}, ${hexagram.nameEnglish}, ${hexagram.nameChinese}, ${hexagram.namePinyin}. Gene Key spectrum: Shadow ${hexagram.geneKey.shadow}, Gift ${hexagram.geneKey.gift}, Siddhi ${hexagram.geneKey.siddhi}`"
    @click="inspector.open(props.hexagram)"
  >
    <span class="card-number">{{ hexagram.number.toString().padStart(2, '0') }}</span>
    <HexagramGlyph
      :lines="hexagram.linesBottomToTop"
      size="compact"
      :label="`Hexagram ${hexagram.number}, ${hexagram.nameEnglish}`"
    />
    <span class="card-copy">
      <strong>{{ hexagram.nameEnglish }}</strong>
      <span lang="zh-Hant">{{ hexagram.nameChinese }}</span>
      <small>{{ hexagram.namePinyin }}</small>
    </span>

    <ul class="gene-key-spectrum" :aria-label="`Gene Key ${hexagram.number} frequency spectrum`">
      <li class="gene-key-spectrum__shadow">
        <GeneKeyFrequencyIcon band="shadow" />
        <span class="frequency-label">Shadow</span>
        <span>{{ hexagram.geneKey.shadow }}</span>
      </li>
      <li class="gene-key-spectrum__gift">
        <GeneKeyFrequencyIcon band="gift" />
        <span class="frequency-label">Gift</span>
        <span>{{ hexagram.geneKey.gift }}</span>
      </li>
      <li class="gene-key-spectrum__siddhi">
        <GeneKeyFrequencyIcon band="siddhi" />
        <span class="frequency-label">Siddhi</span>
        <span>{{ hexagram.geneKey.siddhi }}</span>
      </li>
    </ul>
  </button>
</template>

<style scoped>
.library-card {
  display: grid;
  position: relative;
  grid-template-rows: auto minmax(4rem, 1fr) auto auto;
  justify-items: center;
  min-width: 0;
  min-height: 17.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 88%, transparent);
  padding: 0.8rem;
  color: var(--ink);
  text-align: center;
  box-shadow: var(--shadow-soft);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.library-card:hover {
  border-color: color-mix(in srgb, var(--jade) 62%, var(--line));
  background: color-mix(in srgb, var(--jade-wash) 56%, var(--paper-raised));
  transform: translateY(-3px);
}

.card-number {
  justify-self: start;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.72rem;
}

.hexagram-glyph {
  align-self: center;
  width: 3.8rem;
  color: var(--jade-deep);
}

.card-copy {
  display: grid;
  width: 100%;
  min-width: 0;
}

.card-copy strong {
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-copy > span {
  margin-top: 0.2rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.card-copy small {
  color: var(--ink-faint);
  font-size: 0.59rem;
}

.gene-key-spectrum {
  display: grid;
  width: 100%;
  gap: 0.28rem;
  margin: 0.7rem 0 0;
  border-top: 1px solid var(--line);
  padding: 0.65rem 0 0;
  font-size: 0.58rem;
  line-height: 1.25;
  list-style: none;
  text-align: left;
}

.gene-key-spectrum li {
  display: grid;
  grid-template-columns: 0.85rem 2.2rem minmax(0, 1fr);
  align-items: baseline;
  gap: 0.3rem;
  min-width: 0;
}

.gene-key-spectrum :deep(.gene-key-frequency-icon) {
  align-self: center;
  font-size: 0.72rem;
}

.gene-key-spectrum__shadow {
  color: var(--ink-faint);
}

.gene-key-spectrum__gift {
  color: var(--jade);
}

.gene-key-spectrum__siddhi {
  color: var(--ink);
}

.frequency-label {
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (max-width: 520px) {
  .library-card {
    min-height: 16.75rem;
  }

  .card-copy strong {
    white-space: normal;
  }
}
</style>
