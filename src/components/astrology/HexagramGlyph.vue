<script setup lang="ts">
import { computed } from 'vue'

import type { HexagramLines } from '@/domain/astrology/types'

const props = withDefaults(
  defineProps<{
    lines: HexagramLines
    size?: 'compact' | 'regular' | 'featured' | 'inspection'
    label?: string
    split?: boolean
  }>(),
  {
    size: 'regular',
    label: 'Hexagram',
    split: false,
  },
)

// Domain data follows traditional construction: bottom line first.
// Only this display projection reverses it so the upper line appears visually at the top.
const displayTrigrams = computed(() => [
  [
    { polarity: props.lines[5], domainIndex: 5 },
    { polarity: props.lines[4], domainIndex: 4 },
    { polarity: props.lines[3], domainIndex: 3 },
  ],
  [
    { polarity: props.lines[2], domainIndex: 2 },
    { polarity: props.lines[1], domainIndex: 1 },
    { polarity: props.lines[0], domainIndex: 0 },
  ],
])
const description = computed(() => `${props.label}: ${props.lines.join(', ')} from bottom to top`)
</script>

<template>
  <div
    class="hexagram-glyph"
    :class="[`hexagram-glyph--${size}`, { 'hexagram-glyph--split': split }]"
    role="img"
    :aria-label="description"
  >
    <div
      v-for="(trigram, trigramIndex) in displayTrigrams"
      :key="trigramIndex"
      class="trigram-lines"
      :data-trigram="trigramIndex === 0 ? 'upper' : 'lower'"
    >
      <div
        v-for="line in trigram"
        :key="line.domainIndex"
        class="hexagram-line"
        :class="`hexagram-line--${line.polarity}`"
        :data-domain-index="line.domainIndex"
        :data-polarity="line.polarity"
      >
        <span class="segment segment-first"></span>
        <span v-if="line.polarity === 'yin'" class="segment segment-second"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hexagram-glyph {
  display: grid;
  width: 100%;
  max-width: var(--glyph-size);
  aspect-ratio: 1 / 0.92;
  grid-template-rows: 1fr 1fr;
  gap: 8%;
  align-content: center;
  color: currentColor;
}

.trigram-lines {
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: 14%;
  transition: transform 220ms ease;
}

.hexagram-glyph--split .trigram-lines:first-child {
  transform: translateY(-12%);
}

.hexagram-glyph--split .trigram-lines:last-child {
  transform: translateY(12%);
}

.hexagram-glyph--compact {
  --glyph-size: 4.25rem;
}

.hexagram-glyph--regular {
  --glyph-size: 7.25rem;
}

.hexagram-glyph--featured {
  --glyph-size: 10rem;
}

.hexagram-glyph--inspection {
  --glyph-size: 12.5rem;
}

.hexagram-line {
  display: flex;
  width: 100%;
  height: clamp(4px, 30%, 10px);
  gap: 18%;
}

.segment {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: currentColor;
}

.hexagram-line--yang .segment {
  width: 100%;
}

.hexagram-line--yin .segment {
  width: 41%;
}
</style>
