<script setup lang="ts">
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
    :aria-label="`Inspect Hexagram ${hexagram.number}, ${hexagram.nameEnglish}, ${hexagram.nameChinese}, ${hexagram.namePinyin}`"
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
  </button>
</template>

<style scoped>
.library-card {
  display: grid;
  position: relative;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  min-width: 0;
  min-height: 13.5rem;
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

@media (max-width: 520px) {
  .library-card {
    min-height: 12rem;
  }

  .card-copy strong {
    white-space: normal;
  }
}
</style>
