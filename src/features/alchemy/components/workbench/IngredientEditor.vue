<script setup lang="ts">
import type {
  DraftDuplicateState,
  IngredientLineValidation,
} from '../../domain/workbenchValidation'
import type { FormulaDraft, FormulaIngredientLine, HerbSummary } from '../../domain/types'

const props = defineProps<{
  draft: FormulaDraft
  herbOptions: readonly HerbSummary[]
  supportedUnits: readonly string[]
  lineValidation: readonly IngredientLineValidation[]
  duplicateState: DraftDuplicateState
}>()

const emit = defineEmits<{
  add: []
  update: [lineId: string, patch: Partial<FormulaIngredientLine>]
  move: [lineId: string, direction: -1 | 1]
  remove: [lineId: string]
}>()

const inputValue = (event: Event): string =>
  event.target instanceof HTMLInputElement ? event.target.value : ''

const selectValue = (event: Event): string =>
  event.target instanceof HTMLSelectElement ? event.target.value : ''

const resolveMaterial = (lineId: string, value: string) => {
  const lookup = value.trim().toLocaleLowerCase()
  const herb = props.herbOptions.find((item) =>
    [
      item.displayName,
      item.nameChineseSimplified,
      item.nameChineseTraditional,
      item.pinyin,
      ...item.aliases,
    ]
      .filter(Boolean)
      .some((candidate) => candidate?.toLocaleLowerCase() === lookup),
  )
  emit('update', lineId, {
    herbMaterialId: herb?.id ?? '',
    herbDisplayName: herb?.displayName ?? value,
    nameChineseSimplified: herb?.nameChineseSimplified ?? '',
    nameChineseTraditional: herb?.nameChineseTraditional ?? '',
    pinyin: herb?.pinyin ?? '',
  })
}

const validationFor = (lineId: string): IngredientLineValidation | undefined =>
  props.lineValidation.find((item) => item.lineId === lineId)
</script>

<template>
  <section class="ingredient-editor" aria-labelledby="ingredient-editor-heading">
    <div class="section-heading">
      <div>
        <p class="mini-label">Composition editor</p>
        <h3 id="ingredient-editor-heading">Ingredient lines</h3>
      </div>
      <button class="quiet-button" type="button" @click="$emit('add')">Add material</button>
    </div>

    <datalist id="alchemy-material-options">
      <option v-for="herb in herbOptions" :key="herb.id" :value="herb.displayName">
        {{ herb.nameChineseTraditional || herb.nameChineseSimplified }} · {{ herb.pinyin }}
      </option>
    </datalist>

    <div v-if="draft.ingredients.length" class="ingredient-list">
      <article
        v-for="(line, index) in draft.ingredients"
        :key="line.id"
        class="ingredient-row"
        :class="{
          'has-error': validationFor(line.id)?.errors.length,
          'has-duplicate': duplicateState.exactDuplicateLineIds.has(line.id),
          'has-variant': duplicateState.preparationVariantLineIds.has(line.id),
        }"
      >
        <div class="ingredient-sequence" aria-hidden="true">
          {{ String(index + 1).padStart(2, '0') }}
        </div>
        <div class="ingredient-fields">
          <label class="material-field">
            Material search
            <input
              class="control"
              type="text"
              list="alchemy-material-options"
              :value="line.herbDisplayName"
              placeholder="Search English, Pinyin, or Chinese"
              autocomplete="off"
              @change="resolveMaterial(line.id, inputValue($event))"
            />
            <small v-if="line.herbMaterialId">Resolved · {{ line.herbMaterialId }}</small>
            <small v-else class="field-error">Unresolved identity</small>
            <small v-if="line.pinyin || line.nameChineseTraditional || line.nameChineseSimplified">
              {{ line.pinyin }}
              <span lang="zh-Hant">
                · {{ line.nameChineseTraditional || line.nameChineseSimplified }}
              </span>
            </small>
          </label>
          <label>
            Amount
            <input
              class="control"
              type="text"
              inputmode="decimal"
              :value="line.amountText"
              placeholder="Unspecified"
              @input="$emit('update', line.id, { amountText: inputValue($event) })"
            />
          </label>
          <label>
            Unit
            <select
              class="control"
              :value="line.unit"
              @change="$emit('update', line.id, { unit: selectValue($event) })"
            >
              <option v-for="unit in supportedUnits" :key="unit" :value="unit">{{ unit }}</option>
            </select>
          </label>
          <label>
            Preparation
            <input
              class="control"
              type="text"
              :value="line.preparationLabel ?? ''"
              placeholder="Not inferred"
              @input="$emit('update', line.id, { preparationLabel: inputValue($event) })"
            />
          </label>
          <label>
            Traditional role
            <input
              class="control"
              type="text"
              :value="line.role ?? ''"
              placeholder="Optional; not inferred"
              @input="$emit('update', line.id, { role: inputValue($event) })"
            />
          </label>
          <label class="note-field">
            Line note
            <input
              class="control"
              type="text"
              :value="line.note ?? ''"
              placeholder="Optional local note"
              @input="$emit('update', line.id, { note: inputValue($event) })"
            />
          </label>
        </div>
        <div class="ingredient-row-actions" aria-label="Ingredient row actions">
          <button
            class="icon-button"
            type="button"
            :disabled="index === 0"
            :aria-label="`Move ${line.herbDisplayName || 'ingredient'} up`"
            @click="$emit('move', line.id, -1)"
          >
            ↑
          </button>
          <button
            class="icon-button"
            type="button"
            :disabled="index === draft.ingredients.length - 1"
            :aria-label="`Move ${line.herbDisplayName || 'ingredient'} down`"
            @click="$emit('move', line.id, 1)"
          >
            ↓
          </button>
          <button
            class="icon-button danger-button"
            type="button"
            :aria-label="`Remove ${line.herbDisplayName || 'ingredient'}`"
            @click="$emit('remove', line.id)"
          >
            ×
          </button>
        </div>
        <div
          v-if="
            validationFor(line.id)?.errors.length ||
            validationFor(line.id)?.warnings.length ||
            duplicateState.exactDuplicateLineIds.has(line.id) ||
            duplicateState.preparationVariantLineIds.has(line.id)
          "
          class="line-feedback"
        >
          <p v-for="error in validationFor(line.id)?.errors" :key="error" class="field-error">
            {{ error }}
          </p>
          <p v-for="warning in validationFor(line.id)?.warnings" :key="warning">
            {{ warning }}
          </p>
          <p v-if="duplicateState.exactDuplicateLineIds.has(line.id)">
            Exact duplicate material and preparation. Rows remain separate.
          </p>
          <p v-if="duplicateState.preparationVariantLineIds.has(line.id)">
            Same base material appears with a different preparation.
          </p>
        </div>
      </article>
    </div>
    <div v-else class="empty-state compact-empty">
      <span aria-hidden="true">＋</span>
      <h3>No ingredient lines</h3>
      <p>Add a material to begin a local composition. Amount may remain unspecified.</p>
      <button class="primary-button" type="button" @click="$emit('add')">Add first material</button>
    </div>
  </section>
</template>
