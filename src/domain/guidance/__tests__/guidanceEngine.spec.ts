import { describe, expect, it } from 'vitest'

import {
  EXECUTION_ACTION_LIBRARY,
  INTENTION_LEXICON,
  createGuidanceBundle,
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
import type { ExecutionDefinition } from '../types'
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

describe('Guidance Output Layer', () => {
  it.each(Object.entries(expectedRelations))(
    'resolves the %s fixture to %s',
    (condition, relation) => {
      const bundle = createGuidanceBundle(
        createGuidanceFixture(condition as keyof typeof expectedRelations),
      )
      expect(bundle.synthesis.response.relation.value).toBe(relation)
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

  it('selects a controlled compatible intention plus distinct alternatives', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('repair'))
    expect(INTENTION_LEXICON).toContain(bundle.selectedIntention)
    expect(bundle.intentions.length).toBeGreaterThan(1)
    expect(bundle.intentions.length).toBeLessThanOrEqual(3)
    expect(new Set(bundle.intentions.map((item) => item.definition.englishLabel)).size).toBe(
      bundle.intentions.length,
    )
    expect(
      new Set(
        bundle.intentions.map(
          (item) => `${item.definition.strategicVectors[0]}:${item.definition.somaticVectors[0]}`,
        ),
      ).size,
    ).toBe(bundle.intentions.length)
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
    expect(bundle.synthesis.field.primaryDirection.version).toBe(bundle.versions.temporalSemantics)
    expect(bundle.synthesis.response.relation.version).toBe(bundle.versions.temporalSemantics)
    expect(bundle.synthesis.evidence.value[0]?.semanticClaim.version).toBe(
      bundle.versions.temporalSemantics,
    )
    expect(bundle.oltr.version).toBe(bundle.versions.oltrRenderer)
    expect(bundle.selectedIntention.version).toBe(bundle.versions.intentionLexicon)
    expect(bundle.selectedExecution.version).toBe(bundle.versions.executionLibrary)
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
    expect(updated.synthesis).toBe(original.synthesis)
    expect(updated.primaryCurrent).toBe(original.primaryCurrent)
    expect(updated.oltr).toBe(original.oltr)
    expect(updated.executions).not.toBe(original.executions)
    expect(validateGuidanceBundle(updated).valid).toBe(true)
  })

  it('rejects execution without an endpoint, above the effort limit, or with unsafe scope', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('threshold'))
    const base = EXECUTION_ACTION_LIBRARY.find((item) => item.id === 'pause-record-until-boundary')
    expect(base).toBeDefined()
    const withoutEndpoint = { ...base!, observableEndpoint: '' }
    const excessive = { ...base!, effortLevel: 'decisive' as const }
    const unsafe = {
      ...base!,
      text: 'Change medication and sign the financial contract now.',
    }

    expect(
      validateExecution(withoutEndpoint, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'execution-endpoint',
      ),
    ).toBe(true)
    expect(
      validateExecution(excessive, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'incompatible-effort',
      ),
    ).toBe(true)
    expect(
      validateExecution(unsafe, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'unsafe',
      ),
    ).toBe(true)
  })

  it('rejects more than two execution actions at runtime', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('threshold'))
    const base = EXECUTION_ACTION_LIBRARY.find((item) => item.id === 'pause-record-until-boundary')
    const invalid = { ...base!, actionCount: 3 } as unknown as ExecutionDefinition
    expect(
      validateExecution(invalid, bundle.synthesis, bundle.selectedIntention).issues.some(
        (issue) => issue.code === 'execution-action-count',
      ),
    ).toBe(true)
  })

  it('rejects contradictions, unsupported claims, and repeated cross-output language', () => {
    const bundle = createGuidanceBundle(createGuidanceFixture('threshold'))
    const contradictoryExecution = {
      ...bundle.selectedExecution,
      text: 'Rush one fresh commitment before the current boundary changes.',
    }
    const contradictoryBundle = {
      ...bundle,
      executions: bundle.executions.map((selection, index) =>
        index === 0 ? { ...selection, definition: contradictoryExecution } : selection,
      ),
      selectedExecution: contradictoryExecution,
    }
    const unsupportedBundle = {
      ...bundle,
      oltr: {
        ...bundle.oltr,
        text: 'Conditions are holding at a threshold the universe wants; preserve the boundary and delay fresh commitments.',
      },
    }
    const repeatedIntention = {
      ...bundle.selectedIntention,
      shortDefinition: bundle.selectedExecution.text,
    }
    const repeatedBundle = { ...bundle, selectedIntention: repeatedIntention }

    expect(
      validateGuidanceBundle(contradictoryBundle).issues.some(
        (issue) => issue.code === 'incompatible-relation',
      ),
    ).toBe(true)
    expect(
      validateGuidanceBundle(unsupportedBundle).issues.some(
        (issue) => issue.code === 'unsupported-claim',
      ),
    ).toBe(true)
    expect(
      validateGuidanceBundle(repeatedBundle).issues.some((issue) => issue.code === 'repetition'),
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
