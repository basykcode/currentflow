import type { GuidanceBundle, GuidanceValidityWindow, SemanticBoundary } from '../types'

const parseUtc = (value: string, label: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || !value.endsWith('Z')) {
    throw new Error(`${label} must be a valid UTC ISO timestamp.`)
  }
  return parsed
}

export const resolveValidityWindow = (
  validFromUtc: string,
  boundaries: readonly SemanticBoundary[],
): GuidanceValidityWindow => {
  const validFrom = parseUtc(validFromUtc, 'validFromUtc')
  const nextBoundary = boundaries
    .map((boundary) => ({ boundary, at: parseUtc(boundary.atUtc, 'boundary.atUtc') }))
    .filter(({ at }) => at.getTime() > validFrom.getTime())
    .sort((left, right) => left.at.getTime() - right.at.getTime())[0]

  if (!nextBoundary) {
    throw new Error('At least one semantic boundary after validFromUtc is required.')
  }

  return Object.freeze({
    validFromUtc: validFrom.toISOString(),
    validUntilUtc: nextBoundary.at.toISOString(),
    boundaryReason: nextBoundary.boundary.reason,
  })
}

export const isGuidanceExpired = (bundle: GuidanceBundle, at: Date) => {
  if (Number.isNaN(at.getTime())) throw new Error('A valid instant is required.')
  return at.getTime() >= new Date(bundle.validityWindow.validUntilUtc).getTime()
}
