import { Solar } from 'lunar-javascript'

import { getZonedCivilTime } from '@/domain/astrology/civilTime'
import { describeGanZhi } from '@/domain/astrology/ganZhi'
import { resolveJiaZiHexagram } from '@/domain/astrology/jiaZiHexagrams'
import { getOrganMoment } from '@/domain/astrology/organClock'
import type { CurrentFlowContext, CurrentFlowProvider } from '@/domain/astrology/provider'
import { getStructuralRelationships } from '@/domain/astrology/relationships'
import type { CurrentFlowSnapshot, TemporalHexagram, TemporalScope } from '@/domain/astrology/types'

const TEMPORAL_SOURCE = 'lunar-javascript 1.7.7 · 60 Jia Zi to 64 Da Gua'

const makeTemporal = (scope: TemporalScope, label: string, ganZhi: string): TemporalHexagram => ({
  scope,
  label,
  hexagram: resolveJiaZiHexagram(ganZhi),
  ganZhi: describeGanZhi(ganZhi),
  status: 'computed',
  sourceLabel: TEMPORAL_SOURCE,
})

export class LunarScriptCurrentFlowProvider implements CurrentFlowProvider {
  getSnapshot(at: Date, context: CurrentFlowContext = {}): Promise<CurrentFlowSnapshot> {
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
    const year = makeTemporal('year', 'Li Chun year pillar', yearGanZhi)
    const month = makeTemporal('month', 'Solar-term month pillar', monthGanZhi)
    const day = makeTemporal('day', 'Civil-day pillar · sect 2', dayGanZhi)
    const hour = makeTemporal('hour', 'Two-hour pillar', hourGanZhi)
    const organ = getOrganMoment(civil.hour)

    const fallbackNote = civil.usedTimezoneFallback
      ? `The requested timezone “${context.timezone}” was invalid; ${civil.timezone} was used.`
      : `Civil time was calculated in ${civil.timezone}.`

    return Promise.resolve({
      generatedAtIso: at.toISOString(),
      timezone: civil.timezone,
      ...(context.locationLabel ? { locationLabel: context.locationLabel } : {}),
      status: 'computed',
      temporal: { year, month, day, hour },
      organ: {
        ...organ,
        timeRangeLabel: `${organ.timeRangeLabel} · ${civil.timezone}`,
      },
      synthesis: {
        status: 'unavailable',
        sourceLabel: 'No verified interpretive synthesis model is connected',
        oltr: 'The verified temporal factors are available without an interpretive forecast.',
        recommendedIntention:
          'Use the calculated pillars as context while keeping decisions grounded in present evidence.',
        recommendedExecution: [],
        relatedHexagrams: getStructuralRelationships(day.hexagram),
      },
      provenance: {
        providerId: 'lunar-script-current-flow',
        modelVersion: '1.0.0',
        factors: [
          `Year ${yearGanZhi} (${lunar.getYearShengXiaoExact()})`,
          `Month ${monthGanZhi}`,
          `Day ${dayGanZhi}`,
          `Hour ${hourGanZhi}`,
          `Organ clock civil hour ${civil.hour.toString().padStart(2, '0')}`,
        ],
        notes: [
          fallbackNote,
          'Year and month boundaries use exact solar-term transition times from lunar-javascript.',
          'The day pillar uses sect 2: the 23:00–23:59 Zi hour remains on the civil day.',
          'Hexagrams are resolved through the documented 60 Jia Zi to 64 Da Gua lookup table.',
          'The organ clock is a traditional educational framework, not medical advice.',
          'Interpretive intentions and execution recommendations are intentionally unavailable.',
        ],
      },
    })
  }
}
