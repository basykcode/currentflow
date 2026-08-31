import type { OrganMoment } from '@/domain/astrology/types'
import type {
  GlobalConditionsSnapshot,
  InstrumentDataStatus,
} from '@/domain/current-flow/celestial-instruments'
import type {
  BackgroundThemeInput,
  EvidenceStatus,
  GuidanceDirection,
  GuidanceEnvironmentInput,
  LunarMode,
  SemanticBoundary,
  SomaticVector,
  StrategicVector,
} from '@/domain/guidance/types'
import { GUIDANCE_ENVIRONMENT_VERSION } from '@/domain/guidance/synthesis/semanticVersion'

export { GUIDANCE_ENVIRONMENT_VERSION }

const LUNAR_MODE_BY_NODE = Object.freeze({
  'zhen-emergence': 'emerging',
  'dui-accumulation': 'building',
  'qian-culmination': 'culminating',
  'xun-distribution': 'releasing',
  'gen-consolidation': 'resting',
  'kun-concealment': 'threshold',
} as const satisfies Readonly<Record<string, LunarMode>>)

const SEASONAL_THEME_BY_SEASON = Object.freeze({
  Spring: {
    strategicVectors: ['advance', 'adapt', 'clarify'],
    somaticVectors: ['maintain-rhythm', 'allow-space'],
  },
  Summer: {
    strategicVectors: ['advance', 'clarify', 'complete'],
    somaticVectors: ['restore-circulation', 'maintain-rhythm'],
  },
  Autumn: {
    strategicVectors: ['complete', 'release', 'clarify'],
    somaticVectors: ['settle', 'allow-space'],
  },
  Winter: {
    strategicVectors: ['gather', 'nourish', 'pause'],
    somaticVectors: ['settle', 'reduce-pace'],
  },
} as const satisfies Readonly<
  Record<
    string,
    Readonly<{
      strategicVectors: readonly StrategicVector[]
      somaticVectors: readonly SomaticVector[]
    }>
  >
>)

const DIRECTION_BY_ANNUAL_MOVEMENT = Object.freeze({
  'Yang Returning': 'circulating',
  'Yang Emerging': 'forward',
  'Yang Growing': 'forward',
  'Yang Full': 'closing',
  'Yang Descending': 'closing',
  'Yin Emerging': 'circulating',
  'Yin Growing': 'inward',
  'Yin Full': 'stabilizing',
} as const satisfies Readonly<Record<string, GuidanceDirection>>)

const evidenceStatus = (status: InstrumentDataStatus): EvidenceStatus => status
const missingEvidenceStatus = (status?: InstrumentDataStatus): EvidenceStatus =>
  !status || status === 'unavailable' ? 'unavailable' : 'partial'

const cleanOrganName = (name: string) => name.replace(/ period$/i, '')

export type ResolvedGuidanceEnvironment = Readonly<{
  environment: GuidanceEnvironmentInput
  boundaries: readonly SemanticBoundary[]
  identityKey: string
}>

export const resolveGuidanceEnvironment = (
  organ: OrganMoment,
  globalConditions?: GlobalConditionsSnapshot,
): ResolvedGuidanceEnvironment => {
  const lunarNode =
    globalConditions?.lunar.status !== 'unavailable'
      ? (globalConditions?.lunar.cantongQiNodeId ?? null)
      : null
  const lunarMode = lunarNode ? LUNAR_MODE_BY_NODE[lunarNode] : undefined
  const season =
    globalConditions?.seasonal.status !== 'unavailable'
      ? (globalConditions?.seasonal.season ?? null)
      : null
  const annualMovement =
    globalConditions?.seasonal.status !== 'unavailable'
      ? (globalConditions?.seasonal.yinYangMovement ?? null)
      : null
  const secondaryDirection = annualMovement
    ? DIRECTION_BY_ANNUAL_MOVEMENT[annualMovement]
    : undefined
  const seasonalDefinition = season ? SEASONAL_THEME_BY_SEASON[season] : undefined
  const seasonalTheme: BackgroundThemeInput | undefined =
    season && seasonalDefinition
      ? {
          kind: 'seasonal-current',
          label: [season, annualMovement].filter(Boolean).join(' · '),
          strategicVectors: seasonalDefinition.strategicVectors,
          somaticVectors: seasonalDefinition.somaticVectors,
        }
      : undefined
  const evidence: NonNullable<GuidanceEnvironmentInput['evidence']> = [
    {
      source: {
        id: `active-organ-${organ.key}`,
        label: `Active Organ · ${cleanOrganName(organ.nameEnglish)}`,
        kind: 'active-organ',
      },
      semanticClaim: `The active ${cleanOrganName(organ.nameEnglish)} period carries the ${organ.element} correspondence in the selected two-hour organ-clock model.`,
      weight: 'supporting',
      provenance: {
        status: organ.status,
        sourceLabel: organ.sourceLabel,
        methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
        sourceIds: [`organ-clock-${organ.key}`, `shichen-${organ.shichen.id}`],
      },
    },
    ...(globalConditions && lunarNode && lunarMode
      ? [
          {
            source: {
              id: `lunar-current-${lunarNode}`,
              label: `Lunar Current · ${lunarNode}`,
              kind: 'lunar-current' as const,
            },
            semanticClaim: `The current Cantong qi node supplies the ${lunarMode} lunar tempo.`,
            weight: 'supporting' as const,
            provenance: {
              status: evidenceStatus(globalConditions.lunar.status),
              sourceLabel: 'Reviewed Chinese calendar classification for the current instant',
              methodologyId: globalConditions.lunar.methodology.cantongQiMethodId,
              sourceIds: [
                globalConditions.lunar.methodology.calendarMethodId,
                globalConditions.lunar.methodology.cantongQiMethodId,
                lunarNode,
              ],
            },
          },
        ]
      : [
          {
            source: {
              id: 'lunar-current-unavailable',
              label: 'Lunar Current unavailable',
              kind: 'lunar-current' as const,
            },
            semanticClaim:
              'No reviewed Cantong qi node is available; the temporal-profile lunar compatibility remains the bounded fallback.',
            weight: 'contextual' as const,
            provenance: {
              status: missingEvidenceStatus(globalConditions?.lunar.status),
              sourceLabel: 'Current Guidance environment adapter · explicit fallback',
              methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
              sourceIds: ['lunar-current-unavailable'],
            },
          },
        ]),
    ...(globalConditions && season && seasonalTheme
      ? [
          {
            source: {
              id: `seasonal-current-${globalConditions.seasonal.solarTermId ?? season}`,
              label: `Seasonal Current · ${season}`,
              kind: 'seasonal-current' as const,
            },
            semanticClaim: `${season} contributes a Current-formalized seasonal work background.`,
            weight: 'contextual' as const,
            provenance: {
              status: evidenceStatus(globalConditions.seasonal.status),
              sourceLabel: 'Local solar astronomy plus Current seasonal work-domain formalization',
              methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
              sourceIds: [
                globalConditions.seasonal.methodology.astronomyMethodId,
                globalConditions.seasonal.solarTermId ?? `season-${season.toLowerCase()}`,
              ],
            },
          },
        ]
      : [
          {
            source: {
              id: 'seasonal-current-unavailable',
              label: 'Seasonal Current unavailable',
              kind: 'seasonal-current' as const,
            },
            semanticClaim:
              'No reviewed solar season is available; no seasonal work background is inferred.',
            weight: 'contextual' as const,
            provenance: {
              status: missingEvidenceStatus(globalConditions?.seasonal.status),
              sourceLabel: 'Current Guidance environment adapter · explicit unavailability',
              methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
              sourceIds: ['seasonal-current-unavailable'],
            },
          },
        ]),
    ...(globalConditions && annualMovement && secondaryDirection
      ? [
          {
            source: {
              id: `annual-movement-${annualMovement.toLowerCase().replaceAll(' ', '-')}`,
              label: `Annual movement · ${annualMovement}`,
              kind: 'seasonal-current' as const,
            },
            semanticClaim: `${annualMovement} supplies the ${secondaryDirection} subordinate direction through a Current operational mapping.`,
            weight: 'contextual' as const,
            provenance: {
              status: evidenceStatus(globalConditions.seasonal.status),
              sourceLabel:
                'Reviewed annual Yin/Yang movement classification plus Current direction formalization',
              methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
              sourceIds: [
                globalConditions.seasonal.methodology.yinYangMovementVersion,
                annualMovement,
              ],
            },
          },
        ]
      : []),
  ]
  const boundaries: SemanticBoundary[] = []
  const lunarEnd =
    globalConditions?.lunar.status !== 'unavailable'
      ? globalConditions?.lunar.periodBounds?.endExclusiveUtc
      : undefined
  if (lunarEnd) boundaries.push({ atUtc: lunarEnd, reason: 'lunar-node-change' })
  const seasonalEnd =
    globalConditions?.seasonal.status !== 'unavailable'
      ? globalConditions?.seasonal.periodBounds?.endExclusiveUtc
      : undefined
  if (seasonalEnd) boundaries.push({ atUtc: seasonalEnd, reason: 'solar-term-boundary' })
  return Object.freeze({
    environment: Object.freeze({
      version: GUIDANCE_ENVIRONMENT_VERSION,
      activeOrgan: Object.freeze({
        key: organ.key,
        nameEnglish: cleanOrganName(organ.nameEnglish),
        ...(organ.nameChinese ? { nameChinese: organ.nameChinese } : {}),
        element: organ.element,
        sourceLabel: organ.sourceLabel,
        methodologyId: GUIDANCE_ENVIRONMENT_VERSION,
      }),
      ...(lunarMode ? { lunarMode } : {}),
      ...(secondaryDirection ? { secondaryDirection } : {}),
      ...(seasonalTheme ? { backgroundThemes: [seasonalTheme] } : {}),
      evidence: Object.freeze(evidence),
    }),
    boundaries: Object.freeze(boundaries),
    identityKey: [
      `environment-${GUIDANCE_ENVIRONMENT_VERSION}`,
      [
        'organ',
        organ.key,
        cleanOrganName(organ.nameEnglish),
        organ.nameChinese ?? 'unavailable',
        organ.element,
        organ.status,
        organ.sourceLabel,
        organ.shichen.id,
        GUIDANCE_ENVIRONMENT_VERSION,
      ].join('-'),
      [
        'lunar',
        lunarNode ?? 'profile-fallback',
        globalConditions?.lunar.status ?? 'unavailable',
        lunarEnd ? (globalConditions?.lunar.periodBounds?.startUtc ?? 'unbounded') : 'unbounded',
        lunarEnd ?? 'unbounded',
        lunarNode ? globalConditions?.lunar.methodology.calendarMethodId : 'unavailable',
        lunarNode ? globalConditions?.lunar.methodology.cantongQiMethodId : 'unavailable',
      ].join('-'),
      [
        'season',
        season ? (globalConditions?.seasonal.solarTermId ?? 'unavailable') : 'unavailable',
        season ?? 'unavailable',
        globalConditions?.seasonal.status ?? 'unavailable',
        annualMovement ?? 'unavailable',
        seasonalEnd
          ? (globalConditions?.seasonal.periodBounds?.startUtc ?? 'unbounded')
          : 'unbounded',
        seasonalEnd ?? 'unbounded',
        season || annualMovement
          ? globalConditions?.seasonal.methodology.astronomyMethodId
          : 'unavailable',
        season ? globalConditions?.seasonal.methodology.seasonMethodVersion : 'unavailable',
        annualMovement
          ? globalConditions?.seasonal.methodology.yinYangMovementVersion
          : 'unavailable',
      ].join('-'),
    ].join('-'),
  })
}
