<script setup lang="ts">
import type { SourceClaim } from '../../domain/types'
import CitationList from './CitationList.vue'
import DataStatusBadge from './DataStatusBadge.vue'
import ReviewStatusBadge from './ReviewStatusBadge.vue'

defineProps<{
  title: string
  claims: readonly SourceClaim[]
}>()
</script>

<template>
  <section class="claim-group">
    <div class="section-heading">
      <h3>{{ title }}</h3>
      <span>{{ claims.length }} {{ claims.length === 1 ? 'claim' : 'claims' }}</span>
    </div>
    <div v-if="claims.length" class="claim-stack">
      <article
        v-for="claim in claims"
        :key="claim.id"
        class="claim-card"
        :class="{ 'claim-card-conflicted': claim.status === 'conflicted' }"
      >
        <div class="claim-card-heading">
          <p>{{ claim.value }}</p>
          <DataStatusBadge :status="claim.status" />
        </div>
        <div class="claim-annotation">
          <span
            >{{ claim.citations.length }}
            {{ claim.citations.length === 1 ? 'citation' : 'citations' }}</span
          >
          <ReviewStatusBadge v-if="claim.citations[0]" :status="claim.citations[0].reviewStatus" />
          <span v-if="claim.conflictGroupId">Unresolved alternative</span>
        </div>
        <details>
          <summary>Source details</summary>
          <CitationList :citations="claim.citations" />
        </details>
      </article>
    </div>
    <div v-else class="empty-knowledge" role="status">
      <DataStatusBadge status="unavailable" />
      <p>This field is not available in the active data source.</p>
    </div>
  </section>
</template>
