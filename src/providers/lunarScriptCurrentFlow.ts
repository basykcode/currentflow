import { Solar } from 'lunar-javascript'

import { getZonedCivilTime } from '@/domain/astrology/civilTime'
import { describeGanZhi } from '@/domain/astrology/ganZhi'
import {
  resolveJiaZiHexagram,
  TEMPORAL_HEXAGRAM_MAPPING_VERSION,
} from '@/domain/astrology/jiaZiHexagrams'
import { getOrganMoment } from '@/domain/astrology/organClock'
import type { CurrentFlowContext, CurrentFlowProvider } from '@/domain/astrology/provider'
import { getStructuralRelationships } from '@/domain/astrology/relationships'
import { resolveLocalCivilShichenPhase } from '@/domain/astrology/shichenPhaseCoordinate'
import type { CurrentFlowSnapshot, TemporalHexagram, TemporalScope } from '@/domain/astrology/types'
import {
  createGuidanceBundle,
  createUnavailableGuidanceBundle,
  GuidanceConstructionError,
  isGuidanceExpired,
  resolveTemporalSemantics,
  toGuidanceSemanticInput,
} from '@/domain/guidance'
import type { GuidanceBundle } from '@/domain/guidance/types'

import { resolveGuidanceEnvironment } from './guidanceEnvironment'
import { getTemporalBounds, getTemporalSemanticBoundaries } from './lunarScriptTemporalBounds'

const TEMPORAL_SOURCE = 'lunar-javascript 1.7.7 · 六十甲子配卦 · canonical King Wen IDs'

const makeTemporal = (
  scope: TemporalScope,
  label: string,
  ganZhi: string,
  timeBoundsLabel: string,
): TemporalHexagram => ({
  scope,
  label,
  timeBoundsLabel,
  hexagram: resolveJiaZiHexagram(ganZhi),
  ganZhiRaw: ganZhi,
  ganZhi: describeGanZhi(ganZhi),
  numberingSystem: 'king-wen',
  mappingSystem: 'liu-shi-jiazi-peigua',
  mappingVersion: TEMPORAL_HEXAGRAM_MAPPING_VERSION,
  status: 'computed',
  sourceLabel: TEMPORAL_SOURCE,
})

export class LunarScriptCurrentFlowProvider implements CurrentFlowProvider {
  private guidanceCache: GuidanceBundle | undefined

  getSnapshot(at: Date, context: CurrentFlowContext = {}): Promise<CurrentFlowSnapshot> {
    if (
      context.globalConditions &&
      context.globalConditions.generatedAtIso !== at.toISOString()
    ) {
      throw new Error('Global Conditions and temporal guidance must use the same instant.')
    }
    const civil = getZonedCivilTime(at, context.timezone)
    const lunar = Solar.fromYmdHms(
      civil.year,
      civil.month,
      civil.day,
      civil.hour,
      civil.minute,
      civil.second,
    ).getLunar()

    const yearGanZhi = lunar.getYearInGanZhiExact()
    const monthGanZhi = lunar.getMonthInGanZhiExact()
    const dayGanZhi = lunar.getDayInGanZhiExact2()
    const hourGanZhi = lunar.getTimeInGanZhi()
    const bounds = getTemporalBounds(lunar, civil)
    const year = makeTemporal('year', 'Li Chun year pillar', yearGanZhi, bounds.year)
    const month = makeTemporal('month', 'Solar-term month pillar', monthGanZhi, bounds.month)
    const day = makeTemporal('day', 'Civil-day pillar · sect 2', dayGanZhi, bounds.day)
    const hour = makeTemporal('hour', 'Two-hour pillar', hourGanZhi, bounds.hour)
    const organClock = getOrganMoment(civil.hour)
    const shichenPhase = resolveLocalCivilShichenPhase(at, civil.timezone)
    const organ = {
      ...organClock,
      shichen: shichenPhase.shichen,
      nextShichen: shichenPhase.nextShichen,
      hourPhase: shichenPhase.hourPhase,
    }
    const temporal = { year, month, day, hour }
    const semanticResolution = resolveTemporalSemantics({ temporal, hourPhase: organ.hourPhase })
    const guidanceEnvironment = resolveGuidanceEnvironment(organ, context.globalConditions)
    const semanticBoundaries = Object.freeze([
      ...getTemporalSemanticBoundaries(lunar, civil, organ.hourPhase),
      ...guidanceEnvironment.boundaries,
    ])
    const guidanceId = `${semanticResolution.resolutionId}-${guidanceEnvironment.identityKey}-${civil.timezone}`
    let guidance = this.guidanceCache
    if (
      context.mode === 'selected' ||
      !guidance ||
      guidance.synthesisId !== guidanceId ||
      isGuidanceExpired(guidance, at)
    ) {
      let nextGuidance: GuidanceBundle
      if (semanticResolution.status === 'available') {
        try {
          nextGuidance = createGuidanceBundle(
            toGuidanceSemanticInput(semanticResolution, {
              synthesisId: guidanceId,
              validFromUtc: at.toISOString(),
              boundaries: semanticBoundaries,
              environment: guidanceEnvironment.environment,
            }),
          )
        } catch (error) {
          if (!(error instanceof GuidanceConstructionError)) throw error
          nextGuidance = createUnavailableGuidanceBundle({
            synthesisId: guidanceId,
            validFromUtc: at.toISOString(),
            boundaries: semanticBoundaries,
            reason:
              'The controlled guidance vocabulary could not resolve this temporal state safely.',
            sourceLabel: 'Current Guidance Engine · fail-closed candidate boundary',
          })
        }
      } else {
        nextGuidance = createUnavailableGuidanceBundle({
          synthesisId: guidanceId,
          validFromUtc: at.toISOString(),
          boundaries: semanticBoundaries,
          reason: semanticResolution.reason,
          sourceLabel: 'Current Semantic Layer v1 · explicit profile coverage',
        })
      }
      guidance = nextGuidance
      if (context.mode !== 'selected') this.guidanceCache = nextGuidance
    }

    const fallbackNote = civil.usedTimezoneFallback
      ? `The requested timezone “${context.timezone}” was invalid; ${civil.timezone} was used.`
      : `Civil time was calculated in ${civil.timezone}.`

    return Promise.resolve({
      generatedAtIso: at.toISOString(),
      timezone: civil.timezone,
      ...(context.locationLabel ? { locationLabel: context.locationLabel } : {}),
      status: 'computed',
      temporal,
      organ: {
        ...organ,
        timeRangeLabel: `${organ.timeRangeLabel} · ${civil.timezone}`,
      },
      guidance,
      relatedHexagrams: getStructuralRelationships(day.hexagram),
      provenance: {
        providerId: 'lunar-script-current-flow',
        modelVersion: '1.2.0',
        mappingVersion: TEMPORAL_HEXAGRAM_MAPPING_VERSION,
        factors: [
          `Year ${yearGanZhi} (${lunar.getYearShengXiaoExact()})`,
          `Month ${monthGanZhi}`,
          `Day ${dayGanZhi}`,
          `Hour ${hourGanZhi}`,
          `Organ clock civil hour ${civil.hour.toString().padStart(2, '0')}`,
          `Chū–Zhèng–Kè ${organ.hourPhase.chineseMacroLabel} · ${organ.hourPhase.chineseKeLabel}`,
        ],
        notes: [
          fallbackNote,
          'Year and month boundaries use exact solar-term transition times from lunar-javascript.',
          'The day pillar uses sect 2: the 23:00–23:59 Zi hour remains on the civil day.',
          `Hexagrams use ${TEMPORAL_HEXAGRAM_MAPPING_VERSION}; all stored and displayed identities are canonical King Wen IDs.`,
          'The organ clock is a traditional educational framework, not medical advice.',
          'Chū–Zhèng–Kè uses the selected 96-kè model in the same local-civil coordinate as the active Shíchen.',
          'Macro Hour modifies Current guidance maturity; Micro Hour is observational and does not independently change guidance in v1.',
          semanticResolution.status === 'available'
            ? `Current Semantic Layer v1 resolved ${semanticResolution.coverage} profile coverage; missing profiles: ${semanticResolution.missingProfileNumbers.length > 0 ? semanticResolution.missingProfileNumbers.join(', ') : 'none'}.`
            : semanticResolution.reason,
        ],
      },
    })
  }
}
