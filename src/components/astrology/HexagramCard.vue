<script setup lang="ts">
import type { TemporalHexagram } from '@/domain/astrology/types'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

import HexagramGlyph from './HexagramGlyph.vue'

const props = defineProps<{
  item: TemporalHexagram
  featured?: boolean
}>()

const inspector = useHexagramInspectorStore()
const inspect = () => inspector.open(props.item.hexagram)
</script>

<template>
  <article
    class="hexagram-card"
    :class="{ 'hexagram-card--featured': featured }"
    role="button"
    tabindex="0"
    :aria-label="`Inspect Hexagram ${item.hexagram.number ?? ''}, ${item.hexagram.nameEnglish}`"
    @click="inspect"
    @keydown.enter="inspect"
    @keydown.space.prevent="inspect"
  >
    <div class="card-heading">
      <div>
        <p class="scope">{{ item.scope }}</p>
        <p class="scope-label">{{ item.label }}</p>
      </div>
      <span v-if="item.ganZhi" class="ganzhi">{{ item.ganZhi }}</span>
    </div>

    <p class="time-bounds">
      <span>Exact bounds</span>
      {{ item.timeBoundsLabel }}
    </p>

    <div class="glyph-wrap">
      <HexagramGlyph
        :lines="item.hexagram.linesBottomToTop"
        :size="featured ? 'featured' : 'regular'"
        :label="`${item.scope} hexagram, ${item.hexagram.nameEnglish}`"
      />
    </div>

    <div class="hexagram-name">
      <span v-if="item.hexagram.number" class="number">{{ item.hexagram.number }}</span>
      <div>
        <h2>{{ item.hexagram.nameEnglish }}</h2>
        <p v-if="item.hexagram.nameChinese" lang="zh">{{ item.hexagram.nameChinese }}</p>
      </div>
    </div>

    <div class="provenance">
      <span class="status-text">{{ item.status }}</span>
      <span>{{ item.sourceLabel }}</span>
    </div>
  </article>
</template>

<style scoped>
.hexagram-card {
  display: flex;
  flex-direction: column;
  min-height: 23rem;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: clamp(1.1rem, 2vw, 1.6rem);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.hexagram-card:hover {
  border-color: color-mix(in srgb, var(--jade) 55%, var(--line));
  transform: translateY(-2px);
}

.hexagram-card--featured {
  min-height: 28rem;
  border-color: color-mix(in srgb, var(--jade) 55%, var(--line));
  background: color-mix(in srgb, var(--paper-raised) 90%, var(--jade-wash));
  box-shadow: var(--shadow);
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.card-heading > * {
  min-width: 0;
}

.scope {
  margin-bottom: 0.15rem;
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.scope-label,
.ganzhi {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.ganzhi {
  max-width: 52%;
  overflow-wrap: anywhere;
  text-align: right;
}

.time-bounds {
  margin: 0.75rem 0 0;
  color: var(--ink-faint);
  font-size: 0.65rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.time-bounds span {
  display: block;
  margin-bottom: 0.12rem;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.glyph-wrap {
  display: grid;
  flex: 1;
  min-height: 10rem;
  color: var(--ink);
  place-items: center;
}

.hexagram-card--featured .glyph-wrap {
  min-height: 13rem;
  color: var(--jade-deep);
}

.hexagram-name {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  min-width: 0;
}

.hexagram-name > div {
  min-width: 0;
}

.number {
  display: grid;
  flex: 0 0 auto;
  width: 2.45rem;
  height: 2.45rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  place-items: center;
}

h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 500;
  overflow-wrap: break-word;
}

.hexagram-name p {
  margin: 0.1rem 0 0;
  color: var(--ink-soft);
  font-size: 0.95rem;
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

.provenance > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.status-text {
  flex: 0 0 auto;
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .hexagram-card,
  .hexagram-card--featured {
    min-height: 21rem;
  }

  .hexagram-card--featured {
    min-height: 24rem;
  }
}
</style>
