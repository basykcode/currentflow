<script setup lang="ts">
import { computed } from 'vue'

import type { DataStatus } from '@/domain/astrology/types'

const props = defineProps<{
  status: DataStatus
  label?: string
}>()

const displayLabel = computed(() => props.label ?? `${props.status} data`)
</script>

<template>
  <span class="status-label" :data-status="status">{{ displayLabel }}</span>
</template>

<style scoped>
[data-status='computed'] {
  border-color: color-mix(in srgb, var(--jade) 40%, var(--line));
  background: var(--jade-wash);
  color: var(--jade);
}

[data-status='unavailable'] {
  border-color: var(--line);
  background: var(--paper-soft);
  color: var(--ink-faint);
}
</style>
