import { getInitialTransformations } from './transformations'
import type { Hexagram, RelatedHexagram } from './types'

export const getStructuralRelationships = (source: Hexagram): readonly RelatedHexagram[] => {
  return getInitialTransformations(source)
    .filter((transformation) => transformation.key !== 'trigram-exchange')
    .map((transformation) => ({
      hexagram: transformation.hexagram,
      relationshipLabel: `${transformation.label} · ${transformation.traditionalLabel}`,
      status: transformation.status,
      sourceLabel: transformation.sourceLabel,
    }))
}
