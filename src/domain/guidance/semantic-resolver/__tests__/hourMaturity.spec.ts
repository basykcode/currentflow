import { describe, expect, it } from 'vitest'

import { getResponseRelationDefinition } from '../../synthesis/responseRelation'
import { resolveHourMaturity } from '../hourMaturity'
import type { ResponseRelation } from '../types'

const relations: readonly ResponseRelation[] = [
  'follow',
  'contain',
  'counterbalance',
  'complete',
  'wait',
  'transform',
  'withdraw',
]

describe('resolveHourMaturity', () => {
  it.each(relations)('keeps Chū verbs inside the authoritative %s relation', (relation) => {
    const maturity = resolveHourMaturity(relation, {
      macroHour: 'chu',
      macroSemantic: 'entering',
    })
    const response = getResponseRelationDefinition(relation)

    expect(maturity.supportedVerbs.every((verb) => response.supportedVerbs.includes(verb))).toBe(
      true,
    )
    expect(maturity.supportedVerbs.some((verb) => response.forbiddenVerbs.includes(verb))).toBe(
      false,
    )
    expect(maturity).not.toHaveProperty('effortLevel')
  })

  it.each(relations)('keeps Zhèng verbs inside the authoritative %s relation', (relation) => {
    const maturity = resolveHourMaturity(relation, {
      macroHour: 'zheng',
      macroSemantic: 'established',
    })
    const response = getResponseRelationDefinition(relation)

    expect(maturity.supportedVerbs.every((verb) => response.supportedVerbs.includes(verb))).toBe(
      true,
    )
    expect(maturity.supportedVerbs.some((verb) => response.forbiddenVerbs.includes(verb))).toBe(
      false,
    )
    expect(maturity.discouragedVerbs).toContain('accelerate')
  })

  it('treats Chū stillness as observing/preserving rather than forced initiation', () => {
    const maturity = resolveHourMaturity('wait', {
      macroHour: 'chu',
      macroSemantic: 'entering',
    })

    expect(maturity.supportedVerbs).toEqual(['observe', 'preserve'])
    expect(maturity.supportedVerbs).not.toContain('move')
  })

  it('treats Zhèng withdrawal as maintained reduction without expansion', () => {
    const maturity = resolveHourMaturity('withdraw', {
      macroHour: 'zheng',
      macroSemantic: 'established',
    })

    expect(maturity.supportedVerbs).toEqual(['reduce', 'gather', 'release'])
    expect(maturity.discouragedVerbs).toContain('expand')
  })
})
