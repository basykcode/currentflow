<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AnalysisResultPanel from '../components/workbench/AnalysisResultPanel.vue'
import ComparisonResultPanel from '../components/workbench/ComparisonResultPanel.vue'
import IngredientEditor from '../components/workbench/IngredientEditor.vue'
import DataStatusBadge from '../components/common/DataStatusBadge.vue'
import ResourceError from '../components/common/ResourceError.vue'
import { useAlchemyEnvironment } from '../composables/alchemyEnvironment'
import { useAsyncResource } from '../composables/useAsyncResource'
import { inspectDraftDuplicates, validateFormulaDraft } from '../domain/workbenchValidation'
import type {
  FormulaAnalysisResult,
  FormulaComparisonResult,
  FormulaIngredientLine,
  HerbSummary,
  PaginatedResult,
} from '../domain/types'
import { useAlchemyProvider } from '../providers'
import { MAX_FORMULA_DRAFTS, useAlchemyWorkbenchStore } from '../stores/workbench'

const provider = useAlchemyProvider()
const environment = useAlchemyEnvironment()
const workbench = useAlchemyWorkbenchStore()
const herbOptionsResource = useAsyncResource<PaginatedResult<HerbSummary>>()
const analysisRequest = useAsyncResource<FormulaAnalysisResult>()
const comparisonRequest = useAsyncResource<FormulaComparisonResult>()
const actionMessage = ref('')
const slotIndexes = [0, 1, 2, 3] as const

const supportedUnits = computed(
  () => environment.capabilities.value?.supportedUnits ?? ['g', 'mg', 'kg', 'part', 'unspecified'],
)

const activeValidation = computed(() =>
  workbench.activeDraft
    ? validateFormulaDraft(workbench.activeDraft, supportedUnits.value)
    : { valid: false, summaryErrors: ['Create or load a formula first.'], lines: [] },
)

const duplicateState = computed(() =>
  workbench.activeDraft
    ? inspectDraftDuplicates(workbench.activeDraft)
    : { exactDuplicateLineIds: new Set<string>(), preparationVariantLineIds: new Set<string>() },
)

const openDraftsValid = computed(
  () =>
    workbench.drafts.length >= 2 &&
    workbench.drafts.every((draft) => validateFormulaDraft(draft, supportedUnits.value).valid),
)

const activeAnalysis = computed(() =>
  workbench.activeDraftId ? workbench.analysesByDraft[workbench.activeDraftId] : undefined,
)

const createBlank = () => {
  const draft = workbench.createBlank()
  actionMessage.value = draft
    ? `${draft.name} created on this device.`
    : 'The workbench already contains four formulas.'
}

const updateIngredient = (lineId: string, patch: Partial<FormulaIngredientLine>) => {
  if (workbench.activeDraftId) workbench.updateIngredient(workbench.activeDraftId, lineId, patch)
}

const updateDraftName = (event: Event) => {
  const draftId = workbench.activeDraftId
  if (draftId && event.target instanceof HTMLInputElement) {
    workbench.renameDraft(draftId, event.target.value)
  }
}

const updateDraftNotes = (event: Event) => {
  const draftId = workbench.activeDraftId
  if (draftId && event.target instanceof HTMLTextAreaElement) {
    workbench.updateNotes(draftId, event.target.value)
  }
}

const addActiveIngredient = () => {
  if (workbench.activeDraftId) workbench.addIngredient(workbench.activeDraftId)
}

const moveActiveIngredient = (lineId: string, direction: -1 | 1) => {
  if (workbench.activeDraftId) {
    workbench.moveIngredient(workbench.activeDraftId, lineId, direction)
  }
}

const removeActiveIngredient = (lineId: string) => {
  if (workbench.activeDraftId) workbench.removeIngredient(workbench.activeDraftId, lineId)
}

const analyze = async () => {
  const draft = workbench.activeDraft
  if (!draft || !activeValidation.value.valid) return
  const result = await analysisRequest.run((signal) => provider.analyzeFormula(draft, signal))
  if (result) {
    workbench.setAnalysis(draft.id, result)
    actionMessage.value = `Analysis completed for ${draft.name}.`
  }
}

const compare = async () => {
  if (!openDraftsValid.value) return
  const result = await comparisonRequest.run((signal) =>
    provider.compareFormulas(workbench.drafts, signal),
  )
  if (result) {
    workbench.setComparison(result)
    actionMessage.value = `Comparison completed for ${workbench.drafts.length} open formulas.`
  }
}

const clearResults = () => {
  if (workbench.activeDraftId) workbench.clearAnalysis(workbench.activeDraftId)
  workbench.clearComparison()
  analysisRequest.clear()
  comparisonRequest.clear()
  actionMessage.value = 'Current analysis and comparison results cleared.'
}

const copyText = async (value: string, label: string) => {
  try {
    await window.navigator.clipboard.writeText(value)
    actionMessage.value = `${label} copied to the clipboard.`
  } catch {
    actionMessage.value = `Could not copy ${label.toLocaleLowerCase()}. Clipboard permission was not granted.`
  }
}

const copyJson = () => {
  if (!workbench.activeDraft) return
  void copyText(JSON.stringify(workbench.activeDraft, null, 2), 'Composition JSON')
}

const copyReadable = () => {
  const draft = workbench.activeDraft
  if (!draft) return
  const lines = draft.ingredients.map((ingredient, index) => {
    const amount = ingredient.amountText
      ? `${ingredient.amountText} ${ingredient.unit}`
      : 'amount unspecified'
    const preparation = ingredient.preparationLabel
      ? `; preparation: ${ingredient.preparationLabel}`
      : ''
    const role = ingredient.role ? `; source role: ${ingredient.role}` : ''
    return `${index + 1}. ${ingredient.herbDisplayName || 'Unresolved material'} — ${amount}${preparation}${role}`
  })
  void copyText(
    [draft.name, ...lines, draft.notes ? `Notes: ${draft.notes}` : ''].join('\n'),
    'Readable composition',
  )
}

const confirmClearWorkspace = () => {
  if (!window.confirm('Clear all local Alchemy drafts and results from this device?')) return
  workbench.reset()
  analysisRequest.clear()
  comparisonRequest.clear()
  actionMessage.value = 'The local formula workspace was cleared.'
}

onMounted(() => {
  void herbOptionsResource.run((signal) =>
    provider.searchHerbs({ query: '', pageSize: 100 }, signal),
  )
})
</script>

<template>
  <section class="alchemy-route" aria-labelledby="workbench-heading">
    <header class="route-heading">
      <div>
        <p class="mini-label">03 · Device-local composition</p>
        <h2 id="workbench-heading">Formula Workbench</h2>
        <p>
          Compose up to four local drafts, preserve unresolved inputs, and request deterministic
          analysis from the active provider.
        </p>
      </div>
      <div class="route-status-stack">
        <DataStatusBadge
          :status="environment.status.value?.dataStatus ?? 'unavailable'"
          :label="environment.status.value?.label ?? 'Provider pending'"
        />
        <span class="local-only-badge">Local only · v{{ workbench.storageVersion }}</span>
      </div>
    </header>

    <p class="action-message" aria-live="polite">{{ actionMessage }}</p>

    <section class="workbench-slots" aria-label="Open formula slots">
      <article
        v-for="slotIndex in slotIndexes"
        :key="slotIndex"
        class="workbench-slot"
        :class="{ active: workbench.drafts[slotIndex]?.id === workbench.activeDraftId }"
      >
        <template v-if="workbench.drafts[slotIndex]">
          <button
            class="slot-selector"
            type="button"
            :aria-pressed="workbench.drafts[slotIndex]?.id === workbench.activeDraftId"
            @click="workbench.selectDraft(workbench.drafts[slotIndex]?.id ?? '')"
          >
            <span>0{{ slotIndex + 1 }}</span>
            <strong>{{ workbench.drafts[slotIndex]?.name }}</strong>
            <small>
              {{ workbench.drafts[slotIndex]?.ingredients.length }} ingredients ·
              {{
                workbench.analysesByDraft[workbench.drafts[slotIndex]?.id ?? '']
                  ? 'analyzed'
                  : 'not analyzed'
              }}
            </small>
          </button>
          <button
            class="slot-remove"
            type="button"
            :aria-label="`Remove ${workbench.drafts[slotIndex]?.name}`"
            @click="workbench.removeDraft(workbench.drafts[slotIndex]?.id ?? '')"
          >
            ×
          </button>
        </template>
        <button v-else class="empty-slot" type="button" @click="createBlank">
          <span>0{{ slotIndex + 1 }}</span>
          <strong>Open a formula</strong>
          <small>Blank local draft</small>
        </button>
      </article>
    </section>

    <div class="workbench-toolbar">
      <button
        class="quiet-button"
        type="button"
        :disabled="!workbench.hasRoom"
        @click="createBlank"
      >
        New blank formula
      </button>
      <button
        class="quiet-button"
        type="button"
        :disabled="!workbench.activeDraft || !workbench.hasRoom"
        @click="workbench.activeDraft && workbench.duplicateDraft(workbench.activeDraft.id)"
      >
        Duplicate active
      </button>
      <RouterLink class="quiet-button" :to="{ name: 'alchemy-formulas' }">
        Load from library
      </RouterLink>
      <button
        class="quiet-button danger-outline"
        type="button"
        :disabled="workbench.drafts.length === 0"
        @click="confirmClearWorkspace"
      >
        Clear workspace
      </button>
    </div>

    <div v-if="workbench.activeDraft" class="workbench-composer panel">
      <section class="draft-header" aria-labelledby="active-draft-heading">
        <div>
          <p class="mini-label">Active formula · {{ workbench.activeDraft.id }}</p>
          <h3 id="active-draft-heading">Composition details</h3>
        </div>
        <div class="draft-name-field">
          <label for="draft-name">Formula name</label>
          <input
            id="draft-name"
            class="control"
            type="text"
            :value="workbench.activeDraft.name"
            @input="updateDraftName"
          />
        </div>
      </section>

      <IngredientEditor
        :draft="workbench.activeDraft"
        :herb-options="herbOptionsResource.data.value?.items ?? []"
        :supported-units="supportedUnits"
        :line-validation="activeValidation.lines"
        :duplicate-state="duplicateState"
        @add="addActiveIngredient"
        @update="updateIngredient"
        @move="moveActiveIngredient"
        @remove="removeActiveIngredient"
      />

      <label class="notes-field" for="draft-notes">
        Local formula notes
        <textarea
          id="draft-notes"
          class="control"
          rows="3"
          :value="workbench.activeDraft.notes"
          placeholder="Research notes stored only on this device"
          @input="updateDraftNotes"
        ></textarea>
      </label>

      <div v-if="activeValidation.summaryErrors.length" class="validation-summary" role="alert">
        <strong>Resolve before analysis</strong>
        <ul>
          <li v-for="error in activeValidation.summaryErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <div class="workbench-actions">
        <button
          class="primary-button"
          type="button"
          :disabled="
            !activeValidation.valid ||
            analysisRequest.loading.value ||
            !environment.capabilities.value?.canAnalyzeFormulas
          "
          @click="analyze"
        >
          {{ analysisRequest.loading.value ? 'Analyzing…' : 'Analyze current formula' }}
        </button>
        <button
          class="primary-button secondary-action"
          type="button"
          :disabled="
            !openDraftsValid ||
            comparisonRequest.loading.value ||
            !environment.capabilities.value?.canCompareFormulas
          "
          @click="compare"
        >
          {{ comparisonRequest.loading.value ? 'Comparing…' : 'Compare open formulas' }}
        </button>
        <button class="quiet-button" type="button" @click="clearResults">Clear result</button>
        <button class="quiet-button" type="button" @click="copyJson">
          Copy composition as JSON
        </button>
        <button class="quiet-button" type="button" @click="copyReadable">
          Copy composition as text
        </button>
      </div>
      <p v-if="workbench.drafts.length < 2" class="missing-note">
        Open at least two valid formulas to compare. Comparison supports up to
        {{ MAX_FORMULA_DRAFTS }}.
      </p>

      <ResourceError
        v-if="analysisRequest.error.value"
        :error="analysisRequest.error.value"
        @retry="analyze"
      />
      <ResourceError
        v-if="comparisonRequest.error.value"
        :error="comparisonRequest.error.value"
        @retry="compare"
      />
    </div>
    <div v-else class="empty-state workbench-empty panel">
      <span aria-hidden="true">方</span>
      <h3>Create or load a formula</h3>
      <p>
        Draft contents stay in versioned browser storage. Nothing is saved to a server in this
        alpha.
      </p>
      <div class="empty-actions">
        <button class="primary-button" type="button" @click="createBlank">
          Create blank formula
        </button>
        <RouterLink class="quiet-button" :to="{ name: 'alchemy-formulas' }">
          Browse source formulas
        </RouterLink>
      </div>
    </div>

    <AnalysisResultPanel v-if="activeAnalysis" :result="activeAnalysis" />
    <ComparisonResultPanel
      v-if="workbench.comparison"
      :result="workbench.comparison"
      :formulas="workbench.drafts"
    />
  </section>
</template>
