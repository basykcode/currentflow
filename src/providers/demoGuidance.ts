import { createGuidanceBundle } from '@/domain/guidance/guidanceEngine'
import { INTENTION_LEXICON } from '@/domain/guidance/intention/lexicon'
import { resolveHourMaturity } from '@/domain/guidance/semantic-resolver/hourMaturity'
import { getResponseRelationDefinition } from '@/domain/guidance/synthesis/responseRelation'
import {
  GUIDANCE_ENVIRONMENT_VERSION,
  TEMPORAL_SEMANTICS_VERSION,
} from '@/domain/guidance/synthesis/semanticVersion'

export const createDemoGuidance = (at: Date) =>
  createGuidanceBundle({
    synthesisId: `demo-guidance-${at.toISOString()}`,
    semanticVersion: TEMPORAL_SEMANTICS_VERSION,
    environmentVersion: GUIDANCE_ENVIRONMENT_VERSION,
    coverage: 'complete',
    missingProfileNumbers: [],
    conflicts: [],
    condition: 'emergence',
    primaryCurrent: {
      id: 'demo-emergence',
      label: 'Supported emergence',
      status: 'demo',
      sourceLabel: 'Curated guidance interface fixture · not calculated',
    },
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
      dayTheme: {
        label: 'Develop the supported opening',
        strategicVectors: ['advance', 'adapt'],
        somaticVectors: ['maintain-rhythm'],
      },
      hourTheme: {
        label: 'Keep movement responsive',
        strategicVectors: ['adapt', 'clarify'],
        somaticVectors: ['allow-space'],
      },
      hourMaturity: resolveHourMaturity('follow', {
        macroHour: 'chu',
        macroSemantic: 'entering',
      }),
      activeOrgan: {
        key: 'liver',
        nameEnglish: 'Liver',
        nameChinese: '肝',
        element: 'wood',
        sourceLabel: 'Curated guidance interface fixture · not calculated',
        methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
      },
      backgroundThemes: [
        {
          kind: 'other',
          label: 'Forward seasonal support',
          strategicVectors: ['advance'],
          somaticVectors: ['maintain-rhythm'],
        },
        {
          kind: 'other',
          label: 'Adaptive circulation',
          strategicVectors: ['adapt'],
          somaticVectors: ['restore-circulation'],
        },
      ],
    },
    resolvedResponse: {
      relation: 'follow',
      effortLevel: 'measured',
      strategicVectors: getResponseRelationDefinition('follow').strategicVectors,
      somaticVectors: getResponseRelationDefinition('follow').somaticVectors,
      compatibleIntentionIds: INTENTION_LEXICON.filter((intention) =>
        intention.compatibleRelations.includes('follow'),
      ).map((intention) => intention.id),
      supportedVerbs: getResponseRelationDefinition('follow').supportedVerbs,
      forbiddenVerbs: getResponseRelationDefinition('follow').forbiddenVerbs,
    },
    evidence: [
      {
        source: {
          id: 'demo-guidance-semantics',
          label: 'Guidance interface fixture',
          kind: 'other',
        },
        semanticClaim: 'A supported opening is available for measured movement.',
        weight: 'primary',
        provenance: {
          status: 'demo',
          sourceLabel: 'Curated guidance interface fixture · not calculated',
          methodologyId: TEMPORAL_SEMANTICS_VERSION,
          sourceIds: ['demo-guidance-semantics'],
        },
      },
    ],
    validFromUtc: at.toISOString(),
    boundaries: [
      {
        atUtc: new Date(at.getTime() + 2 * 60 * 60 * 1_000).toISOString(),
        reason: 'earthly-branch-hour-change',
      },
    ],
  })
