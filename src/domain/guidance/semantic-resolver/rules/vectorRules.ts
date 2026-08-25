import type {
  ResolvedTemporalScale,
  SomaticVector,
  StrategicVector,
  ResponseRelation,
} from '../types'
import { rankWeightedValues } from '../weighting'

const SOMATIC_BY_RELATION: Readonly<Record<ResponseRelation, readonly SomaticVector[]>> =
  Object.freeze({
    follow: ['keep-steps-light', 'widen-gaze'],
    contain: ['lower-center', 'hold-position', 'reduce-pace'],
    counterbalance: ['settle-breath', 'widen-gaze'],
    complete: ['release-shoulders', 'soften-grip', 'lower-center'],
    wait: ['reduce-pace', 'hold-position', 'settle-breath'],
    transform: ['soften-grip', 'settle-breath', 'keep-steps-light'],
    withdraw: ['reduce-pace', 'release-shoulders', 'lower-center'],
  })

const SOMATIC_BY_STRATEGY: Partial<Readonly<Record<StrategicVector, SomaticVector>>> =
  Object.freeze({
    begin: 'widen-gaze',
    continue: 'keep-steps-light',
    finish: 'release-shoulders',
    repair: 'soften-grip',
    clarify: 'widen-gaze',
    organize: 'lower-center',
    narrow: 'reduce-pace',
    protect: 'hold-position',
    receive: 'settle-breath',
    release: 'release-shoulders',
    pause: 'settle-breath',
    withdraw: 'reduce-pace',
    adapt: 'keep-steps-light',
  })

export const resolveStrategicVectors = (scales: readonly ResolvedTemporalScale[]) =>
  rankWeightedValues(scales, (scale) => scale.profile.strategicVectors).slice(0, 4)

export const resolveSomaticVectors = (
  relation: ResponseRelation,
  strategicVectors: readonly StrategicVector[],
): readonly SomaticVector[] => {
  const values = [
    ...SOMATIC_BY_RELATION[relation],
    ...strategicVectors.map((vector) => SOMATIC_BY_STRATEGY[vector]).filter((value) => value),
  ] as SomaticVector[]
  return [...new Set(values)].slice(0, 3)
}
