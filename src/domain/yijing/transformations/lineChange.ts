import { getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramReference } from '@/domain/astrology/types'

import {
  calculateLineChange,
  calculateNuclear,
  createAvailableResult,
  getChangedLineNumbers,
  LINE_NUMBERS,
} from './core'
import type { LineChangeDestination, LineNumber, TransformationChainStep } from './types'

export const lineNumbersFromMask = (mask: number): readonly LineNumber[] => {
  if (!Number.isInteger(mask) || mask < 0 || mask > 63) {
    throw new Error(`Line-change mask must be an integer from 0 through 63: ${mask}`)
  }
  return LINE_NUMBERS.filter((lineNumber) => (mask & (1 << (lineNumber - 1))) !== 0)
}

export const maskFromLineNumbers = (lineNumbers: readonly LineNumber[]): number =>
  lineNumbers.reduce((mask, lineNumber) => mask | (1 << (lineNumber - 1)), 0)

export const enumerateLineChangeDestinations = (
  source: HexagramReference,
): readonly LineChangeDestination[] => {
  const sourceNuclear = getHexagramByLines(calculateNuclear(source.linesBottomToTop))
  const destinations: LineChangeDestination[] = []

  for (let mask = 1; mask <= 63; mask += 1) {
    const changedLines = lineNumbersFromMask(mask)
    const target = getHexagramByLines(calculateLineChange(source.linesBottomToTop, changedLines))
    const targetNuclear = getHexagramByLines(calculateNuclear(target.linesBottomToTop))
    destinations.push({
      result: createAvailableResult(source, 'line-change', target, changedLines),
      target,
      mask,
      changedLineCount: changedLines.length as LineNumber,
      sharesLowerTrigram: source.lowerTrigram.key === target.lowerTrigram.key,
      sharesUpperTrigram: source.upperTrigram.key === target.upperTrigram.key,
      sharesNuclearHexagram: sourceNuclear.number === targetNuclear.number,
      yilinStatus: 'source-unavailable',
    })
  }

  return destinations
}

export const factorial = (value: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new Error(`Transformation path factorial supports integers from 0 through 6: ${value}`)
  }
  let result = 1
  for (let factor = 2; factor <= value; factor += 1) {
    result *= factor
  }
  return result
}

export type TransformationPath = {
  index: number
  changedLineOrder: readonly LineNumber[]
  steps: readonly TransformationChainStep[]
}

export type TransformationPathPage = {
  total: number
  offset: number
  limit: number
  paths: readonly TransformationPath[]
}

const nthPermutation = (
  values: readonly LineNumber[],
  permutationIndex: number,
): readonly LineNumber[] => {
  const remaining = [...values]
  const permutation: LineNumber[] = []
  let index = permutationIndex

  for (let position = remaining.length; position > 0; position -= 1) {
    const blockSize = factorial(position - 1)
    const selectedIndex = Math.floor(index / blockSize)
    const selected = remaining.splice(selectedIndex, 1)[0]
    if (selected === undefined) {
      throw new Error('Unable to resolve transformation path permutation.')
    }
    permutation.push(selected)
    index %= blockSize
  }

  return permutation
}

export const getTransformationPathCount = (
  source: HexagramReference,
  target: HexagramReference,
): number =>
  factorial(getChangedLineNumbers(source.linesBottomToTop, target.linesBottomToTop).length)

export const getTransformationPaths = (
  source: HexagramReference,
  target: HexagramReference,
  options: { offset?: number; limit?: number } = {},
): TransformationPathPage => {
  const differingLines = getChangedLineNumbers(source.linesBottomToTop, target.linesBottomToTop)
  const total = factorial(differingLines.length)
  const offset = Math.max(0, Math.min(options.offset ?? 0, total))
  const limit = Math.max(1, Math.min(options.limit ?? 12, 25))
  const end = Math.min(offset + limit, total)
  const paths: TransformationPath[] = []

  for (let permutationIndex = offset; permutationIndex < end; permutationIndex += 1) {
    const changedLineOrder = nthPermutation(differingLines, permutationIndex)
    const appliedLines: LineNumber[] = []
    const steps: TransformationChainStep[] = []
    let current = source

    for (const lineNumber of changedLineOrder) {
      appliedLines.push(lineNumber)
      const next = getHexagramByLines(calculateLineChange(source.linesBottomToTop, appliedLines))
      steps.push({
        sourceHexagramNumber: current.number,
        targetHexagramNumber: next.number,
        definitionId: 'line-change',
        label: `Change line ${lineNumber}`,
        changedLines: [lineNumber],
      })
      current = next
    }

    paths.push({
      index: permutationIndex,
      changedLineOrder,
      steps,
    })
  }

  return { total, offset, limit, paths }
}
