import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getHexagram } from '@/domain/astrology/hexagrams'
import type { Hexagram } from '@/domain/astrology/types'
import {
  DEFAULT_TRANSFORMATION_LAB_FILTERS,
  type LineNumber,
  type TransformationArrivalContext,
  type TransformationChainStep,
  type TransformationLabFilters,
  type TransformationLabSectionId,
  type TransformationResult,
} from '@/domain/yijing/transformations'

export type HexagramModalScreen =
  | {
      kind: 'hexagram'
      hexagramNumber: number
      arrivalContext?: TransformationArrivalContext
      scrollTop?: number
    }
  | {
      kind: 'transformation-lab'
      sourceHexagramNumber: number
      activeSection: TransformationLabSectionId
      selectedMovingLines: readonly LineNumber[]
      selectedDestination?: number
      filters: TransformationLabFilters
      scrollTop?: number
    }

const cloneFilters = (): TransformationLabFilters => ({
  ...DEFAULT_TRANSFORMATION_LAB_FILTERS,
})

export const useHexagramInspectorStore = defineStore('hexagram-inspector', () => {
  const screen = ref<HexagramModalScreen | null>(null)
  const history = ref<readonly HexagramModalScreen[]>([])
  const chain = ref<readonly TransformationChainStep[]>([])
  const visitedHexagramNumbers = ref<ReadonlySet<number>>(new Set())

  const selectedNumber = computed(() => {
    const current = screen.value
    if (!current) return null
    return current.kind === 'hexagram' ? current.hexagramNumber : current.sourceHexagramNumber
  })
  const hexagram = computed(() =>
    selectedNumber.value === null ? null : getHexagram(selectedNumber.value),
  )
  const isOpen = computed(() => screen.value !== null)
  const canNavigateBack = computed(() => history.value.length > 0)

  const open = (selection: number | Hexagram) => {
    const number = typeof selection === 'number' ? selection : selection.number
    if (number === null) return
    const resolvedNumber = getHexagram(number).number
    screen.value = {
      kind: 'hexagram',
      hexagramNumber: resolvedNumber,
    }
    history.value = []
    chain.value = []
    visitedHexagramNumbers.value = new Set([resolvedNumber])
  }

  const openTransformationLab = (
    selectedMovingLines: readonly LineNumber[] = [],
    scrollTop = 0,
  ) => {
    const current = screen.value
    if (!current || current.kind !== 'hexagram') return
    history.value = [...history.value, { ...current, scrollTop }]
    screen.value = {
      kind: 'transformation-lab',
      sourceHexagramNumber: current.hexagramNumber,
      activeSection: 'explore',
      selectedMovingLines: [...selectedMovingLines],
      filters: cloneFilters(),
      scrollTop: 0,
    }
  }

  const updateTransformationLab = (
    update: Partial<
      Pick<
        Extract<HexagramModalScreen, { kind: 'transformation-lab' }>,
        'activeSection' | 'selectedMovingLines' | 'selectedDestination' | 'filters' | 'scrollTop'
      >
    >,
  ) => {
    const current = screen.value
    if (!current || current.kind !== 'transformation-lab') return
    screen.value = {
      ...current,
      ...update,
      selectedMovingLines:
        update.selectedMovingLines === undefined
          ? current.selectedMovingLines
          : [...update.selectedMovingLines],
      filters:
        update.filters === undefined
          ? current.filters
          : {
              ...update.filters,
            },
    }
  }

  const openHexagramFromTransformation = (result: TransformationResult) => {
    const current = screen.value
    const targetNumber = result.targetHexagramNumber
    if (!current || targetNumber === undefined) return
    const sourceNumber =
      current.kind === 'transformation-lab' ? current.sourceHexagramNumber : current.hexagramNumber
    if (targetNumber === sourceNumber) return

    const step: TransformationChainStep = {
      sourceHexagramNumber: sourceNumber,
      targetHexagramNumber: targetNumber,
      definitionId: result.definitionId,
      label: result.operationLabels.join(' / '),
      changedLines: result.changedLines,
    }
    const nextChain = [...chain.value, step]
    history.value = [...history.value, current]
    chain.value = nextChain
    visitedHexagramNumbers.value = new Set([...visitedHexagramNumbers.value, targetNumber])
    screen.value = {
      kind: 'hexagram',
      hexagramNumber: targetNumber,
      arrivalContext: {
        sourceHexagramNumber: sourceNumber,
        targetHexagramNumber: targetNumber,
        transformationDefinitionId: result.definitionId,
        transformationLabel: result.operationLabels.join(' / '),
        changedLines: result.changedLines,
        chain: nextChain,
      },
      scrollTop: 0,
    }
  }

  const navigateBackWithinModal = () => {
    const previous = history.value.at(-1)
    if (!previous) return
    history.value = history.value.slice(0, -1)
    screen.value = previous
  }

  const returnToSourceHexagram = () => {
    const current = screen.value
    if (!current) return
    const sourceNumber =
      current.kind === 'transformation-lab'
        ? current.sourceHexagramNumber
        : current.arrivalContext?.sourceHexagramNumber
    if (sourceNumber === undefined) return
    screen.value = {
      kind: 'hexagram',
      hexagramNumber: sourceNumber,
    }
    history.value = []
  }

  const resetTransformationChain = () => {
    chain.value = []
    const currentNumber = selectedNumber.value
    visitedHexagramNumbers.value = new Set(currentNumber === null ? [] : [currentNumber])
  }

  const openChainHexagram = (hexagramNumber: number) => {
    const current = screen.value
    if (!current || selectedNumber.value === hexagramNumber) return
    getHexagram(hexagramNumber)
    history.value = [...history.value, current]
    screen.value = {
      kind: 'hexagram',
      hexagramNumber,
    }
  }

  const close = () => {
    screen.value = null
    history.value = []
    chain.value = []
    visitedHexagramNumbers.value = new Set()
  }

  return {
    screen,
    history,
    chain,
    visitedHexagramNumbers,
    selectedNumber,
    hexagram,
    isOpen,
    canNavigateBack,
    open,
    openTransformationLab,
    updateTransformationLab,
    openHexagramFromTransformation,
    navigateBackWithinModal,
    returnToSourceHexagram,
    resetTransformationChain,
    openChainHexagram,
    close,
  }
})
