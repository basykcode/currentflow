<script setup lang="ts">
import type { ReviewStatus } from '../../domain/types'

defineProps<{
  status: ReviewStatus
}>()

const labels: Readonly<Record<ReviewStatus, string>> = {
  synthetic_fixture: 'Synthetic fixture',
  machine_imported: 'Machine imported',
  human_reviewed: 'Human reviewed',
  disputed: 'Disputed',
  superseded: 'Superseded',
  unavailable: 'Review unavailable',
}
</script>

<template>
  <span class="review-badge" :data-review-status="status">{{ labels[status] }}</span>
</template>
