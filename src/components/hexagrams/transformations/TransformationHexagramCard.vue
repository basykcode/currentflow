<script setup lang="ts">
import { computed, ref } from 'vue'

import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import { getHexagram } from '@/domain/astrology/hexagrams'
import type { TransformationResult } from '@/domain/yijing/transformations'

const props = withDefaults(
  defineProps<{
    result: TransformationResult
    compact?: boolean
    visited?: boolean
    showTransitionStatus?: boolean
    transitionTextAvailable?: boolean
  }>(),
  {
    compact: false,
    visited: false,
    showTransitionStatus: false,
    transitionTextAvailable: false,
  },
)

const emit = defineEmits<{
  select: [result: TransformationResult]
}>()

const selfDetailsExpanded = ref(false)
const target = computed(() =>
  props.result.targetHexagramNumber === undefined
    ? null
    : getHexagram(props.result.targetHexagramNumber),
)
const isDisabled = computed(
  () =>
    target.value === null ||
    props.result.status === 'source-needed' ||
    props.result.status === 'unavailable' ||
    props.result.status === 'not-applicable',
)
const canonicalityLabel = computed(() => props.result.provenance.canonicality.replace(/-/g, ' '))
const changedLineLabel = computed(() => {
  if (props.result.changedLines.length === 0) return 'No changed lines'
  return `Changed ${props.result.changedLines.length === 1 ? 'line' : 'lines'} ${props.result.changedLines.join(', ')}`
})
const handleSelect = () => {
  if (isDisabled.value) return
  if (props.result.status === 'self-mapping') {
    selfDetailsExpanded.value = !selfDetailsExpanded.value
    return
  }
  emit('select', props.result)
}
</script>

<template>
  <component
    :is="isDisabled ? 'div' : 'button'"
    class="transformation-card"
    :class="{
      'is-compact': compact,
      'is-disabled': isDisabled,
      'is-self': result.status === 'self-mapping',
    }"
    v-bind="
      isDisabled
        ? { role: 'status' }
        : {
            type: 'button',
            'aria-label': `Inspect ${result.title}: Hexagram ${target?.number}, ${target?.nameEnglish}`,
            ...(result.status === 'self-mapping' ? { 'aria-expanded': selfDetailsExpanded } : {}),
          }
    "
    @click="handleSelect"
  >
    <HexagramGlyph
      v-if="target"
      :lines="target.linesBottomToTop"
      size="compact"
      :label="target.nameEnglish"
    />
    <span v-else class="unavailable-mark" aria-hidden="true">—</span>

    <span class="card-copy">
      <span class="card-role">{{ result.title }}</span>
      <strong v-if="target">{{ target.number }} · {{ target.nameEnglish }}</strong>
      <strong v-else>Source table not yet connected</strong>
      <span v-if="target" class="target-secondary">
        <span lang="zh-Hant">{{ target.nameChinese }}</span>
        · {{ target.namePinyin }}
      </span>
      <span class="card-status">
        {{ result.dataStatus.replace(/-/g, ' ') }} ·
        {{ result.interpretation.status.replace(/-/g, ' ') }}
      </span>
      <small>{{ result.explanation }}</small>
      <span class="operation-labels">
        <span v-for="label in result.operationLabels" :key="label">{{ label }}</span>
      </span>
      <span class="card-badges">
        <span>{{ result.provenance.tradition }}</span>
        <span>{{ canonicalityLabel }}</span>
        <span v-if="result.changedLines.length > 0">{{ changedLineLabel }}</span>
        <span v-if="result.status === 'self-mapping'">Returns to itself</span>
        <span v-if="showTransitionStatus && transitionTextAvailable">
          Yilin transition available
        </span>
        <span v-else-if="showTransitionStatus && target">Yilin not connected</span>
        <span v-if="visited">Visited in this session</span>
      </span>
      <span v-if="selfDetailsExpanded" class="self-detail">
        This operation resolves to the source figure, so modal history is unchanged.
      </span>
    </span>

    <span
      v-if="!isDisabled && result.status !== 'self-mapping'"
      class="card-arrow"
      aria-hidden="true"
    >
      ↗
    </span>
  </component>
</template>

<style scoped>
.transformation-card {
  display: grid;
  max-width: 100%;
  min-width: 0;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 76%, transparent);
  padding: 0.85rem;
  color: var(--ink);
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
}

button.transformation-card:hover {
  border-color: color-mix(in srgb, var(--jade) 58%, var(--line));
  background: var(--jade-wash);
  transform: translateY(-1px);
}

button.transformation-card:focus-visible {
  outline: 2px solid var(--jade);
  outline-offset: 3px;
}

.transformation-card.is-compact {
  grid-template-columns: 3.1rem minmax(0, 1fr) auto;
  border-radius: var(--radius-sm);
  padding: 0.7rem;
}

.transformation-card.is-disabled {
  border-style: dashed;
  color: var(--ink-soft);
}

.transformation-card.is-self {
  border-color: color-mix(in srgb, var(--jade) 40%, var(--line));
}

.hexagram-glyph {
  width: 3.6rem;
  color: var(--jade-deep);
}

.is-compact .hexagram-glyph {
  width: 2.8rem;
}

.unavailable-mark {
  display: grid;
  width: 3.6rem;
  height: 3.6rem;
  border: 1px dashed var(--line);
  border-radius: 50%;
  color: var(--ink-faint);
  place-items: center;
}

.card-copy {
  display: grid;
  min-width: 0;
  gap: 0.12rem;
}

.card-role {
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

strong {
  overflow-wrap: anywhere;
  font-family: var(--font-serif);
  font-size: 0.95rem;
  font-weight: 500;
}

.target-secondary,
.card-status,
small {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.card-status {
  font-size: 0.54rem;
  text-transform: capitalize;
}

small {
  margin-top: 0.22rem;
  line-height: 1.45;
}

.is-compact small {
  display: none;
}

.operation-labels,
.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.operation-labels > span,
.card-badges > span {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.16rem 0.38rem;
  color: var(--ink-faint);
  font-size: 0.5rem;
  line-height: 1.2;
}

.operation-labels > span {
  border-color: color-mix(in srgb, var(--jade) 32%, var(--line));
  color: var(--jade);
}

.is-compact .operation-labels,
.is-compact .card-badges {
  display: none;
}

.card-arrow {
  color: var(--cinnabar);
}

.self-detail {
  margin-top: 0.35rem;
  color: var(--ink-faint);
  font-size: 0.58rem;
  line-height: 1.4;
}

@media (prefers-reduced-motion: reduce) {
  .transformation-card {
    transition: none;
  }
}
</style>
