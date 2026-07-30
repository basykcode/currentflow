import type { HexagramReference } from '@/domain/astrology/types'

import { getIntrinsicTransformationResults } from './core'
import { getDeepNuclear, getMutualField } from './interior'
import { enumerateLineChangeDestinations } from './lineChange'
import { getSymmetryFamily } from './symmetry'

export const createTransformationEngine = () => {
  const intrinsicBySource = new Map<number, ReturnType<typeof getIntrinsicTransformationResults>>()
  const symmetryBySource = new Map<number, ReturnType<typeof getSymmetryFamily>>()
  const mutualFieldBySource = new Map<number, ReturnType<typeof getMutualField>>()
  const deepNuclearBySource = new Map<number, ReturnType<typeof getDeepNuclear>>()
  const destinationsBySource = new Map<number, ReturnType<typeof enumerateLineChangeDestinations>>()

  return {
    getIntrinsic(source: HexagramReference) {
      const cached = intrinsicBySource.get(source.number)
      if (cached) return cached
      const calculated = getIntrinsicTransformationResults(source)
      intrinsicBySource.set(source.number, calculated)
      return calculated
    },
    getSymmetry(source: HexagramReference) {
      const cached = symmetryBySource.get(source.number)
      if (cached) return cached
      const calculated = getSymmetryFamily(source)
      symmetryBySource.set(source.number, calculated)
      return calculated
    },
    getMutualField(source: HexagramReference) {
      const cached = mutualFieldBySource.get(source.number)
      if (cached) return cached
      const calculated = getMutualField(source)
      mutualFieldBySource.set(source.number, calculated)
      return calculated
    },
    getDeepNuclear(source: HexagramReference) {
      const cached = deepNuclearBySource.get(source.number)
      if (cached) return cached
      const calculated = getDeepNuclear(source)
      deepNuclearBySource.set(source.number, calculated)
      return calculated
    },
    getDestinations(source: HexagramReference) {
      const cached = destinationsBySource.get(source.number)
      if (cached) return cached
      const calculated = enumerateLineChangeDestinations(source)
      destinationsBySource.set(source.number, calculated)
      return calculated
    },
  }
}

export type TransformationEngine = ReturnType<typeof createTransformationEngine>
