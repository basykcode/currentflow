<script setup lang="ts">
import type { HexagramReference } from '@/domain/astrology/types'
import type {
  LineNumber,
  TransformationChainStep,
  TransformationLabFilters,
  TransformationLabSectionId,
  TransformationEngine,
  TransformationResult,
} from '@/domain/yijing/transformations'

import TransformationChain from './TransformationChain.vue'
import TransformationLabNavigation from './TransformationLabNavigation.vue'
import TransformationSourcePanel from './TransformationSourcePanel.vue'
import ChangeLabSection from './sections/ChangeLabSection.vue'
import HexagramStructureSection from './sections/HexagramStructureSection.vue'
import InteriorStructuresSection from './sections/InteriorStructuresSection.vue'
import SourceGatedModulesSection from './sections/SourceGatedModulesSection.vue'
import TransformationExploreSection from './sections/TransformationExploreSection.vue'

defineProps<{
  source: HexagramReference
  activeSection: TransformationLabSectionId
  selectedMovingLines: readonly LineNumber[]
  filters: TransformationLabFilters
  chain: readonly TransformationChainStep[]
  visited: ReadonlySet<number>
  engine: TransformationEngine
}>()

const emit = defineEmits<{
  back: []
  select: [result: TransformationResult]
  selectSection: [section: TransformationLabSectionId]
  updateMovingLines: [lines: readonly LineNumber[]]
  updateFilters: [filters: TransformationLabFilters]
  resetChain: []
  selectChainHexagram: [hexagramNumber: number]
}>()
</script>

<template>
  <div class="transformation-lab">
    <header class="lab-header">
      <button class="lab-back" type="button" @click="emit('back')">
        <span aria-hidden="true">←</span>
        Back to Hexagram
      </button>
      <div>
        <p>Advanced study instrument</p>
        <h1 id="transformation-lab-title" tabindex="-1">Transformation Lab</h1>
        <span>
          Deterministic calculations and source-gated interpretations remain explicitly separate.
        </span>
      </div>
    </header>

    <TransformationChain
      :chain="chain"
      @select="emit('selectChainHexagram', $event)"
      @reset="emit('resetChain')"
    />

    <TransformationLabNavigation
      :active-section="activeSection"
      @select="emit('selectSection', $event)"
    />

    <div class="lab-layout">
      <TransformationSourcePanel
        :source="source"
        :selected-moving-lines="selectedMovingLines"
        :chain-length="chain.length"
        @reset="emit('resetChain')"
      />

      <main
        :id="`transformation-lab-panel-${activeSection}`"
        class="lab-content"
        role="tabpanel"
        :aria-labelledby="`transformation-lab-tab-${activeSection}`"
      >
        <TransformationExploreSection
          v-if="activeSection === 'explore'"
          :source="source"
          :selected-moving-lines="selectedMovingLines"
          :visited="visited"
          :engine="engine"
          @select="emit('select', $event)"
        />
        <ChangeLabSection
          v-else-if="activeSection === 'change-lab'"
          :source="source"
          :selected-moving-lines="selectedMovingLines"
          :filters="filters"
          :visited="visited"
          :engine="engine"
          @select="emit('select', $event)"
          @update-moving-lines="emit('updateMovingLines', $event)"
          @update-filters="emit('updateFilters', $event)"
        />
        <InteriorStructuresSection
          v-else-if="activeSection === 'interior'"
          :source="source"
          :selected-moving-lines="selectedMovingLines"
          :visited="visited"
          :engine="engine"
          @select="emit('select', $event)"
        />
        <SourceGatedModulesSection
          v-else-if="activeSection === 'classical-systems'"
          section="classical-systems"
        />
        <SourceGatedModulesSection v-else-if="activeSection === 'time-maps'" section="time-maps" />
        <HexagramStructureSection v-else :source="source" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.transformation-lab {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 0.8rem;
  padding: clamp(0.8rem, 2vw, 1.3rem);
}

.transformation-lab > *,
.lab-layout > * {
  min-width: 0;
}

.lab-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.lab-back {
  min-height: 2.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.55rem 0.7rem;
  color: var(--jade);
  font-size: 0.67rem;
}

.lab-back:hover {
  border-color: var(--jade);
  background: var(--jade-wash);
}

.lab-back:focus-visible {
  outline: 2px solid var(--jade);
  outline-offset: 3px;
}

.lab-header p {
  margin: 0;
  color: var(--jade);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lab-header h1 {
  margin: 0.1rem 0;
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 3vw, 2.45rem);
  font-weight: 500;
}

.lab-header div > span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.lab-layout {
  display: grid;
  max-width: 100%;
  min-width: 0;
  grid-template-columns: minmax(12rem, 0.52fr) minmax(0, 2.2fr);
  gap: 1rem;
  align-items: start;
}

.lab-content {
  max-width: 100%;
  min-width: 0;
  border-left: 1px solid var(--line);
  padding: 0.6rem 0.2rem 2rem 1rem;
}

@media (max-width: 900px) {
  .lab-layout {
    grid-template-columns: 1fr;
  }

  .lab-content {
    border-top: 1px solid var(--line);
    border-left: 0;
    padding: 1rem 0 2rem;
  }
}

@media (max-width: 520px) {
  .lab-header {
    grid-template-columns: 1fr;
  }

  .lab-back {
    justify-self: start;
  }
}
</style>
