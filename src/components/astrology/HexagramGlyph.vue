<script setup lang="ts">
import { computed } from 'vue'

import type { HexagramLines } from '@/domain/astrology/types'

const props = withDefaults(
  defineProps<{
    lines: HexagramLines
    size?: 'compact' | 'regular' | 'featured'
    label?: string
  }>(),
  {
    size: 'regular',
    label: 'Hexagram',
  },
)

// Domain data follows traditional construction: bottom line first.
// Only this display projection reverses it so the upper line appears visually at the top.
const displayLines = computed(() => [...props.lines].reverse())
const description = computed(() => `${props.label}: ${props.lines.join(', ')} from bottom to top`)
</script>

<template>
  <div
    class="hexagram-glyph"
    :class="`hexagram-glyph--${size}`"
    role="img"
    :aria-label="description"
  >
    <div
      v-for="(line, index) in displayLines"
      :key="index"
      class="hexagram-line"
      :class="`hexagram-line--${line}`"
      :data-domain-index="5 - index"
      :data-polarity="line"
    >
      <span class="segment segment-first"></span>
      <span v-if="line === 'yin'" class="segment segment-second"></span>
    </div>
  </div>
</template>

<style scoped>
.hexagram-glyph {
  display: grid;
  width: 100%;
  max-width: var(--glyph-size);
  aspect-ratio: 1 / 0.92;
  gap: 8%;
  align-content: center;
  color: currentColor;
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

.hexagram-line {
  display: flex;
  width: 100%;
  height: clamp(4px, 8%, 9px);
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
