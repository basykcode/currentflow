import type { FormulaDraft, FormulaIngredientLine } from './types'

export type IngredientLineValidation = {
  lineId: string
  errors: readonly string[]
  warnings: readonly string[]
}

export type DraftValidation = {
  valid: boolean
  summaryErrors: readonly string[]
  lines: readonly IngredientLineValidation[]
}

export type DraftDuplicateState = {
  exactDuplicateLineIds: ReadonlySet<string>
  preparationVariantLineIds: ReadonlySet<string>
}

export const validateFormulaDraft = (
  draft: FormulaDraft,
  supportedUnits: readonly string[],
): DraftValidation => {
  const lines = draft.ingredients.map((line) => {
    const errors: string[] = []
    const warnings: string[] = []
    const amount = line.amountText.trim()

    if (!line.herbMaterialId) errors.push('Select a resolved material from the index.')
    if (!line.herbDisplayName.trim()) errors.push('Material identity is required.')
    if (amount) {
      const numericAmount = Number(amount)
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        errors.push('Amount must be a positive number or left unspecified.')
      }
      if (line.unit === 'unspecified') {
        warnings.push('Amount has no resolved unit.')
      }
    }
    if (!amount && line.unit !== 'unspecified') {
      warnings.push('Amount is unspecified; the selected unit is retained without conversion.')
    }
    if (!supportedUnits.includes(line.unit)) {
      errors.push('Unit is not supported by the active provider.')
    }

    return { lineId: line.id, errors, warnings }
  })

  const summaryErrors = [
    ...(draft.ingredients.length === 0 ? ['Add at least one ingredient.'] : []),
    ...(!draft.name.trim() ? ['Formula name is required.'] : []),
  ]

  return {
    valid: summaryErrors.length === 0 && lines.every((line) => line.errors.length === 0),
    summaryErrors,
    lines,
  }
}

const preparationKey = (line: FormulaIngredientLine): string =>
  line.preparationId || line.preparationLabel?.trim().toLocaleLowerCase() || 'unspecified'

export const inspectDraftDuplicates = (draft: FormulaDraft): DraftDuplicateState => {
  const exactDuplicateLineIds = new Set<string>()
  const preparationVariantLineIds = new Set<string>()
  const resolvedLines = draft.ingredients.filter((line) => line.herbMaterialId)

  for (let left = 0; left < resolvedLines.length; left += 1) {
    for (let right = left + 1; right < resolvedLines.length; right += 1) {
      const first = resolvedLines[left]
      const second = resolvedLines[right]
      if (!first || !second || first.herbMaterialId !== second.herbMaterialId) continue
      if (preparationKey(first) === preparationKey(second)) {
        exactDuplicateLineIds.add(first.id)
        exactDuplicateLineIds.add(second.id)
      } else {
        preparationVariantLineIds.add(first.id)
        preparationVariantLineIds.add(second.id)
      }
    }
  }

  return { exactDuplicateLineIds, preparationVariantLineIds }
}
