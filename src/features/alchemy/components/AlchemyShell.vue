<script setup lang="ts">
import { onMounted } from 'vue'

import { provideAlchemyEnvironment } from '../composables/alchemyEnvironment'
import { useAlchemyProvider } from '../providers'
import DataStatusBadge from './common/DataStatusBadge.vue'

import '../alchemy.css'

const provider = useAlchemyProvider()
const environment = provideAlchemyEnvironment(provider)

const navigation = [
  { label: 'Materia Medica', to: { name: 'alchemy-materia-medica' } },
  { label: 'Formula Library', to: { name: 'alchemy-formulas' } },
  { label: 'Formula Workbench', to: { name: 'alchemy-workbench' } },
  { label: 'Text Library', to: { name: 'alchemy-texts' } },
  { label: 'Guided Inquiry', to: { name: 'alchemy-inquiry' } },
] as const

onMounted(() => {
  void environment.refresh()
})
</script>

<template>
  <div class="alchemy-shell">
    <header class="alchemy-header">
      <div class="alchemy-title-block">
        <p class="eyebrow">Alchemy · Sourced research</p>
        <h1>Materia, formulas, and the evidence between them.</h1>
        <p>
          A source-aware research terminal and local formulation workbench. Claims remain attached
          to their provenance, conflicts stay visible, and missing knowledge is not filled in.
        </p>
      </div>
      <aside class="provider-card" aria-live="polite" aria-label="Alchemy data source">
        <span class="mini-label">Active data source</span>
        <div v-if="environment.status.value" class="provider-heading">
          <strong>{{ environment.status.value.label }}</strong>
          <DataStatusBadge :status="environment.status.value.dataStatus" />
        </div>
        <div v-else-if="environment.loading.value" class="provider-heading">
          <strong>Checking provider</strong>
          <DataStatusBadge status="unavailable" label="Checking" />
        </div>
        <div v-else class="provider-heading">
          <strong>Provider unavailable</strong>
          <DataStatusBadge status="unavailable" />
        </div>
        <p v-if="environment.status.value">{{ environment.status.value.detail }}</p>
        <p v-else-if="environment.error.value">{{ environment.error.value.detail }}</p>
        <button
          v-if="environment.error.value?.retryable"
          class="text-button"
          type="button"
          @click="environment.refresh"
        >
          Retry provider check
        </button>
      </aside>
    </header>

    <nav class="alchemy-nav" aria-label="Alchemy sections">
      <RouterLink v-for="item in navigation" :key="item.label" :to="item.to">
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="research-boundary" role="note">
      <span aria-hidden="true">Research boundary</span>
      <p>Research and educational information only. Not diagnosis or medical treatment.</p>
    </div>

    <RouterView />
  </div>
</template>
