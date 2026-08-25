import { lunarMarkerAngleDegrees } from './geometry'
import { getCantongQiDisplayDefinition } from './labels'
import { CELESTIAL_INSTRUMENT_METHODOLOGY } from './methodology'
import type { LunarCurrentSource, LunarHomeInstrumentViewModel } from './types'

const UNAVAILABLE_METHOD = 'unavailable:no-global-conditions-source'

export const presentLunarHomeInstrument = (
  source: LunarCurrentSource | null,
): LunarHomeInstrumentViewModel => {
  const methodology = {
    astronomyMethodId: source?.methodology.astronomyMethodId ?? UNAVAILABLE_METHOD,
    calendarMethodId: source?.methodology.calendarMethodId ?? UNAVAILABLE_METHOD,
    cantongQiMethodId:
      source?.methodology.cantongQiMethodId ?? CELESTIAL_INSTRUMENT_METHODOLOGY.lunarLabels,
    presenterVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.presenter,
  } as const

  if (
    !source ||
    source.phaseName === null ||
    source.elongationDegrees === null ||
    source.lunationProgress === null ||
    source.illuminationFraction === null ||
    source.waxing === null
  ) {
    const unavailableViewModel: LunarHomeInstrumentViewModel = {
      status: 'unavailable',
      phaseName: 'Lunar data unavailable',
      cantongQi: null,
      yinYangMovement: null,
      elongationDegrees: null,
      lunationProgress: null,
      illuminationFraction: null,
      waxing: null,
      activeNodeIndex: null,
      markerAngleDegrees: null,
      detailsTarget: { kind: 'lunar-current' },
      methodology,
      warnings: Object.freeze([
        ...(source?.warnings ?? []),
        'Astronomical Moon data are unavailable; no phase was inferred from calendar data.',
      ]),
    }
    return Object.freeze(unavailableViewModel)
  }

  const cantongQi = source.cantongQiNodeId
    ? getCantongQiDisplayDefinition(source.cantongQiNodeId)
    : null
  const status = cantongQi ? source.status : 'partial'

  const viewModel: LunarHomeInstrumentViewModel = {
    status,
    phaseName: source.phaseName,
    cantongQi,
    yinYangMovement: cantongQi?.yinYangMovement ?? null,
    elongationDegrees: source.elongationDegrees,
    lunationProgress: source.lunationProgress,
    illuminationFraction: source.illuminationFraction,
    waxing: source.waxing,
    activeNodeIndex: cantongQi?.index ?? null,
    markerAngleDegrees: lunarMarkerAngleDegrees(source.elongationDegrees),
    detailsTarget: { kind: 'lunar-current' },
    methodology,
    warnings: Object.freeze([
      ...source.warnings,
      ...(cantongQi ? [] : ['Cantong qi node unavailable; no lunar movement was inferred.']),
    ]),
  }
  return Object.freeze(viewModel)
}
