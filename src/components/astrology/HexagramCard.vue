<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { TemporalHexagram } from '@/domain/astrology/types'

import HexagramGlyph from './HexagramGlyph.vue'

defineProps<{
  item: TemporalHexagram
  featured?: boolean
}>()
</script>

<template>
  <article class="hexagram-card" :class="{ 'hexagram-card--featured': featured }">
    <div class="card-heading">
      <div>
        <p class="scope">{{ item.scope }}</p>
        <p class="scope-label">{{ item.label }}</p>
      </div>
      <span v-if="item.ganZhi" class="ganzhi">{{ item.ganZhi }}</span>
    </div>

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
      <StatusBadge :status="item.status" :label="item.status" />
      <span>{{ item.sourceLabel }}</span>
    </div>
  </article>
</template>

<style scoped>
.hexagram-card {
  display: flex;
  flex-direction: column;
  min-height: 23rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: clamp(1.1rem, 2vw, 1.6rem);
  box-shadow: 0 12px 36px rgb(34 49 43 / 5%);
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
  text-align: right;
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

.provenance :deep(.status-label) {
  flex: 0 0 auto;
  padding: 0.22rem 0.45rem;
  font-size: 0.6rem;
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
