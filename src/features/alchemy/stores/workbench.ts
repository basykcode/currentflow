import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type {
  FormulaAnalysisResult,
  FormulaComparisonResult,
  FormulaDetail,
  FormulaDraft,
  FormulaIngredientLine,
} from '../domain/types'

export const ALCHEMY_WORKBENCH_STORAGE_KEY = 'current.alchemy.workbench.v1'
export const ALCHEMY_WORKBENCH_VERSION = 1
export const MAX_FORMULA_DRAFTS = 4

type StoredWorkbenchV1 = {
  version: 1
  drafts: readonly FormulaDraft[]
  activeDraftId: string | null
}

let localIdSequence = 0

const nextLocalId = (kind: 'draft' | 'line'): string => {
  localIdSequence += 1
  return `local:alchemy:${kind}:${Date.now()}:${localIdSequence}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isIngredientLine = (value: unknown): value is FormulaIngredientLine => {
  if (!isRecord(value)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['herbMaterialId'] === 'string' &&
    typeof value['herbDisplayName'] === 'string' &&
    typeof value['amountText'] === 'string' &&
    typeof value['unit'] === 'string' &&
    (value['preparationId'] === undefined || typeof value['preparationId'] === 'string') &&
    (value['preparationLabel'] === undefined || typeof value['preparationLabel'] === 'string') &&
    (value['role'] === undefined || typeof value['role'] === 'string') &&
    (value['note'] === undefined || typeof value['note'] === 'string')
  )
}

const isFormulaDraft = (value: unknown): value is FormulaDraft => {
  if (!isRecord(value)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    (value['sourceFormulaId'] === undefined || typeof value['sourceFormulaId'] === 'string') &&
    Array.isArray(value['ingredients']) &&
    value['ingredients'].every(isIngredientLine) &&
    typeof value['notes'] === 'string' &&
    typeof value['updatedAtIso'] === 'string' &&
    !Number.isNaN(Date.parse(value['updatedAtIso']))
  )
}

const readStoredWorkbench = (): StoredWorkbenchV1 => {
  const empty: StoredWorkbenchV1 = { version: 1, drafts: [], activeDraftId: null }
  try {
    const stored = localStorage.getItem(ALCHEMY_WORKBENCH_STORAGE_KEY)
    if (!stored) return empty
    const parsed: unknown = JSON.parse(stored)
    if (!isRecord(parsed) || parsed['version'] !== ALCHEMY_WORKBENCH_VERSION) return empty
    if (!Array.isArray(parsed['drafts']) || !parsed['drafts'].every(isFormulaDraft)) return empty
    if (parsed['drafts'].length > MAX_FORMULA_DRAFTS) return empty
    if (parsed['activeDraftId'] !== null && typeof parsed['activeDraftId'] !== 'string')
      return empty
    const activeDraftId =
      parsed['activeDraftId'] &&
      parsed['drafts'].some((draft: FormulaDraft) => draft.id === parsed['activeDraftId'])
        ? parsed['activeDraftId']
        : (parsed['drafts'][0]?.id ?? null)
    return {
      version: 1,
      drafts: structuredClone(parsed['drafts']),
      activeDraftId,
    }
  } catch {
    return empty
  }
}

const nowIso = (): string => new Date().toISOString()

export const useAlchemyWorkbenchStore = defineStore('alchemy-workbench', () => {
  const initial = readStoredWorkbench()
  const drafts = ref<FormulaDraft[]>([...initial.drafts])
  const activeDraftId = ref<string | null>(initial.activeDraftId)
  const analysesByDraft = ref<Record<string, FormulaAnalysisResult>>({})
  const comparison = ref<FormulaComparisonResult | null>(null)

  const activeDraft = computed(
    () => drafts.value.find((draft) => draft.id === activeDraftId.value) ?? null,
  )
  const hasRoom = computed(() => drafts.value.length < MAX_FORMULA_DRAFTS)

  const persist = () => {
    const stored: StoredWorkbenchV1 = {
      version: ALCHEMY_WORKBENCH_VERSION,
      drafts: drafts.value,
      activeDraftId: activeDraftId.value,
    }
    localStorage.setItem(ALCHEMY_WORKBENCH_STORAGE_KEY, JSON.stringify(stored))
  }

  const replaceDraft = (draftId: string, update: (draft: FormulaDraft) => FormulaDraft) => {
    drafts.value = drafts.value.map((draft) => (draft.id === draftId ? update(draft) : draft))
    delete analysesByDraft.value[draftId]
    comparison.value = null
  }

  const createBlank = (): FormulaDraft | null => {
    if (!hasRoom.value) return null
    const draft: FormulaDraft = {
      id: nextLocalId('draft'),
      name: `Untitled formula ${drafts.value.length + 1}`,
      ingredients: [],
      notes: '',
      updatedAtIso: nowIso(),
    }
    drafts.value.push(draft)
    activeDraftId.value = draft.id
    comparison.value = null
    return draft
  }

  const importFormula = (formula: FormulaDetail): FormulaDraft | null => {
    if (!hasRoom.value) return null
    const draftId = nextLocalId('draft')
    const draft: FormulaDraft = {
      id: draftId,
      name: `${formula.displayName} — local`,
      sourceFormulaId: formula.id,
      ingredients: formula.ingredients.map((ingredient) => ({
        id: nextLocalId('line'),
        herbMaterialId: ingredient.herbMaterialId,
        herbDisplayName: ingredient.herbDisplayName,
        amountText: ingredient.amountText,
        unit: ingredient.unit,
        ...(ingredient.preparationId ? { preparationId: ingredient.preparationId } : {}),
        ...(ingredient.preparationLabel ? { preparationLabel: ingredient.preparationLabel } : {}),
        ...(ingredient.role ? { role: ingredient.role } : {}),
        ...(ingredient.note ? { note: ingredient.note } : {}),
      })),
      notes: `Imported from synthetic source record ${formula.displayName}.`,
      updatedAtIso: nowIso(),
    }
    drafts.value.push(draft)
    activeDraftId.value = draftId
    comparison.value = null
    return draft
  }

  const duplicateDraft = (draftId: string): FormulaDraft | null => {
    if (!hasRoom.value) return null
    const source = drafts.value.find((draft) => draft.id === draftId)
    if (!source) return null
    const duplicate: FormulaDraft = {
      id: nextLocalId('draft'),
      name: `${source.name} copy`,
      ingredients: source.ingredients.map((ingredient) => ({
        ...ingredient,
        id: nextLocalId('line'),
      })),
      notes: source.notes,
      updatedAtIso: nowIso(),
      ...(source.sourceFormulaId ? { sourceFormulaId: source.sourceFormulaId } : {}),
    }
    drafts.value.push(duplicate)
    activeDraftId.value = duplicate.id
    comparison.value = null
    return duplicate
  }

  const removeDraft = (draftId: string) => {
    const index = drafts.value.findIndex((draft) => draft.id === draftId)
    if (index < 0) return
    drafts.value.splice(index, 1)
    delete analysesByDraft.value[draftId]
    comparison.value = null
    if (activeDraftId.value === draftId) {
      activeDraftId.value = drafts.value[Math.min(index, drafts.value.length - 1)]?.id ?? null
    }
  }

  const selectDraft = (draftId: string) => {
    if (drafts.value.some((draft) => draft.id === draftId)) activeDraftId.value = draftId
  }

  const renameDraft = (draftId: string, name: string) => {
    replaceDraft(draftId, (draft) => ({ ...draft, name, updatedAtIso: nowIso() }))
  }

  const updateNotes = (draftId: string, notes: string) => {
    replaceDraft(draftId, (draft) => ({ ...draft, notes, updatedAtIso: nowIso() }))
  }

  const addIngredient = (draftId: string): FormulaIngredientLine | null => {
    const line: FormulaIngredientLine = {
      id: nextLocalId('line'),
      herbMaterialId: '',
      herbDisplayName: '',
      amountText: '',
      unit: 'unspecified',
    }
    let added = false
    replaceDraft(draftId, (draft) => {
      added = true
      return {
        ...draft,
        ingredients: [...draft.ingredients, line],
        updatedAtIso: nowIso(),
      }
    })
    return added ? line : null
  }

  const updateIngredient = (
    draftId: string,
    lineId: string,
    patch: Partial<FormulaIngredientLine>,
  ) => {
    replaceDraft(draftId, (draft) => ({
      ...draft,
      ingredients: draft.ingredients.map((ingredient) =>
        ingredient.id === lineId ? { ...ingredient, ...patch } : ingredient,
      ),
      updatedAtIso: nowIso(),
    }))
  }

  const removeIngredient = (draftId: string, lineId: string) => {
    replaceDraft(draftId, (draft) => ({
      ...draft,
      ingredients: draft.ingredients.filter((ingredient) => ingredient.id !== lineId),
      updatedAtIso: nowIso(),
    }))
  }

  const moveIngredient = (draftId: string, lineId: string, direction: -1 | 1) => {
    replaceDraft(draftId, (draft) => {
      const ingredients = [...draft.ingredients]
      const index = ingredients.findIndex((ingredient) => ingredient.id === lineId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= ingredients.length) return draft
      const current = ingredients[index]
      const adjacent = ingredients[nextIndex]
      if (!current || !adjacent) return draft
      ingredients[index] = adjacent
      ingredients[nextIndex] = current
      return { ...draft, ingredients, updatedAtIso: nowIso() }
    })
  }

  const setAnalysis = (draftId: string, result: FormulaAnalysisResult) => {
    analysesByDraft.value[draftId] = structuredClone(result)
  }

  const clearAnalysis = (draftId: string) => {
    delete analysesByDraft.value[draftId]
  }

  const setComparison = (result: FormulaComparisonResult) => {
    comparison.value = structuredClone(result)
  }

  const clearComparison = () => {
    comparison.value = null
  }

  const reset = () => {
    drafts.value = []
    activeDraftId.value = null
    analysesByDraft.value = {}
    comparison.value = null
    localStorage.removeItem(ALCHEMY_WORKBENCH_STORAGE_KEY)
  }

  watch([drafts, activeDraftId], persist, { deep: true })

  return {
    storageVersion: ALCHEMY_WORKBENCH_VERSION,
    drafts,
    activeDraftId,
    activeDraft,
    hasRoom,
    analysesByDraft,
    comparison,
    createBlank,
    importFormula,
    duplicateDraft,
    removeDraft,
    selectDraft,
    renameDraft,
    updateNotes,
    addIngredient,
    updateIngredient,
    removeIngredient,
    moveIngredient,
    setAnalysis,
    clearAnalysis,
    setComparison,
    clearComparison,
    reset,
  }
})
