<script setup lang="ts">
import type { RelatedHexagram } from '@/domain/astrology/types'
import StatusBadge from '@/components/common/StatusBadge.vue'

import HexagramGlyph from './HexagramGlyph.vue'

defineProps<{
  item: RelatedHexagram
}>()
</script>

<template>
  <article class="related-card">
    <HexagramGlyph
      :lines="item.hexagram.linesBottomToTop"
      size="compact"
      :label="`Related hexagram, ${item.hexagram.nameEnglish}`"
    />
    <div class="related-copy">
      <p class="relationship">{{ item.relationshipLabel }}</p>
      <h3>
        <span v-if="item.hexagram.number">{{ item.hexagram.number }} · </span
        >{{ item.hexagram.nameEnglish }}
      </h3>
      <p v-if="item.hexagram.nameChinese" lang="zh">{{ item.hexagram.nameChinese }}</p>
      <div class="relationship-source">
        <StatusBadge :status="item.status" :label="item.status" />
        <span>{{ item.sourceLabel }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.related-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--paper-raised);
  padding: 1rem;
}

.hexagram-glyph {
  flex: 0 0 3.6rem;
  color: var(--jade-deep);
}

.related-copy {
  min-width: 0;
}

.relationship {
  overflow: hidden;
  margin-bottom: 0.25rem;
  color: var(--jade);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
}

.related-copy > p:not(.relationship) {
  margin: 0.12rem 0 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.relationship-source {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.4rem;
  color: var(--ink-faint);
  font-size: 0.58rem;
  line-height: 1.25;
}

.relationship-source :deep(.status-label) {
  flex: 0 0 auto;
  padding: 0.15rem 0.35rem;
  font-size: 0.52rem;
}
</style>
