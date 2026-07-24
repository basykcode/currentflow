<script setup lang="ts">
import { computed } from 'vue'

import type { AlchemyDataStatus } from '../../domain/types'

const props = defineProps<{
  status: AlchemyDataStatus
  label?: string
}>()

const labels: Readonly<Record<AlchemyDataStatus, string>> = {
  demo: 'Synthetic demo',
  verified: 'Verified',
  source_reported: 'Source-reported',
  conflicted: 'Conflicting sources',
  incomplete: 'Data incomplete',
  unavailable: 'Unavailable',
}

const displayLabel = computed(() => props.label ?? labels[props.status])
</script>

<template>
  <span class="alchemy-badge" :data-status="status">{{ displayLabel }}</span>
</template>
