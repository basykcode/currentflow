<script setup lang="ts">
import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import type { HexagramTransformation } from '@/domain/astrology/transformations'

defineProps<{
  transformation: HexagramTransformation
}>()

const emit = defineEmits<{
  select: [number: number]
}>()
</script>

<template>
  <button
    class="transformation-button"
    type="button"
    :aria-label="`Inspect ${transformation.label}: Hexagram ${transformation.hexagram.number}, ${transformation.hexagram.nameEnglish}`"
    @click="emit('select', transformation.hexagram.number)"
  >
    <HexagramGlyph
      :lines="transformation.hexagram.linesBottomToTop"
      size="compact"
      :label="transformation.hexagram.nameEnglish"
    />
    <span class="transformation-copy">
      <span class="transformation-kind">{{ transformation.label }}</span>
      <strong>
        {{ transformation.hexagram.number }} · {{ transformation.hexagram.nameEnglish }}
      </strong>
      <span lang="zh">{{ transformation.hexagram.nameChinese }}</span>
      <small>{{ transformation.traditionalLabel }}</small>
    </span>
    <span class="transformation-arrow" aria-hidden="true">↗</span>
  </button>
</template>

<style scoped>
.transformation-button {
  display: grid;
  grid-template-columns: 3.1rem minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--paper-raised) 78%, transparent);
  padding: 0.7rem;
  color: var(--ink);
  text-align: left;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.transformation-button:hover {
  border-color: color-mix(in srgb, var(--jade) 58%, var(--line));
  background: var(--jade-wash);
  transform: translateY(-1px);
}

.hexagram-glyph {
  width: 2.8rem;
  color: var(--jade-deep);
}

.transformation-copy {
  display: grid;
  min-width: 0;
}

.transformation-kind {
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

strong {
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 0.84rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transformation-copy > span[lang='zh'],
small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.transformation-arrow {
  color: var(--cinnabar);
  font-size: 0.72rem;
}
</style>
