import type {
  BackgroundTheme,
  GuidanceCondition,
  GuidanceSemanticInput,
  SemanticTheme,
} from '../types'
import { INTENTION_LEXICON } from '../intention/lexicon'
import { resolveEffortLevel } from '../synthesis/effortResolver'
import {
  getResponseRelationDefinition,
  resolveResponseRelation,
} from '../synthesis/responseRelation'
import { TEMPORAL_SEMANTICS_VERSION } from '../synthesis/semanticVersion'

const theme = (
  label: string,
  strategicVectors: SemanticTheme['strategicVectors'],
  somaticVectors: SemanticTheme['somaticVectors'],
): SemanticTheme => ({ label, strategicVectors, somaticVectors })

const background = (
  kind: BackgroundTheme['kind'],
  label: string,
  strategicVectors: SemanticTheme['strategicVectors'],
  somaticVectors: SemanticTheme['somaticVectors'],
): BackgroundTheme => ({ kind, label, strategicVectors, somaticVectors })

const CONFIG_BY_CONDITION: Readonly<
  Record<GuidanceCondition, Pick<GuidanceSemanticInput, 'field' | 'operativeWork'>>
> = {
  emergence: {
    field: {
      primaryDirection: 'forward',
      secondaryDirection: 'circulating',
      dominantTexture: 'clear',
      lunarMode: 'emerging',
      fieldRelationship: 'coherent',
      dominantImageFamily: 'opening',
      tensionDescription: 'Supported movement is available without requiring acceleration.',
    },
    operativeWork: {
      dayTheme: theme('Develop the supported opening', ['advance', 'adapt'], ['maintain-rhythm']),
      hourModifier: theme('Keep movement responsive', ['adapt', 'clarify'], ['allow-space']),
      backgroundThemes: [
        background('solar', 'Forward seasonal support', ['advance'], ['maintain-rhythm']),
        background('wu-yun-liu-qi', 'Adaptive circulation', ['adapt'], ['restore-circulation']),
      ],
    },
  },
  excess: {
    field: {
      primaryDirection: 'holding',
      secondaryDirection: 'stabilizing',
      dominantTexture: 'pressurized',
      lunarMode: 'culminating',
      fieldRelationship: 'excessive',
      dominantImageFamily: 'container',
      tensionDescription: 'Movement exceeds the field capacity for useful conversion.',
    },
    operativeWork: {
      dayTheme: theme('Limit surplus motion', ['limit', 'simplify'], ['reduce-pace']),
      hourModifier: theme('Steady what remains', ['stabilize'], ['ground']),
      backgroundThemes: [
        background('solar', 'Hold proportion', ['limit'], ['settle']),
        background('wu-yun-liu-qi', 'Contain pressure', ['stabilize'], ['ground']),
      ],
    },
  },
  deficiency: {
    field: {
      primaryDirection: 'stabilizing',
      secondaryDirection: 'inward',
      dominantTexture: 'fragmented',
      lunarMode: 'resting',
      fieldRelationship: 'deficient',
      dominantImageFamily: 'shelter',
      tensionDescription: 'One missing support prevents coherent movement.',
    },
    operativeWork: {
      dayTheme: theme('Supply practical support', ['nourish', 'stabilize'], ['ground']),
      hourModifier: theme('Clarify the missing piece', ['clarify'], ['allow-space']),
      backgroundThemes: [
        background('solar', 'Conserve available support', ['stabilize'], ['settle']),
        background('wu-yun-liu-qi', 'Restore proportion', ['nourish'], ['soften']),
      ],
    },
  },
  completion: {
    field: {
      primaryDirection: 'closing',
      secondaryDirection: 'releasing',
      dominantTexture: 'ripening',
      lunarMode: 'culminating',
      fieldRelationship: 'ripening',
      dominantImageFamily: 'vessel',
      tensionDescription: 'Ripened work needs closure before new initiation.',
    },
    operativeWork: {
      dayTheme: theme('Close the ripest work', ['complete', 'release'], ['ground']),
      hourModifier: theme('Reduce remaining demands', ['simplify', 'release'], ['settle']),
      backgroundThemes: [
        background('solar', 'Conclude the cycle', ['complete'], ['maintain-rhythm']),
        background('wu-yun-liu-qi', 'Release accumulation', ['release'], ['settle']),
      ],
    },
  },
  threshold: {
    field: {
      primaryDirection: 'holding',
      secondaryDirection: 'stabilizing',
      dominantTexture: 'settled',
      lunarMode: 'threshold',
      fieldRelationship: 'threshold',
      dominantImageFamily: 'threshold',
      tensionDescription: 'The next classification is not yet settled enough for initiation.',
    },
    operativeWork: {
      dayTheme: theme('Preserve the boundary', ['pause', 'stabilize'], ['settle']),
      hourModifier: theme('Wait for clearer definition', ['clarify', 'pause'], ['allow-space']),
      backgroundThemes: [
        background('solar', 'Hold the present line', ['stabilize'], ['ground']),
        background('wu-yun-liu-qi', 'Keep the interval open', ['pause'], ['allow-space']),
      ],
    },
  },
  repair: {
    field: {
      primaryDirection: 'circulating',
      secondaryDirection: 'stabilizing',
      dominantTexture: 'dense',
      lunarMode: 'releasing',
      fieldRelationship: 'blocked',
      dominantImageFamily: 'current',
      tensionDescription: 'Accumulated friction is obstructing ordinary circulation.',
    },
    operativeWork: {
      dayTheme: theme(
        'Repair the smallest obstruction',
        ['repair', 'simplify'],
        ['restore-circulation'],
      ),
      hourModifier: theme('Keep the repair adaptable', ['adapt'], ['soften']),
      backgroundThemes: [
        background('solar', 'Restore useful motion', ['repair'], ['maintain-rhythm']),
        background(
          'wu-yun-liu-qi',
          'Release accumulated friction',
          ['simplify'],
          ['restore-circulation'],
        ),
      ],
    },
  },
  withdrawal: {
    field: {
      primaryDirection: 'inward',
      secondaryDirection: 'releasing',
      dominantTexture: 'settled',
      lunarMode: 'releasing',
      fieldRelationship: 'dispersing',
      dominantImageFamily: 'shelter',
      tensionDescription: 'Continued outward expenditure would exceed useful return.',
    },
    operativeWork: {
      dayTheme: theme('Gather attention inward', ['gather', 'release'], ['reduce-pace']),
      hourModifier: theme('Leave external demands unopened', ['pause'], ['allow-space']),
      backgroundThemes: [
        background('solar', 'Reduce outward reach', ['gather'], ['settle']),
        background('wu-yun-liu-qi', 'Release surplus demand', ['release'], ['reduce-pace']),
      ],
    },
  },
}

export const createGuidanceFixture = (condition: GuidanceCondition): GuidanceSemanticInput => ({
  synthesisId: `fixture-${condition}-20260822T120000Z`,
  semanticVersion: TEMPORAL_SEMANTICS_VERSION,
  condition,
  primaryCurrent: {
    id: `fixture-${condition}`,
    label: `${condition[0]?.toUpperCase() ?? ''}${condition.slice(1)} fixture`,
    status: 'demo',
    sourceLabel: 'Guidance engine acceptance fixture · Current formalization',
  },
  ...CONFIG_BY_CONDITION[condition],
  resolvedResponse: (() => {
    const relation = resolveResponseRelation(condition)
    const definition = getResponseRelationDefinition(relation)
    return {
      relation,
      effortLevel: resolveEffortLevel(condition),
      strategicVectors: definition.strategicVectors,
      somaticVectors: definition.somaticVectors,
      compatibleIntentionIds: INTENTION_LEXICON.filter((intention) =>
        intention.compatibleRelations.includes(relation),
      ).map((intention) => intention.id),
      supportedVerbs: definition.supportedVerbs,
      forbiddenVerbs: definition.forbiddenVerbs,
    }
  })(),
  evidence: [
    {
      source: { id: `fixture-${condition}-day`, label: 'Acceptance fixture day semantics' },
      semanticClaim: CONFIG_BY_CONDITION[condition].operativeWork.dayTheme.label,
      weight: 'primary',
      provenance: {
        status: 'demo',
        sourceLabel: 'Guidance engine acceptance fixture',
        methodologyId: TEMPORAL_SEMANTICS_VERSION,
        sourceIds: [`fixture-${condition}-day`],
      },
    },
  ],
  validFromUtc: '2026-08-22T12:00:00.000Z',
  boundaries: [{ atUtc: '2026-08-22T14:00:00.000Z', reason: 'earthly-branch-hour-change' }],
})
