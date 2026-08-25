import type { GuidanceCondition, ResponseRelation, SomaticVector, StrategicVector } from '../types'

type ResponseRelationDefinition = Readonly<{
  meaning: string
  strategicVectors: readonly StrategicVector[]
  somaticVectors: readonly SomaticVector[]
  supportedVerbs: readonly string[]
  forbiddenVerbs: readonly string[]
}>

export const RESPONSE_RELATION_BY_CONDITION: Readonly<Record<GuidanceCondition, ResponseRelation>> =
  Object.freeze({
    emergence: 'follow',
    excess: 'contain',
    deficiency: 'counterbalance',
    completion: 'complete',
    threshold: 'wait',
    repair: 'transform',
    withdrawal: 'withdraw',
  })

export const RESPONSE_RELATIONS: Readonly<Record<ResponseRelation, ResponseRelationDefinition>> =
  Object.freeze({
    follow: {
      meaning: 'Move with a coherent current.',
      strategicVectors: ['advance', 'adapt'],
      somaticVectors: ['maintain-rhythm', 'allow-space'],
      supportedVerbs: ['follow', 'continue', 'adapt', 'move'],
      forbiddenVerbs: ['force', 'freeze', 'retreat'],
    },
    contain: {
      meaning: 'Limit excess without suppressing movement.',
      strategicVectors: ['limit', 'stabilize', 'simplify'],
      somaticVectors: ['settle', 'ground', 'reduce-pace'],
      supportedVerbs: ['contain', 'limit', 'set', 'steady', 'simplify'],
      forbiddenVerbs: ['expand', 'scatter', 'accelerate'],
    },
    counterbalance: {
      meaning: 'Supply a missing stabilizing quality.',
      strategicVectors: ['stabilize', 'nourish', 'clarify'],
      somaticVectors: ['ground', 'soften', 'restore-circulation'],
      supportedVerbs: ['add', 'support', 'supply', 'balance', 'nourish'],
      forbiddenVerbs: ['deplete', 'strip', 'overload'],
    },
    complete: {
      meaning: 'Bring ripening work to closure.',
      strategicVectors: ['complete', 'release', 'simplify'],
      somaticVectors: ['settle', 'allow-space'],
      supportedVerbs: ['complete', 'finish', 'close', 'release', 'withdraw'],
      forbiddenVerbs: ['initiate', 'multiply', 'reopen'],
    },
    wait: {
      meaning: 'Preserve a threshold.',
      strategicVectors: ['pause', 'stabilize', 'clarify'],
      somaticVectors: ['settle', 'reduce-pace', 'allow-space'],
      supportedVerbs: ['wait', 'preserve', 'hold', 'observe'],
      forbiddenVerbs: ['force', 'rush', 'commit'],
    },
    transform: {
      meaning: 'Restore circulation.',
      strategicVectors: ['repair', 'adapt', 'simplify'],
      somaticVectors: ['restore-circulation', 'soften', 'maintain-rhythm'],
      supportedVerbs: ['repair', 'restore', 'adjust', 'clear'],
      forbiddenVerbs: ['entrench', 'ignore', 'intensify'],
    },
    withdraw: {
      meaning: 'Reduce outward expenditure.',
      strategicVectors: ['gather', 'release', 'pause'],
      somaticVectors: ['reduce-pace', 'settle', 'allow-space'],
      supportedVerbs: ['withdraw', 'reduce', 'gather', 'release'],
      forbiddenVerbs: ['expand', 'pursue', 'broadcast'],
    },
  })

export const resolveResponseRelation = (condition: GuidanceCondition) =>
  RESPONSE_RELATION_BY_CONDITION[condition]

export const getResponseRelationDefinition = (relation: ResponseRelation) =>
  RESPONSE_RELATIONS[relation]
