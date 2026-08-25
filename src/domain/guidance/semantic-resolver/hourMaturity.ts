import {
  MACRO_HOUR_MATURITY_METHODOLOGY_ID,
  MACRO_HOUR_MATURITY_METHODOLOGY_VERSION,
  type HourPhase,
} from '@/domain/time/chu-zheng-ke'

import type { HourMaturity } from '../hourMaturityTypes'
import type { ResponseRelation } from './types'

const CHU_VERBS: Readonly<Record<ResponseRelation, readonly string[]>> = Object.freeze({
  follow: ['follow', 'adapt', 'move'],
  contain: ['set', 'limit', 'contain'],
  counterbalance: ['add', 'support', 'supply'],
  complete: ['complete', 'close'],
  wait: ['observe', 'preserve'],
  transform: ['adjust', 'repair', 'clear'],
  withdraw: ['withdraw', 'gather'],
})

const ZHENG_VERBS: Readonly<Record<ResponseRelation, readonly string[]>> = Object.freeze({
  follow: ['continue'],
  contain: ['steady', 'limit'],
  counterbalance: ['support', 'balance', 'nourish'],
  complete: ['finish', 'complete', 'close'],
  wait: ['hold', 'wait', 'preserve'],
  transform: ['restore', 'repair'],
  withdraw: ['reduce', 'gather', 'release'],
})

const DISCOURAGED = Object.freeze({
  chu: ['force', 'accelerate', 'intensify', 'expand'],
  zheng: ['initiate', 'accelerate', 'expand', 'force'],
})

export const resolveHourMaturity = (
  relation: ResponseRelation,
  hourPhase: Pick<HourPhase, 'macroHour' | 'macroSemantic'>,
): HourMaturity => {
  const supportedVerbs = hourPhase.macroHour === 'chu' ? CHU_VERBS[relation] : ZHENG_VERBS[relation]
  const evidence = Object.freeze([
    Object.freeze({
      source: Object.freeze({
        id: `macro-hour-${hourPhase.macroHour}`,
        label: `Macro Hour · ${hourPhase.macroHour === 'chu' ? 'Chū / Entering' : 'Zhèng / Established'}`,
        kind: 'macro-hour' as const,
      }),
      semanticClaim:
        hourPhase.macroHour === 'chu'
          ? 'The existing Hour current is entering and favors proportionate orientation.'
          : 'The existing Hour current is established and favors proportionate continuation.',
      weight: 'supporting' as const,
      provenance: Object.freeze({
        status: 'computed' as const,
        sourceLabel:
          'Current Macro Hour maturity rule · subordinate to Day, Hour Hexagram, response relation, and effort',
        methodologyId: MACRO_HOUR_MATURITY_METHODOLOGY_ID,
        sourceIds: Object.freeze(['temporal-hour-phase:chu-zheng-ke-96-v1']),
      }),
    }),
  ])

  return Object.freeze({
    macroHour: hourPhase.macroHour,
    semantic: hourPhase.macroSemantic,
    supportedVerbs: Object.freeze([...supportedVerbs]),
    discouragedVerbs: DISCOURAGED[hourPhase.macroHour],
    evidence,
    methodologyVersion: MACRO_HOUR_MATURITY_METHODOLOGY_VERSION,
  })
}
