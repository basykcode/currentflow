import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { FormulaDraft, HerbSummary } from '../../../domain/types'
import IngredientEditor from '../IngredientEditor.vue'

const herb: HerbSummary = {
  id: 'demo:herb:root-a',
  displayName: 'Demo Root A',
  nameChineseSimplified: '演示根甲',
  pinyin: 'Yǎnshì Gēn Jiǎ',
  botanicalNames: ['Planta exemplaris alpha'],
  aliases: ['Archive Root A'],
  categoryLabels: ['Demo roots'],
  status: 'demo',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 1,
}

const draft: FormulaDraft = {
  id: 'local:test',
  name: 'Test formula',
  ingredients: [
    {
      id: 'local:line:one',
      herbMaterialId: herb.id,
      herbDisplayName: herb.displayName,
      amountText: '-1',
      unit: 'g',
      preparationLabel: 'Slice',
    },
    {
      id: 'local:line:two',
      herbMaterialId: herb.id,
      herbDisplayName: herb.displayName,
      amountText: '2',
      unit: 'g',
      preparationLabel: 'Slice',
    },
  ],
  notes: '',
  updatedAtIso: '2026-07-23T00:00:00.000Z',
}

describe('IngredientEditor', () => {
  it('labels every editable field and displays duplicate and validation feedback', () => {
    const wrapper = mount(IngredientEditor, {
      props: {
        draft,
        herbOptions: [herb],
        supportedUnits: ['g', 'unspecified'],
        lineValidation: [
          {
            lineId: 'local:line:one',
            errors: ['Amount must be a positive number or left unspecified.'],
            warnings: [],
          },
          { lineId: 'local:line:two', errors: [], warnings: [] },
        ],
        duplicateState: {
          exactDuplicateLineIds: new Set(['local:line:one', 'local:line:two']),
          preparationVariantLineIds: new Set<string>(),
        },
      },
    })

    expect(wrapper.findAll('label').map((item) => item.text())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Material search'),
        expect.stringContaining('Amount'),
        expect.stringContaining('Unit'),
        expect.stringContaining('Preparation'),
        expect.stringContaining('Traditional role'),
        expect.stringContaining('Line note'),
      ]),
    )
    expect(wrapper.text()).toContain('Amount must be a positive number')
    expect(wrapper.text()).toContain('Exact duplicate material and preparation')
    expect(wrapper.findAll('.ingredient-row.has-duplicate')).toHaveLength(2)
  })

  it('emits reorder and remove actions without merging rows', async () => {
    const wrapper = mount(IngredientEditor, {
      props: {
        draft,
        herbOptions: [herb],
        supportedUnits: ['g', 'unspecified'],
        lineValidation: [],
        duplicateState: {
          exactDuplicateLineIds: new Set<string>(),
          preparationVariantLineIds: new Set<string>(),
        },
      },
    })

    await wrapper.find('button[aria-label="Move Demo Root A down"]').trigger('click')
    await wrapper.find('button[aria-label="Remove Demo Root A"]').trigger('click')

    expect(wrapper.emitted('move')?.[0]).toEqual(['local:line:one', 1])
    expect(wrapper.emitted('remove')?.[0]).toEqual(['local:line:one'])
    expect(wrapper.findAll('.ingredient-row')).toHaveLength(2)
  })
})
