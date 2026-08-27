<script setup lang="ts">
import { computed } from 'vue'

import type { TemporalHexagram } from '@/domain/astrology/types'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

import GeneKeyFrequencyIcon from './GeneKeyFrequencyIcon.vue'
import HexagramGlyph from './HexagramGlyph.vue'
import ZodiacIllustration from './ZodiacIllustration.vue'

const props = withDefaults(
  defineProps<{
    item: TemporalHexagram
    density?: 'glance-compact' | 'glance-featured' | 'glance-regular' | 'standard'
    visualLayout?: 'stacked' | 'horizontal'
  }>(),
  { density: 'standard', visualLayout: 'stacked' },
)

const inspector = useHexagramInspectorStore()
const inspect = () => inspector.open(props.item.hexagram)
const isGlance = computed(() => props.density.startsWith('glance-'))
const glyphSize = computed(() => {
  if (props.density === 'glance-compact') return 'compact'
  if (props.density === 'glance-featured') return 'featured'
  return 'regular'
})
const compactGanZhi = computed(() => props.item.ganZhi?.split('·').at(-1)?.trim())
</script>

<template>
  <article
    class="hexagram-card"
    :class="[
      `hexagram-card--${density}`,
      `hexagram-card--visual-${visualLayout}`,
      { 'hexagram-card--glance': isGlance },
    ]"
    :data-density="density"
  >
    <button
      class="card-action"
      type="button"
      :aria-label="`Inspect ${item.scope} Hexagram ${item.hexagram.number ?? ''}, ${item.hexagram.nameEnglish}`"
      @click="inspect"
      @keydown.enter="inspect"
      @keydown.space.prevent="inspect"
    ></button>

    <div class="card-heading">
      <div>
        <p class="scope">{{ item.scope }}</p>
        <p v-if="!isGlance" class="scope-label">{{ item.label }}</p>
      </div>
      <span v-if="item.ganZhi && (isGlance || visualLayout !== 'horizontal')" class="ganzhi">
        {{ isGlance ? compactGanZhi : item.ganZhi }}
      </span>
    </div>

    <p v-if="!isGlance" class="time-bounds">
      <span>Exact bounds</span>
      {{ item.timeBoundsLabel }}
    </p>

    <div class="temporal-visuals">
      <div v-if="item.ganZhiRaw" class="zodiac-wrap">
        <ZodiacIllustration :gan-zhi="item.ganZhiRaw" />
        <span v-if="item.ganZhi && visualLayout === 'horizontal' && !isGlance" class="ganzhi">
          {{ item.ganZhi }}
        </span>
      </div>

      <div class="glyph-wrap">
        <HexagramGlyph
          :lines="item.hexagram.linesBottomToTop"
          :size="glyphSize"
          :label="`${item.scope} hexagram, ${item.hexagram.nameEnglish}`"
        />
      </div>
    </div>

    <div class="hexagram-name">
      <span v-if="item.hexagram.number" class="number">{{ item.hexagram.number }}</span>
      <div>
        <h2 class="hexagram-title">{{ item.hexagram.nameEnglish }}</h2>
        <p class="hexagram-language">
          <span lang="zh-Hant">{{ item.hexagram.nameChinese }}</span>
          <span aria-hidden="true"> ~ </span>
          <span lang="zh-Latn-pinyin">{{ item.hexagram.namePinyin }}</span>
        </p>
      </div>
    </div>

    <ul
      class="gene-key-spectrum"
      :aria-label="`Gene Key ${item.hexagram.number} frequency spectrum`"
    >
      <li class="gene-key-spectrum__shadow">
        <GeneKeyFrequencyIcon band="shadow" />
        <span class="visually-hidden">Shadow:</span>
        <span>{{ item.hexagram.geneKey.shadow }}</span>
      </li>
      <li class="gene-key-spectrum__gift">
        <GeneKeyFrequencyIcon band="gift" />
        <span class="visually-hidden">Gift:</span>
        <span>{{ item.hexagram.geneKey.gift }}</span>
      </li>
      <li class="gene-key-spectrum__siddhi">
        <GeneKeyFrequencyIcon band="siddhi" />
        <span class="visually-hidden">Siddhi:</span>
        <span>{{ item.hexagram.geneKey.siddhi }}</span>
      </li>
    </ul>

    <div v-if="!isGlance" class="provenance">
      <span class="status-text">{{ item.status }}</span>
      <span>{{ item.sourceLabel }}</span>
    </div>
  </article>
</template>

<style scoped>
.hexagram-card {
  --zodiac-illustration-size: clamp(7rem, 18vw, 10rem);
  --zodiac-illustration-opacity: 0.74;

  position: relative;
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

.card-action {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  background: transparent;
}

.card-action:focus-visible {
  outline-offset: -4px;
}

.hexagram-card:hover {
  border-color: color-mix(in srgb, var(--jade) 55%, var(--line));
  transform: translateY(-2px);
}

.hexagram-card--glance:hover {
  transform: none;
}

.hexagram-card--glance-featured {
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

.temporal-visuals {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.zodiac-wrap {
  display: grid;
  flex: 0 0 auto;
  padding-block: 0.2rem 0.45rem;
  place-items: center;
}

.hexagram-card--glance-featured .glyph-wrap {
  min-height: 13rem;
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

.hexagram-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 500;
  overflow-wrap: break-word;
}

.hexagram-language {
  margin: 0.1rem 0 0;
  color: var(--ink-soft);
  font-size: 0.95rem;
}

.gene-key-spectrum {
  display: flex;
  flex-wrap: wrap-reverse;
  align-items: center;
  justify-content: center;
  gap: 0.22rem 0.7rem;
  margin: -0.55rem 0 1rem;
  padding: 0;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.2;
  list-style: none;
}

.gene-key-spectrum li {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  white-space: nowrap;
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

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
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

.hexagram-card--glance {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  min-height: 0;
  border-radius: var(--glance-card-radius, var(--radius-md));
  padding: var(--glance-card-padding, 0.65rem);
  box-shadow: 0 8px 24px rgb(0 8 24 / 18%);
  text-align: center;
}

.hexagram-card--glance .temporal-visuals {
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: clamp(0.12rem, 0.55vw, 0.32rem);
  padding-block: clamp(0.2rem, 0.8vw, 0.48rem);
}

.hexagram-card--glance-featured {
  --hexagram-glance-glyph-size: var(--glance-featured-glyph-size, 8rem);
  --zodiac-illustration-size: clamp(6.5rem, 18vw, 8rem);

  border-color: color-mix(in srgb, var(--jade) 64%, var(--line));
  background: color-mix(in srgb, var(--paper-raised) 87%, var(--jade-wash));
  box-shadow: 0 10px 30px rgb(0 8 24 / 28%);
}

.hexagram-card--glance .card-heading {
  align-items: center;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.08rem;
}

.hexagram-card--glance .scope {
  margin: 0;
  font-size: var(--glance-scope-size, 0.59rem);
  letter-spacing: 0.14em;
  line-height: 1.15;
}

.hexagram-card--glance .ganzhi {
  max-width: 100%;
  color: var(--ink-faint);
  font-size: var(--glance-meta-size, 0.59rem);
  line-height: 1.1;
  text-align: center;
}

.hexagram-card--glance .glyph-wrap {
  flex: 0 0 auto;
  min-height: 0;
  padding-block: 0.25rem;
  color: var(--ink);
}

.hexagram-card--glance-featured .glyph-wrap {
  min-height: 0;
}

.hexagram-card--glance-compact {
  --hexagram-glance-glyph-size: var(--glance-compact-glyph-size, 5rem);
  --zodiac-illustration-size: var(--glance-compact-zodiac-size, clamp(5rem, 13vw, 6.75rem));
}

.hexagram-card--glance .hexagram-glyph {
  max-width: var(--hexagram-glance-glyph-size);
}

.hexagram-card--glance-regular {
  --hexagram-glance-glyph-size: var(--glance-hour-glyph-size, 6.25rem);
  --zodiac-illustration-size: clamp(6rem, 15vw, 7.5rem);
}

.hexagram-card--glance .hexagram-name {
  align-items: center;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0;
}

.hexagram-card--glance .number {
  width: auto;
  height: auto;
  border: 0;
  border-radius: 0;
  color: var(--cinnabar);
  font-family: var(--font-sans);
  font-size: var(--glance-number-size, 0.64rem);
  font-weight: 800;
  line-height: 1;
}

.hexagram-card--glance .hexagram-title {
  margin: 0;
  font-size: var(--glance-title-size, 0.8rem);
  line-height: 1.08;
  hyphens: auto;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.hexagram-card--glance-compact .hexagram-title {
  font-size: var(--glance-compact-title-size, 0.7rem);
}

.hexagram-card--glance-featured .hexagram-title {
  font-size: var(--glance-featured-title-size, 1rem);
}

.hexagram-card--glance .hexagram-language {
  margin-top: 0.08rem;
  font-size: var(--glance-chinese-size, 0.66rem);
  line-height: 1.1;
}

.hexagram-card--glance .gene-key-spectrum {
  gap: 0.18rem 0.42rem;
  align-self: end;
  width: 100%;
  margin: 0.24rem 0 0;
  font-size: clamp(0.49rem, 1.15vw, 0.66rem);
  line-height: 1.1;
}

.hexagram-card--glance .zodiac-wrap {
  padding: 0;
}

.hexagram-card--glance.hexagram-card--visual-horizontal .card-heading {
  min-height: 1rem;
}

.hexagram-card--glance.hexagram-card--visual-horizontal {
  --zodiac-illustration-size: var(--glance-horizontal-zodiac-size, clamp(3.6rem, 6vw, 4.6rem));
}

.hexagram-card--glance.hexagram-card--visual-horizontal .temporal-visuals {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(0.4rem, 1.5vw, 1rem);
  padding-block: clamp(0.15rem, 0.45vw, 0.35rem);
}

.hexagram-card--glance.hexagram-card--visual-horizontal .zodiac-wrap {
  gap: 0.12rem;
}

.hexagram-card--glance.hexagram-card--visual-horizontal .zodiac-wrap .ganzhi {
  display: block;
  max-width: 100%;
  text-align: center;
}

.hexagram-card--glance.hexagram-card--visual-horizontal .hexagram-name {
  justify-content: center;
}

.hexagram-card--glance.hexagram-card--visual-horizontal .gene-key-spectrum {
  margin-top: 0.12rem;
}

@media (max-width: 720px) {
  .hexagram-card:not(.hexagram-card--glance) {
    min-height: 21rem;
  }
}

@media (min-width: 768px) and (max-height: 900px) {
  .hexagram-card--glance .gene-key-spectrum {
    gap: 0.1rem 0.32rem;
    font-size: 0.55rem;
  }
}
</style>
