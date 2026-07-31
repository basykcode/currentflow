<script setup lang="ts">
import { getHexagram } from '@/domain/astrology/hexagrams'
import type { TransformationChainStep } from '@/domain/yijing/transformations'

defineProps<{
  chain: readonly TransformationChainStep[]
}>()

const emit = defineEmits<{
  select: [hexagramNumber: number]
  reset: []
}>()
</script>

<template>
  <section v-if="chain.length > 0" class="chain" aria-label="Transformation chain">
    <div class="chain-scroll">
      <template v-for="(step, index) in chain" :key="`${index}-${step.definitionId}`">
        <span
          v-if="index > 0 && chain[index - 1]?.targetHexagramNumber !== step.sourceHexagramNumber"
          class="chain-operation"
        >
          ↩
        </span>
        <button
          v-if="index === 0 || chain[index - 1]?.targetHexagramNumber !== step.sourceHexagramNumber"
          type="button"
          @click="emit('select', step.sourceHexagramNumber)"
        >
          {{ step.sourceHexagramNumber }} {{ getHexagram(step.sourceHexagramNumber).nameEnglish }}
        </button>
        <span class="chain-operation">→ {{ step.label }}</span>
        <button type="button" @click="emit('select', step.targetHexagramNumber)">
          {{ step.targetHexagramNumber }} {{ getHexagram(step.targetHexagramNumber).nameEnglish }}
        </button>
      </template>
    </div>
    <button class="reset-chain" type="button" @click="emit('reset')">Reset chain</button>
  </section>
</template>

<style scoped>
.chain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
  padding: 0.55rem 0.65rem;
}

.chain-scroll {
  display: flex;
  overflow-x: auto;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  color: var(--ink-faint);
  white-space: nowrap;
}

button {
  border: 0;
  background: transparent;
  padding: 0.25rem;
  color: var(--jade);
  font-size: 0.61rem;
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 0.18rem;
}

.chain-operation {
  font-size: 0.56rem;
}

.reset-chain {
  flex: 0 0 auto;
  color: var(--ink-faint);
}
</style>
