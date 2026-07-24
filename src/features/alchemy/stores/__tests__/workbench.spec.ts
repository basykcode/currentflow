import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { inspectDraftDuplicates, validateFormulaDraft } from '../../domain/workbenchValidation'
import { DemoAlchemyProvider } from '../../providers/demoAlchemyProvider'
import {
  ALCHEMY_WORKBENCH_STORAGE_KEY,
  MAX_FORMULA_DRAFTS,
  useAlchemyWorkbenchStore,
} from '../workbench'

describe('Alchemy workbench store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('creates at most four blank formulas and switches the active formula', () => {
    const store = useAlchemyWorkbenchStore()
    const created = Array.from({ length: MAX_FORMULA_DRAFTS }, () => store.createBlank())

    expect(created.every(Boolean)).toBe(true)
    expect(store.drafts).toHaveLength(4)
    expect(store.createBlank()).toBeNull()

    const first = store.drafts[0]
    expect(first).toBeDefined()
    if (first) store.selectDraft(first.id)
    expect(store.activeDraftId).toBe(first?.id)
  })

  it('duplicates, renames, removes, and reorders local ingredient rows', () => {
    const store = useAlchemyWorkbenchStore()
    const source = store.createBlank()
    expect(source).not.toBeNull()
    if (!source) return

    store.renameDraft(source.id, 'Archive study')
    const first = store.addIngredient(source.id)
    const second = store.addIngredient(source.id)
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    if (!first || !second) return

    store.updateIngredient(source.id, first.id, {
      herbMaterialId: 'demo:herb:root-a',
      herbDisplayName: 'Demo Root A',
    })
    store.updateIngredient(source.id, second.id, {
      herbMaterialId: 'demo:herb:seed-b',
      herbDisplayName: 'Demo Seed B',
    })
    store.moveIngredient(source.id, second.id, -1)
    expect(store.activeDraft?.ingredients[0]?.id).toBe(second.id)

    const duplicate = store.duplicateDraft(source.id)
    expect(duplicate?.name).toBe('Archive study copy')
    expect(duplicate?.ingredients[0]?.id).not.toBe(second.id)

    store.removeIngredient(source.id, first.id)
    expect(store.drafts.find((item) => item.id === source.id)?.ingredients).toHaveLength(1)
    if (duplicate) store.removeDraft(duplicate.id)
    expect(store.drafts).toHaveLength(1)
  })

  it('persists a versioned workspace and recovers from corrupt localStorage', async () => {
    const store = useAlchemyWorkbenchStore()
    const draft = store.createBlank()
    expect(draft).not.toBeNull()
    await nextTick()

    const stored = localStorage.getItem(ALCHEMY_WORKBENCH_STORAGE_KEY)
    expect(stored).toContain('"version":1')
    expect(stored).toContain('Untitled formula 1')

    store.$dispose()
    setActivePinia(createPinia())
    const hydrated = useAlchemyWorkbenchStore()
    expect(hydrated.drafts).toHaveLength(1)

    hydrated.$dispose()
    localStorage.setItem(ALCHEMY_WORKBENCH_STORAGE_KEY, '{"version":1,"drafts":"broken"}')
    setActivePinia(createPinia())
    const recovered = useAlchemyWorkbenchStore()
    expect(recovered.drafts).toEqual([])
    expect(recovered.activeDraftId).toBeNull()
  })

  it('loads a source formula by deep copy without mutating the source record', async () => {
    const provider = new DemoAlchemyProvider(0)
    const source = await provider.getFormula('demo:formula:one')
    const sourceBefore = structuredClone(source)
    const store = useAlchemyWorkbenchStore()

    const local = store.importFormula(source)
    expect(local?.sourceFormulaId).toBe(source.id)
    expect(local?.ingredients[0]?.id).not.toBe(source.ingredients[0]?.id)
    if (local?.ingredients[0]) {
      store.updateIngredient(local.id, local.ingredients[0].id, { amountText: '99' })
    }
    expect(source).toEqual(sourceBefore)
  })

  it('validates amounts and units and exposes duplicate preparation states', () => {
    const store = useAlchemyWorkbenchStore()
    const draft = store.createBlank()
    if (!draft) return
    const first = store.addIngredient(draft.id)
    const second = store.addIngredient(draft.id)
    if (!first || !second) return

    for (const line of [first, second]) {
      store.updateIngredient(draft.id, line.id, {
        herbMaterialId: 'demo:herb:root-a',
        herbDisplayName: 'Demo Root A',
        amountText: '-2',
        unit: 'mystery-unit',
        preparationLabel: 'Slice',
      })
    }

    const active = store.activeDraft
    expect(active).not.toBeNull()
    if (!active) return
    const validation = validateFormulaDraft(active, ['g', 'unspecified'])
    const duplicateState = inspectDraftDuplicates(active)

    expect(validation.valid).toBe(false)
    expect(validation.lines[0]?.errors.join(' ')).toMatch(/positive number/i)
    expect(validation.lines[0]?.errors.join(' ')).toMatch(/not supported/i)
    expect(duplicateState.exactDuplicateLineIds.has(first.id)).toBe(true)

    store.updateIngredient(draft.id, second.id, { preparationLabel: 'Toasted slice' })
    const variants = inspectDraftDuplicates(store.activeDraft ?? active)
    expect(variants.preparationVariantLineIds.has(second.id)).toBe(true)
  })
})
