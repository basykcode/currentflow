import { describe, expect, it } from 'vitest'

import { getHexagram } from '@/domain/astrology/hexagrams'
import type { TemporalHexagram, TemporalScope } from '@/domain/astrology/types'

import { createGuidanceBundle } from '../../guidanceEngine'
import { composeTemporalSemantics, toGuidanceSemanticInput } from '../composition'
import { getHexagramSemanticRecords } from '../hexagrams/registry'
import { validateHexagramSemanticProfiles } from '../hexagrams/validation'
import { resolveTemporalSemantics } from '../resolver'
import type { HexagramSemanticProfile, ResolvedTemporalScale } from '../types'
import type { MacroHour } from '@/domain/time/chu-zheng-ke'
import { HEXAGRAM_SEMANTIC_PROFILE_VERSION } from '../versions'

const temporal = (scope: TemporalScope, hexagramNumber: number): TemporalHexagram => ({
  scope,
  label: `${scope} test field`,
  timeBoundsLabel: `${scope} test bounds`,
  hexagram: getHexagram(hexagramNumber),
  numberingSystem: 'king-wen',
  mappingSystem: 'demo-fixture',
  mappingVersion: 'semantic-resolver-test-fixture-v1',
  status: 'computed',
  sourceLabel: 'Deterministic temporal test fixture',
})

const input = (
  year: number,
  month: number,
  day: number,
  hour: number,
  macroHour: MacroHour = 'chu',
) => ({
  temporal: {
    year: temporal('year', year),
    month: temporal('month', month),
    day: temporal('day', day),
    hour: temporal('hour', hour),
  },
  hourPhase: {
    macroHour,
    macroSemantic: macroHour === 'chu' ? ('entering' as const) : ('established' as const),
  },
})

describe('Temporal Semantic Resolver v1', () => {
  it('registers exactly the reviewed MVP set through canonical hexagram identities', () => {
    const records = getHexagramSemanticRecords()
    expect(records.map((record) => record.hexagram.number)).toEqual([
      1, 2, 12, 18, 28, 48, 52, 53, 57, 61, 62, 63, 64,
    ])
    expect(records.every((record) => record.profile.review.status === 'spec-reviewed')).toBe(true)
    expect(records.every((record) => record.profile.review.reviewedBy.length === 0)).toBe(true)
    expect(records.every((record) => record.hexagram.status === 'curated')).toBe(true)
  })

  it('represents the Hexagram 28 reduce example without adding an invalid strategic primitive', () => {
    const profile = getHexagramSemanticRecords().find(
      (record) => record.hexagram.number === 28,
    )?.profile
    expect(profile?.movement).toEqual(['culminate', 'turn'])
    expect(profile?.strategicVectors).toEqual(['finish', 'repair', 'narrow', 'release'])
    expect(profile?.preferredVerbs).toContain('reduce')
    expect(profile?.strategicVectors).not.toContain('reduce')
    expect(profile?.forbiddenVerbs).toEqual(['expand', 'accelerate'])
  })

  it('keeps the day operative when all three lesser scales oppose it', () => {
    const result = resolveTemporalSemantics(input(12, 12, 1, 12))
    expect(result.status).toBe('available')
    if (result.status !== 'available') throw new Error('Expected an available resolution.')
    expect(result.primaryCurrent.relation).toBe('follow')
    expect(result.field.primaryDirection).toBe('emerge')
    expect(result.conflicts.some((conflict) => conflict.kind === 'response-relation')).toBe(true)
  })

  it('returns deterministic structured semantics and separated evidence', () => {
    const first = resolveTemporalSemantics(input(1, 53, 28, 57))
    const second = resolveTemporalSemantics(input(1, 53, 28, 57))
    expect(first).toEqual(second)
    expect(first.status).toBe('available')
    if (first.status !== 'available') throw new Error('Expected an available resolution.')
    expect(first.coverage).toBe('complete')
    expect(first.primaryCurrent).toMatchObject({
      scope: 'day',
      hexagramNumber: 28,
      relation: 'contain',
      effortLevel: 'measured',
    })
    expect(first.versions).toMatchObject({
      resolver: first.version,
      registry: first.registryVersion,
    })
    expect(first.evidence[0]).toMatchObject({
      scope: 'day',
      canonicalIdentity: { status: 'curated' },
      currentSemanticProfile: { layer: 'current-semantic', review: { status: 'spec-reviewed' } },
    })
  })

  it('allows explicit partial coverage only when the operative day profile exists', () => {
    const partial = resolveTemporalSemantics(input(10, 11, 28, 15))
    expect(partial.status).toBe('available')
    if (partial.status !== 'available') throw new Error('Expected partial coverage.')
    expect(partial.coverage).toBe('partial')
    expect(partial.missingProfileNumbers).toEqual([15, 11, 10])

    const unavailable = resolveTemporalSemantics(input(28, 48, 10, 52))
    expect(unavailable.status).toBe('unavailable')
    if (unavailable.status !== 'unavailable') throw new Error('Expected unavailable semantics.')
    expect(unavailable.reason).toContain('operative day Hexagram 10')
  })

  it('carries partial coverage gaps into downstream evidence', () => {
    const resolution = resolveTemporalSemantics(input(10, 11, 28, 15))
    expect(resolution.status).toBe('available')
    if (resolution.status !== 'available') throw new Error('Expected partial coverage.')
    const semanticInput = toGuidanceSemanticInput(resolution, {
      validFromUtc: '2026-08-22T12:00:00.000Z',
      boundaries: [{ atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' }],
    })
    expect(
      semanticInput.evidence.find((item) => item.source.kind === 'coverage-gap'),
    ).toMatchObject({
      semanticClaim: 'No v1 operational profile for Hexagram 15, 11, 10',
      provenance: { status: 'unavailable' },
    })
  })

  it('changes only subordinate maturity when Macro Hour changes', () => {
    const chu = resolveTemporalSemantics(input(1, 53, 28, 57, 'chu'))
    const zheng = resolveTemporalSemantics(input(1, 53, 28, 57, 'zheng'))
    expect(chu.status).toBe('available')
    expect(zheng.status).toBe('available')
    if (chu.status !== 'available' || zheng.status !== 'available') {
      throw new Error('Expected available semantics.')
    }

    expect(zheng.resolutionId).not.toBe(chu.resolutionId)
    expect(zheng.primaryCurrent).toEqual(chu.primaryCurrent)
    expect(zheng.field).toEqual(chu.field)
    expect(chu.hourMaturity).toMatchObject({ macroHour: 'chu', semantic: 'entering' })
    expect(zheng.hourMaturity).toMatchObject({ macroHour: 'zheng', semantic: 'established' })
    expect(chu.hourMaturity.supportedVerbs).toContain('set')
    expect(zheng.hourMaturity.supportedVerbs).toContain('steady')
  })

  it('carries Macro evidence into guidance without a Micro evidence kind', () => {
    const resolution = resolveTemporalSemantics(input(1, 53, 28, 57))
    expect(resolution.status).toBe('available')
    if (resolution.status !== 'available') throw new Error('Expected available semantics.')
    const bundle = createGuidanceBundle(
      toGuidanceSemanticInput(resolution, {
        validFromUtc: '2026-08-22T12:00:00.000Z',
        boundaries: [{ atUtc: '2026-08-22T13:00:00.000Z', reason: 'macro-hour-change' }],
      }),
    )

    expect(
      bundle.synthesis.evidence.value.some((item) => item.source.value.kind === 'macro-hour'),
    ).toBe(true)
    expect(bundle.synthesis.evidence.value.map((item) => item.source.value.kind)).not.toContain(
      'micro-hour',
    )
    expect(bundle.synthesis.operativeWork.hourMaturity.value.macroHour).toBe('chu')
  })

  it('adapts a resolved field into one coherent validated guidance bundle', () => {
    const resolution = resolveTemporalSemantics(input(1, 53, 28, 57))
    expect(resolution.status).toBe('available')
    if (resolution.status !== 'available') throw new Error('Expected an available resolution.')
    const bundle = createGuidanceBundle(
      toGuidanceSemanticInput(resolution, {
        validFromUtc: '2026-08-22T12:00:00.000Z',
        boundaries: [{ atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' }],
      }),
    )
    expect(bundle.status).toBe('available')
    expect(bundle.synthesis.response.relation.value).toBe(resolution.primaryCurrent.relation)
    expect(bundle.synthesis.response.effortLevel.value).toBe(resolution.primaryCurrent.effortLevel)
    expect(resolution.field.compatibleIntentionIds).toContain(bundle.selectedIntention.id)
    expect(bundle.synthesis.evidence.value[0]?.provenance.value.sourceLabel).toMatch(
      /Canonical identity kept separate/i,
    )
  })

  it.each([1, 2, 12, 18, 28, 48, 52, 53, 57, 61, 62, 63, 64])(
    'produces coherent end-to-end guidance for MVP day profile %i',
    (hexagramNumber) => {
      const resolution = resolveTemporalSemantics(
        input(hexagramNumber, hexagramNumber, hexagramNumber, hexagramNumber),
      )
      expect(resolution.status).toBe('available')
      if (resolution.status !== 'available') throw new Error('Expected available semantics.')
      expect(() =>
        createGuidanceBundle(
          toGuidanceSemanticInput(resolution, {
            validFromUtc: '2026-08-22T12:00:00.000Z',
            boundaries: [
              { atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' },
            ],
          }),
        ),
      ).not.toThrow()
    },
  )

  it('rejects duplicate profiles, unknown intentions, and verb contradictions', () => {
    const base = getHexagramSemanticRecords()[0]?.profile
    expect(base).toBeDefined()
    const invalid = {
      ...base!,
      compatibleIntentionIds: ['unknown-intention'],
      preferredVerbs: ['force'],
      forbiddenVerbs: ['force'],
      version: HEXAGRAM_SEMANTIC_PROFILE_VERSION,
    } satisfies HexagramSemanticProfile
    const result = validateHexagramSemanticProfiles([invalid, invalid])
    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['hexagramNumber', 'compatibleIntentionIds', 'preferredVerbs']),
    )
  })

  it('uses a conservative day-compatible effort when scales share no effort level', () => {
    const records = getHexagramSemanticRecords()
    const scale = (scope: TemporalScope, number: number): ResolvedTemporalScale => {
      const record = records.find((candidate) => candidate.hexagram.number === number)
      if (!record) throw new Error(`Missing fixture profile ${number}.`)
      return {
        scope,
        hexagramNumber: number,
        hexagramName: record.hexagram.nameEnglish,
        canonicalSourceLabel: record.hexagram.sourceLabel,
        temporalSourceLabel: 'Test fixture',
        profile: record.profile,
      }
    }
    const hour = scale('hour', 52)
    const composition = composeTemporalSemantics([
      scale('day', 1),
      { ...hour, profile: { ...hour.profile, compatibleEffortLevels: ['minimal'] } },
    ])
    expect(composition.effortLevel).toBe('measured')
    expect(composition.conflicts.some((conflict) => conflict.kind === 'effort')).toBe(true)
  })
})
