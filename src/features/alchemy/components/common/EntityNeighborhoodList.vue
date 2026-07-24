<script setup lang="ts">
import type { EntityNeighborhood } from '../../domain/types'
import DataStatusBadge from './DataStatusBadge.vue'

defineProps<{
  neighborhood: EntityNeighborhood
}>()
</script>

<template>
  <section class="relationship-explorer" aria-labelledby="relationships-heading">
    <div class="section-heading">
      <h3 id="relationships-heading">Entity relationships</h3>
      <DataStatusBadge :status="neighborhood.status" />
    </div>
    <ul v-if="neighborhood.relationships.length" class="relationship-list">
      <li v-for="relationship in neighborhood.relationships" :key="relationship.id">
        <div>
          <span class="relationship-direction">{{ relationship.direction }}</span>
          <p>
            <strong>{{ relationship.sourceLabel }}</strong>
            <span>{{ relationship.relationshipType }}</span>
            <strong>{{ relationship.targetLabel }}</strong>
          </p>
        </div>
        <div class="relationship-meta">
          <DataStatusBadge :status="relationship.status" />
          <span>{{ relationship.citations.length }} cited source</span>
        </div>
      </li>
    </ul>
    <div v-else class="empty-knowledge">
      <p>No relationship records are available.</p>
    </div>
    <p v-if="neighborhood.missingRelationshipTypes.length" class="missing-note">
      Not represented:
      {{ neighborhood.missingRelationshipTypes.join(', ') }}.
    </p>
  </section>
</template>
