import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { getHexagram } from '@/domain/astrology/hexagrams'
import { createAvailableResult, createTransformationEngine } from '@/domain/yijing/transformations'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

describe('hexagram inspector modal navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns from a target to the exact preserved Lab screen', () => {
    const inspector = useHexagramInspectorStore()
    const source = getHexagram(5)
    const nuclear = createTransformationEngine()
      .getIntrinsic(source)
      .find((result) => result.definitionId === 'nuclear')
    expect(nuclear).toBeDefined()

    inspector.open(source)
    inspector.openTransformationLab([2, 4], 180)
    const lab = inspector.screen
    if (!lab || lab.kind !== 'transformation-lab') {
      throw new Error('Transformation Lab did not open.')
    }
    inspector.updateTransformationLab({
      activeSection: 'interior',
      selectedDestination: 38,
      scrollTop: 420,
      filters: {
        ...lab.filters,
        query: 'Opposition',
      },
    })
    const preserved = inspector.screen

    if (!nuclear) throw new Error('Nuclear result missing.')
    inspector.openHexagramFromTransformation(nuclear)
    expect(inspector.hexagram?.number).toBe(38)
    expect(inspector.screen?.kind).toBe('hexagram')
    expect(
      inspector.screen?.kind === 'hexagram'
        ? inspector.screen.arrivalContext?.transformationDefinitionId
        : undefined,
    ).toBe('nuclear')

    inspector.navigateBackWithinModal()
    expect(inspector.screen).toEqual(preserved)
  })

  it('does not push self-mapping loops and resets all transient state on close', () => {
    const inspector = useHexagramInspectorStore()
    const source = getHexagram(1)
    const selfResult = createAvailableResult(source, 'nuclear', source)

    inspector.open(source)
    inspector.openTransformationLab()
    const historyLength = inspector.history.length
    inspector.openHexagramFromTransformation(selfResult)
    expect(inspector.history).toHaveLength(historyLength)
    expect(inspector.screen?.kind).toBe('transformation-lab')

    inspector.close()
    expect(inspector.screen).toBeNull()
    expect(inspector.history).toEqual([])
    expect(inspector.chain).toEqual([])
    expect(inspector.visitedHexagramNumbers.size).toBe(0)
  })

  it('builds a contiguous multi-target chain when each target opens its own Lab', () => {
    const inspector = useHexagramInspectorStore()
    const engine = createTransformationEngine()
    const five = getHexagram(5)
    const nuclear = engine.getIntrinsic(five).find((result) => result.definitionId === 'nuclear')
    if (!nuclear) throw new Error('Nuclear result missing.')

    inspector.open(five)
    inspector.openTransformationLab()
    inspector.openHexagramFromTransformation(nuclear)
    expect(inspector.hexagram?.number).toBe(38)

    const thirtyEight = getHexagram(38)
    const complement = engine
      .getIntrinsic(thirtyEight)
      .find((result) => result.definitionId === 'line-complement')
    if (!complement) throw new Error('Complement result missing.')

    inspector.openTransformationLab()
    inspector.openHexagramFromTransformation(complement)

    expect(inspector.chain).toHaveLength(2)
    expect(
      inspector.chain.map((step) => [step.sourceHexagramNumber, step.targetHexagramNumber]),
    ).toEqual([
      [5, 38],
      [38, complement.targetHexagramNumber],
    ])
    expect(inspector.visitedHexagramNumbers.has(5)).toBe(true)
    expect(inspector.visitedHexagramNumbers.has(38)).toBe(true)
    expect(inspector.visitedHexagramNumbers.has(complement.targetHexagramNumber ?? 0)).toBe(true)
  })
})
