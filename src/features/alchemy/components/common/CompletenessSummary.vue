<script setup lang="ts">
import type { KnowledgeCompleteness } from '../../domain/types'
import DataStatusBadge from './DataStatusBadge.vue'

defineProps<{
  completeness: KnowledgeCompleteness
}>()
</script>

<template>
  <section class="completeness-summary" aria-labelledby="completeness-heading">
    <div>
      <p class="mini-label">Record coverage</p>
      <h3 id="completeness-heading">
        {{ completeness.knownFieldCount }} of {{ completeness.totalFieldCount }} knowledge groups
      </h3>
    </div>
    <DataStatusBadge
      :status="
        completeness.knownFieldCount === completeness.totalFieldCount ? 'demo' : 'incomplete'
      "
    />
    <div
      class="coverage-track"
      role="meter"
      aria-label="Knowledge group coverage"
      :aria-valuenow="completeness.knownFieldCount"
      aria-valuemin="0"
      :aria-valuemax="completeness.totalFieldCount"
    >
      <span
        :style="{
          width: `${(completeness.knownFieldCount / completeness.totalFieldCount) * 100}%`,
        }"
      ></span>
    </div>
    <p>
      {{ completeness.unresolvedConflictCount }}
      {{
        completeness.unresolvedConflictCount === 1 ? 'unresolved conflict' : 'unresolved conflicts'
      }}.
    </p>
  </section>
</template>
