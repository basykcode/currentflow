import { describe, expect, it } from 'vitest'

import { getHexagram } from '@/domain/astrology/hexagrams'
import type { TemporalHexagram, TemporalScope } from '@/domain/astrology/types'
import type { MacroHour } from '@/domain/time/chu-zheng-ke'

import { createGuidanceBundle } from '../../guidanceEngine'
import { validateOltr } from '../../oltr/validator'
import type { GuidanceEnvironmentInput } from '../../types'
import { GUIDANCE_ENVIRONMENT_VERSION } from '../../synthesis/semanticVersion'
import { composeTemporalSemantics, toGuidanceSemanticInput } from '../composition'
import { getHexagramSemanticRecords } from '../hexagrams/registry'
import { validateHexagramSemanticProfiles } from '../hexagrams/validation'
import { resolveTemporalSemantics } from '../resolver'
import type { HexagramSemanticProfile, ResolvedTemporalScale } from '../types'
import { HEXAGRAM_SEMANTIC_PROFILE_VERSION } from '../versions'

const ACTIVE_ORGANS = [
  { key: 'liver', nameEnglish: 'Liver', nameChinese: '肝', element: 'wood' },
  { key: 'heart', nameEnglish: 'Heart', nameChinese: '心', element: 'fire' },
  { key: 'spleen', nameEnglish: 'Spleen', nameChinese: '脾', element: 'earth' },
  { key: 'lung', nameEnglish: 'Lung', nameChinese: '肺', element: 'metal' },
  { key: 'kidney', nameEnglish: 'Kidney', nameChinese: '腎', element: 'water' },
] as const satisfies readonly Pick<
  GuidanceEnvironmentInput['activeOrgan'],
  'key' | 'nameEnglish' | 'nameChinese' | 'element'
>[]

const environment = (seed = 0): GuidanceEnvironmentInput => {
  const organ = ACTIVE_ORGANS[seed % ACTIVE_ORGANS.length]
  if (!organ) throw new Error('The deterministic test environment requires an active Organ.')
  const activeOrgan: GuidanceEnvironmentInput['activeOrgan'] = Object.freeze({
    ...organ,
    sourceLabel: 'Deterministic guidance environment fixture',
    methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
  })

  return Object.freeze({
    version: GUIDANCE_ENVIRONMENT_VERSION,
    activeOrgan,
    evidence: Object.freeze([
      {
        source: {
          id: `active-organ-${activeOrgan.key}`,
          label: `Active Organ · ${activeOrgan.nameEnglish}`,
          kind: 'active-organ' as const,
        },
        semanticClaim: `${activeOrgan.nameEnglish} supplies the ${activeOrgan.element} test correspondence.`,
        weight: 'supporting' as const,
        provenance: {
          status: 'computed' as const,
          sourceLabel: activeOrgan.sourceLabel,
          methodologyId: activeOrgan.methodologyId,
          sourceIds: [`test-organ-${activeOrgan.key}`],
        },
      },
    ]),
  })
}

const adapterContext = (seed = 0) => ({
  validFromUtc: '2026-08-22T12:00:00.000Z',
  boundaries: [
    { atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' as const },
  ],
  environment: environment(seed),
})

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
  it('registers all 64 reviewed Current profiles through canonical hexagram identities', () => {
    const records = getHexagramSemanticRecords()
    expect(records.map((record) => record.hexagram.number)).toEqual(
      Array.from({ length: 64 }, (_, index) => index + 1),
    )
    expect(records.every((record) => record.profile.review.status === 'spec-reviewed')).toBe(true)
    expect(records.every((record) => record.profile.review.reviewedBy.length === 0)).toBe(true)
    expect(
      records.every((record) =>
        record.profile.notes.some((note) => note.includes('Current operational profile')),
      ),
    ).toBe(true)
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

  it('resolves every canonical self-composition with complete profile coverage', () => {
    for (let hexagramNumber = 1; hexagramNumber <= 64; hexagramNumber += 1) {
      const resolution = resolveTemporalSemantics(
        input(hexagramNumber, hexagramNumber, hexagramNumber, hexagramNumber),
      )
      expect(resolution.status, `Hexagram ${hexagramNumber}`).toBe('available')
      if (resolution.status !== 'available') continue
      expect(resolution.coverage, `Hexagram ${hexagramNumber}`).toBe('complete')
      expect(resolution.missingProfileNumbers, `Hexagram ${hexagramNumber}`).toEqual([])
    }
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
        ...adapterContext(),
        boundaries: [{ atUtc: '2026-08-22T13:00:00.000Z', reason: 'macro-hour-change' }],
      }),
    )

    expect(
      bundle.synthesis.evidence.value.some((item) => item.source.value.kind === 'macro-hour'),
    ).toBe(true)
    expect(bundle.synthesis.evidence.value.map((item) => item.source.value.kind)).not.toContain(
      'micro-hour',
    )
    expect(bundle.synthesis.evidence.value.map((item) => item.source.value.kind)).toContain(
      'active-organ',
    )
    expect(bundle.synthesis.operativeWork.hourMaturity.value.macroHour).toBe('chu')
  })

  it('adapts a resolved field into one coherent validated guidance bundle', () => {
    const resolution = resolveTemporalSemantics(input(1, 53, 28, 57))
    expect(resolution.status).toBe('available')
    if (resolution.status !== 'available') throw new Error('Expected an available resolution.')
    const context = adapterContext(4)
    const bundle = createGuidanceBundle(toGuidanceSemanticInput(resolution, context))
    expect(bundle.status).toBe('available')
    expect(bundle.synthesis.response.relation.value).toBe(resolution.primaryCurrent.relation)
    expect(bundle.synthesis.response.effortLevel.value).toBe(resolution.primaryCurrent.effortLevel)
    expect(bundle.intentions).toHaveLength(3)
    expect(bundle.executions).toHaveLength(3)
    expect(new Set(bundle.executions.map((selection) => selection.definition.category)).size).toBe(
      3,
    )
    expect(
      bundle.executions.some(
        (selection) =>
          selection.activeOrganMatch &&
          selection.definition.category === context.environment.activeOrgan.element,
      ),
    ).toBe(true)
    expect(bundle.synthesis.operativeWork.activeOrgan.value).toEqual(
      context.environment.activeOrgan,
    )
    expect(bundle.synthesis.evidence.value[0]?.provenance.value.sourceLabel).toMatch(
      /Canonical identity kept separate/i,
    )
  })

  it('closes every day/hour pair through both Macro modes without a stored state matrix', () => {
    const macroModes: readonly MacroHour[] = ['chu', 'zheng']
    const observedOltr = new Set<string>()
    let generatedCases = 0

    for (let day = 1; day <= 64; day += 1) {
      for (let hour = 1; hour <= 64; hour += 1) {
        for (const macroHour of macroModes) {
          const resolution = resolveTemporalSemantics(input(1, 2, day, hour, macroHour))
          const label = `day ${day}, hour ${hour}, Macro ${macroHour}`
          if (resolution.status !== 'available' || resolution.coverage !== 'complete') {
            throw new Error(`${label} did not resolve with complete semantic coverage.`)
          }

          const context = adapterContext(day + hour + (macroHour === 'zheng' ? 1 : 0))
          const bundle = createGuidanceBundle(
            toGuidanceSemanticInput(resolution, {
              ...context,
              synthesisId: `${resolution.resolutionId}-organ-${context.environment.activeOrgan.key}`,
            }),
          )
          const activeElement = context.environment.activeOrgan.element
          const validOltr = validateOltr(
            bundle.oltr.text,
            bundle.synthesis.response.supportedVerbs.value,
          ).valid

          if (
            bundle.intentions.length !== 3 ||
            new Set(bundle.intentions.map((selection) => selection.definition.id)).size !== 3 ||
            bundle.executions.length !== 3 ||
            new Set(bundle.executions.map((selection) => selection.definition.category)).size !==
              3 ||
            !bundle.executions.some(
              (selection) =>
                selection.activeOrganMatch && selection.definition.category === activeElement,
            ) ||
            !validOltr ||
            bundle.oltr.text.match(/;/g)?.length !== 1
          ) {
            throw new Error(`${label} did not close through the v0 guidance contract.`)
          }

          observedOltr.add(bundle.oltr.text)
          generatedCases += 1
        }
      }
    }

    expect(generatedCases).toBe(64 * 64 * 2)
    expect(observedOltr.size).toBeGreaterThan(14)
  }, 30_000)

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
