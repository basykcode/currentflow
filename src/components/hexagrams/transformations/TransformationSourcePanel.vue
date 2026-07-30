<script setup lang="ts">
import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import type { HexagramReference } from '@/domain/astrology/types'
import type { LineNumber } from '@/domain/yijing/transformations'

defineProps<{
  source: HexagramReference
  selectedMovingLines: readonly LineNumber[]
  chainLength: number
}>()

const emit = defineEmits<{
  reset: []
}>()
</script>

<template>
  <aside class="source-panel" aria-labelledby="transformation-source-title">
    <p class="source-kicker">Source figure</p>
    <HexagramGlyph
      :lines="source.linesBottomToTop"
      size="featured"
      :label="`Hexagram ${source.number}, ${source.nameEnglish}`"
    />
    <div>
      <span class="source-number">{{ source.number }}</span>
      <h2 id="transformation-source-title">{{ source.nameEnglish }}</h2>
      <p lang="zh-Hant">{{ source.nameChinese }} · {{ source.namePinyin }}</p>
    </div>
    <dl>
      <div>
        <dt>Upper</dt>
        <dd>{{ source.upperTrigram.nameEnglish }}</dd>
      </div>
      <div>
        <dt>Lower</dt>
        <dd>{{ source.lowerTrigram.nameEnglish }}</dd>
      </div>
      <div>
        <dt>Moving lines</dt>
        <dd>{{ selectedMovingLines.length ? selectedMovingLines.join(', ') : 'None selected' }}</dd>
      </div>
      <div>
        <dt>Chain length</dt>
        <dd>{{ chainLength }}</dd>
      </div>
    </dl>
    <button v-if="chainLength > 0" type="button" @click="emit('reset')">Reset chain</button>
  </aside>
</template>

<style scoped>
.source-panel {
  position: sticky;
  top: 1rem;
  display: grid;
  max-width: 100%;
  min-width: 0;
  align-content: start;
  gap: 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
  padding: 1rem;
}

.source-kicker {
  margin: 0;
  color: var(--jade);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hexagram-glyph {
  width: min(8rem, 100%);
  margin-inline: auto;
  color: var(--jade-deep);
}

.source-number {
  color: var(--cinnabar);
  font-size: 0.64rem;
}

h2 {
  margin: 0.1rem 0;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 500;
}

.source-panel > div > p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

dl {
  display: grid;
  gap: 0.45rem;
  margin: 0;
}

dl > div {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  border-top: 1px solid var(--line);
  padding-top: 0.45rem;
}

dt,
dd {
  min-width: 0;
  margin: 0;
  font-size: 0.6rem;
}

dd {
  overflow-wrap: anywhere;
}

dt {
  color: var(--ink-faint);
}

button {
  min-height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

@media (max-width: 900px) {
  .source-panel {
    position: static;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .source-kicker,
  dl,
  button {
    grid-column: 1 / -1;
  }

  .hexagram-glyph {
    width: 5rem;
  }
}
</style>
