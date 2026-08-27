import { describe, expect, it } from 'vitest'

import {
  ELEMENTAL_EXECUTION_LIBRARY,
  INTENTION_LEXICON,
  createGuidanceBundle,
  createUnavailableGuidanceBundle,
  isGuidanceExpired,
  renderOltr,
  resolveHourMaturity,
  resolveGuidanceSynthesis,
  selectGuidanceIntention,
  validateExecution,
  validateGuidanceBundle,
  validateIntention,
  validateOltr,
} from '../index'
import type { AvailableGuidanceBundle } from '../types'
import { createGuidanceFixture } from './fixtures'

const expectedRelations = {
  emergence: 'follow',
  excess: 'contain',
  deficiency: 'counterbalance',
  withdrawal: 'withdraw',
  completion: 'complete',
  repair: 'transform',
  threshold: 'wait',
} as const

const expectCompleteRankings = (bundle: AvailableGuidanceBundle) => {
  expect(bundle.intentions).toHaveLength(3)
  expect(bundle.intentions.map((selection) => selection.rank)).toEqual([1, 2, 3])
  expect(new Set(bundle.intentions.map((selection) => selection.definition.id)).size).toBe(3)

  expect(bundle.executions).toHaveLength(3)
  expect(bundle.executions.map((selection) => selection.rank)).toEqual([1, 2, 3])
  expect(new Set(bundle.executions.map((selection) => selection.definition.category)).size).toBe(3)
  const activeElement = bundle.synthesis.operativeWork.activeOrgan.value.element
  expect(
    bundle.executions.some(
      (selection) => selection.definition.category === activeElement && selection.activeOrganMatch,
    ),
  ).toBe(true)
}

describe('Guidance Output Layer', () => {
  it.each(Object.entries(expectedRelations))(
    'resolves the %s fixture to %s',
    (condition, relation) => {
      const bundle = createGuidanceBundle(
        createGuidanceFixture(condition as keyof typeof expectedRelations),
      )
      expect(bundle.synthesis.response.relation.value).toBe(relation)
      expectCompleteRankings(bundle)
      expect(validateGuidanceBundle(bundle).valid).toBe(true)
    },
  )

  it('expresses completion before withdrawal without creating a second response relation', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('completion'))
    expect(bundle.synthesis.response.relation.value).toBe('complete')
    expect(bundle.oltr.text).toMatch(/complete.+then withdraw/i)
    expect(bundle.synthesis.response.release.value).toBe('high')
  })

  it('renders exactly one validated semicolon sentence within the word limit', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('emergence'))
    const result = validateOltr(bundle.oltr.text)
    expect(result.valid).toBe(true)
    expect(bundle.oltr.text.match(/;/g)).toHaveLength(1)
    expect(bundle.oltr.text.match(/[.!?]/g)).toHaveLength(1)
  })

  it('uses Macro maturity as a subordinate onset-versus-continuation modifier', () => {
    const chuInput = createGuidanceFixture('emergence')
    const zhengInput = {
      ...chuInput,
      synthesisId: `${chuInput.synthesisId}-zheng`,
      operativeWork: {
        ...chuInput.operativeWork,
        hourMaturity: resolveHourMaturity('follow', {
          macroHour: 'zheng',
          macroSemantic: 'established',
        }),
      },
    }
    const chu = createGuidanceBundle(chuInput)
    const zheng = createGuidanceBundle(zhengInput)

    expect(chu.synthesis.response.relation.value).toBe('follow')
    expect(zheng.synthesis.response.relation.value).toBe('follow')
    expect(zheng.synthesis.response.effortLevel.value).toBe(
      chu.synthesis.response.effortLevel.value,
    )
    expect(chu.oltr.text).toMatch(/; follow /i)
    expect(zheng.oltr.text).toMatch(/; continue /i)
  })

  it('rejects pronouns, malformed sentence structure, excess words, and unsafe language', () => {
    const pronouns = validateOltr(
      'The field is holding a clear threshold; you preserve the boundary until another useful signal arrives.',
    )
    const malformed = validateOltr(
      'The field is holding a clear threshold. Preserve the boundary until another useful signal arrives.',
    )
    const tooLong = validateOltr(
      'The field is holding a very clear and carefully measured threshold for the present moment; preserve every available boundary while delaying all fresh commitments until another completely verified semantic classification becomes visibly available.',
    )
    const unsafe = validateOltr(
      'The field is holding a consequential threshold; hold the breath and change medication before the next boundary.',
    )

    expect(pronouns.issues.some((issue) => issue.code === 'pronoun')).toBe(true)
    expect(malformed.issues.some((issue) => issue.code === 'format')).toBe(true)
    expect(tooLong.issues.some((issue) => issue.code === 'word-count')).toBe(true)
    expect(unsafe.issues.some((issue) => issue.code === 'unsafe')).toBe(true)
  })

  it.each(Object.keys(expectedRelations))(
    'uses a deterministic validated fallback for %s when candidate banks are empty',
    (condition) => {
      const synthesis = resolveGuidanceSynthesis(
        createGuidanceFixture(condition as keyof typeof expectedRelations),
      )
      const first = renderOltr(synthesis, { fieldPhrases: [], responsePhrases: [] })
      const second = renderOltr(synthesis, { fieldPhrases: [], responsePhrases: [] })
      expect(first.text).toBe(second.text)
      expect(validateOltr(first.text, synthesis.response.supportedVerbs.value).valid).toBe(true)
    },
  )

  it.each([
    ['deficiency', 'dense', 'building', /\b(?:Fragmented|Resting)\b/i],
    ['threshold', 'pressurized', 'building', /\b(?:Settled|Threshold movement)\b/i],
    ['withdrawal', 'fragmented', 'resting', /\b(?:Settled|Releasing movement)\b/i],
  ] as const)(
    'does not render specialized %s field language for mismatched texture or lunar mode',
    (condition, dominantTexture, lunarMode, contradictedLanguage) => {
      const input = createGuidanceFixture(condition)
      const synthesis = resolveGuidanceSynthesis({
        ...input,
        field: { ...input.field, dominantTexture, lunarMode },
      })
      const output = renderOltr(synthesis)

      expect(output.text).not.toMatch(contradictedLanguage)
      expect(validateOltr(output.text, synthesis.response.supportedVerbs.value).valid).toBe(true)
    },
  )

  it('selects exactly three controlled, compatible, uniquely ranked intentions', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('repair'))
    expect(INTENTION_LEXICON).toContain(bundle.selectedIntention)
    expectCompleteRankings(bundle)
    expect(new Set(bundle.intentions.map((item) => item.definition.englishLabel)).size).toBe(3)
    expect(validateIntention(bundle.selectedIntention, bundle.synthesis).valid).toBe(true)
  })

  it('keeps the controlled intention lexicon complete and versioned', () => {
    expect(INTENTION_LEXICON).toHaveLength(15)
    expect(INTENTION_LEXICON.map((item) => item.character)).toEqual([
      '定',
      '守',
      '隨',
      '謙',
      '柔',
      '節',
      '中',
      '靜',
      '貞',
      '通',
      '養',
      '明',
      '和',
      '收',
      '行',
    ])
    expect(new Set(INTENTION_LEXICON.map((item) => item.version)).size).toBe(1)
  })

  it('carries semantic and output versions in the synthesis and bundle', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('emergence'))
    expect(bundle.synthesis.version).toBe(bundle.versions.guidanceSynthesis)
    expect(bundle.synthesis.sourceSemanticVersion).toBe(bundle.versions.temporalSemantics)
    expect(bundle.synthesis.environmentVersion).toBe(bundle.versions.environment)
    expect(bundle.synthesis.id.version).toBe(bundle.versions.guidanceSynthesis)
    expect(bundle.synthesis.coverage).toMatchObject({
      value: 'complete',
      version: bundle.versions.temporalSemantics,
    })
    expect(bundle.synthesis.missingProfileNumbers.value).toEqual([])
    expect(bundle.synthesis.conflicts.value).toEqual([])
    expect(bundle.synthesis.field.primaryDirection.version).toBe(bundle.versions.temporalSemantics)
    expect(bundle.synthesis.response.relation.version).toBe(bundle.versions.temporalSemantics)
    expect(bundle.synthesis.evidence.value[0]?.semanticClaim.version).toBe(
      bundle.versions.guidanceSynthesis,
    )
    expect(bundle.synthesis.operativeWork.activeOrgan.version).toBe(bundle.versions.environment)
    expect(bundle.oltr.version).toBe(bundle.versions.oltrRenderer)
    expect(bundle.selectedIntention.version).toBe(bundle.versions.intentionLexicon)
    expect(bundle.selectedExecution.version).toBe(bundle.versions.executionLibrary)
  })

  it('rejects a stale active or unavailable bundle version manifest', () => {
    const available = createGuidanceBundle(createGuidanceFixture('emergence'))
    const staleAvailable = {
      ...available,
      versions: { ...available.versions, validator: 'stale-validator@0' },
    }
    const unavailable = createUnavailableGuidanceBundle({
      synthesisId: 'unavailable-version-test',
      validFromUtc: '2026-08-22T12:00:00.000Z',
      boundaries: [{ atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' }],
      reason: 'Test input unavailable.',
      sourceLabel: 'Guidance version test',
    })
    const staleUnavailable = {
      ...unavailable,
      versions: { ...unavailable.versions, validator: 'stale-validator@0' },
    }
    const staleUnavailablePrimary = {
      ...unavailable,
      primaryCurrent: {
        ...unavailable.primaryCurrent,
        id: { ...unavailable.primaryCurrent.id, version: 'stale-temporal@0' },
      },
    }
    const staleOrganMethodology = {
      ...available,
      synthesis: {
        ...available.synthesis,
        operativeWork: {
          ...available.synthesis.operativeWork,
          activeOrgan: {
            ...available.synthesis.operativeWork.activeOrgan,
            value: {
              ...available.synthesis.operativeWork.activeOrgan.value,
              methodologyId: 'stale-environment@0',
            },
          },
        },
      },
    }

    for (const result of [
      validateGuidanceBundle(staleAvailable),
      validateGuidanceBundle(staleUnavailable),
      validateGuidanceBundle(staleUnavailablePrimary),
      validateGuidanceBundle(staleOrganMethodology),
    ]) {
      expect(result.valid).toBe(false)
      expect(result.issues.some((issue) => issue.code === 'version-mismatch')).toBe(true)
    }
  })

  it('rejects an intention incompatible with the response relation', () => {
    const synthesis = resolveGuidanceSynthesis(createGuidanceFixture('threshold'))
    const executionIntention = INTENTION_LEXICON.find(
      (definition) => definition.id === 'xing-timely-execution',
    )
    expect(executionIntention).toBeDefined()
    expect(validateIntention(executionIntention!, synthesis).valid).toBe(false)
  })

  it('changes only intention and execution when an alternative is selected', () => {
    const original = createGuidanceBundle(createGuidanceFixture('emergence'))
    const alternative = original.intentions[1]?.definition
    expect(alternative).toBeDefined()
    const updated = selectGuidanceIntention(original, alternative!.id)
    expect(updated.status).toBe('available')
    if (updated.status !== 'available') throw new Error('Expected available guidance.')
    expect(updated.selectedIntention.id).toBe(alternative!.id)
    expect(updated.synthesisId).toBe(original.synthesisId)
    expect(updated.synthesis).toBe(original.synthesis)
    expect(updated.primaryCurrent).toBe(original.primaryCurrent)
    expect(updated.oltr).toBe(original.oltr)
    expect(updated.validityWindow).toBe(original.validityWindow)
    expect(updated.executions).not.toBe(original.executions)
    expectCompleteRankings(updated)
    expect(validateGuidanceBundle(updated).valid).toBe(true)
  })

  it('validates the five Elemental work domains and rejects unsafe, prescriptive, or repeated copy', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('threshold'))
    expect(ELEMENTAL_EXECUTION_LIBRARY).toHaveLength(5)
    expect(ELEMENTAL_EXECUTION_LIBRARY.map((definition) => definition.category)).toEqual([
      'wood',
      'fire',
      'earth',
      'metal',
      'water',
    ])
    expect(
      ELEMENTAL_EXECUTION_LIBRARY.every(
        (definition) =>
          definition.taskDomains.length === 5 &&
          validateExecution(
            definition,
            bundle.synthesis,
            bundle.selectedIntention,
            bundle.oltr.text,
          ).valid,
      ),
    ).toBe(true)

    const base = ELEMENTAL_EXECUTION_LIBRARY[0]
    expect(base).toBeDefined()
    const unsafe = {
      ...base!,
      description: 'Medical diagnosis and medication treatment for the current condition.',
    }
    const prescriptive = {
      ...base!,
      description: 'Complete one assigned task now and report the result.',
    }
    const repeatedOltr = {
      ...base!,
      description: bundle.oltr.text,
    }

    expect(
      validateExecution(unsafe, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'unsafe',
      ),
    ).toBe(true)
    expect(
      validateExecution(prescriptive, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'format',
      ),
    ).toBe(true)
    expect(
      validateExecution(
        repeatedOltr,
        bundle.synthesis,
        bundle.selectedIntention,
        bundle.oltr.text,
      ).issues.some((issue) => issue.code === 'repetition'),
    ).toBe(true)
  })

  it('rejects unsupported claims and repeated cross-output language', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('threshold'))
    const unsupportedBundle = {
      ...bundle,
      oltr: {
        ...bundle.oltr,
        text: 'Conditions are holding at a threshold the universe wants; preserve the boundary and delay fresh commitments.',
      },
    }
    const repeatedIntention = {
      ...bundle.selectedIntention,
      shortDefinition: bundle.selectedExecution.description,
    }
    const repeatedBundle = { ...bundle, selectedIntention: repeatedIntention }

    expect(
      validateGuidanceBundle(unsupportedBundle).issues.some(
        (issue) => issue.code === 'unsupported-claim',
      ),
    ).toBe(true)
    expect(
      validateGuidanceBundle(repeatedBundle).issues.some((issue) => issue.code === 'repetition'),
    ).toBe(true)
  })

  it('rejects detached selections, invalid active-organ flags, incompatible ranked intentions, and version drift', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('emergence'))
    const detachedSelection = {
      ...bundle,
      selectedIntention: { ...bundle.selectedIntention },
      selectedExecution: { ...bundle.selectedExecution },
    }
    expect(
      validateGuidanceBundle(detachedSelection).issues.filter(
        (issue) => issue.code === 'selection',
      ),
    ).toHaveLength(2)

    const firstExecution = bundle.executions[0]
    expect(firstExecution).toBeDefined()
    const invalidActiveFlag = {
      ...bundle,
      executions: [
        { ...firstExecution!, activeOrganMatch: !firstExecution!.activeOrganMatch },
        ...bundle.executions.slice(1),
      ],
    }
    expect(
      validateGuidanceBundle(invalidActiveFlag).issues.some(
        (issue) => issue.code === 'active-organ-coverage',
      ),
    ).toBe(true)

    const incompatible = INTENTION_LEXICON.find(
      (definition) => !definition.compatibleRelations.includes('follow'),
    )
    expect(incompatible).toBeDefined()
    const invalidRankedIntention = {
      ...bundle,
      intentions: [
        { ...bundle.intentions[0]!, definition: incompatible! },
        ...bundle.intentions.slice(1),
      ],
    }
    expect(
      validateGuidanceBundle(invalidRankedIntention).issues.some(
        (issue) => issue.code === 'incompatible-relation',
      ),
    ).toBe(true)

    const versionDrift = {
      ...bundle,
      synthesis: { ...bundle.synthesis, environmentVersion: 'stale-environment@0' },
    }
    expect(
      validateGuidanceBundle(versionDrift).issues.some(
        (issue) => issue.code === 'version-mismatch',
      ),
    ).toBe(true)
  })

  it('expires at the next semantic boundary rather than on a minute interval', () => {
    const bundle = createGuidanceBundle({
      ...createGuidanceFixture('emergence'),
      boundaries: [
        { atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' },
        { atUtc: '2026-08-22T13:15:00.000Z', reason: 'semantic-classification-change' },
      ],
    })
    expect(bundle.validityWindow.validUntilUtc).toBe('2026-08-22T13:15:00.000Z')
    expect(bundle.validityWindow.boundaryReason).toBe('semantic-classification-change')
    expect(isGuidanceExpired(bundle, new Date('2026-08-22T13:14:59.999Z'))).toBe(false)
    expect(isGuidanceExpired(bundle, new Date('2026-08-22T13:15:00.000Z'))).toBe(true)
  })

  it('treats Macro Hour, but not a Micro interval, as a validity boundary', () => {
    const bundle = createGuidanceBundle({
      ...createGuidanceFixture('emergence'),
      boundaries: [
        { atUtc: '2026-08-22T13:00:00.000Z', reason: 'macro-hour-change' },
        { atUtc: '2026-08-22T14:00:00.000Z', reason: 'shichen-change' },
      ],
    })

    expect(bundle.validityWindow).toMatchObject({
      validUntilUtc: '2026-08-22T13:00:00.000Z',
      boundaryReason: 'macro-hour-change',
    })
  })
})
