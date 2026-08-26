import {
  resolveBranchMonthFromSolarLongitude,
  resolveChineseSolarSeason,
  solarMarkerAngleDegrees,
} from './geometry'
import { getSolarTermDisplayDefinition } from './labels'
import { CELESTIAL_INSTRUMENT_METHODOLOGY } from './methodology'
import {
  CelestialPresenterConflictError,
  type SeasonalCurrentSource,
  type SolarHomeInstrumentViewModel,
} from './types'

const UNAVAILABLE_METHOD = 'unavailable:no-global-conditions-source'

export const presentSolarHomeInstrument = (
  source: SeasonalCurrentSource | null,
): SolarHomeInstrumentViewModel => {
  const methodology = {
    astronomyMethodId: source?.methodology.astronomyMethodId ?? UNAVAILABLE_METHOD,
    solarTermTableVersion:
      source?.methodology.solarTermTableVersion ??
      CELESTIAL_INSTRUMENT_METHODOLOGY.solarTermDisplay,
    seasonMethodVersion:
      source?.methodology.seasonMethodVersion ??
      CELESTIAL_INSTRUMENT_METHODOLOGY.chineseSolarSeason,
    yinYangMovementVersion: source?.methodology.yinYangMovementVersion ?? UNAVAILABLE_METHOD,
    presenterVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.presenter,
  } as const

  if (!source || source.solarLongitudeDegrees === null) {
    const unavailableViewModel: SolarHomeInstrumentViewModel = {
      status: 'unavailable',
      season: null,
      solarTerm: null,
      yinYangMovement: null,
      solarLongitudeDegrees: null,
      branchMonth: null,
      markerAngleDegrees: null,
      periodBounds: null,
      detailsTarget: { kind: 'seasonal-current' },
      methodology,
      warnings: Object.freeze([
        ...(source?.warnings ?? []),
        'Seasonal Current data are unavailable; no season was inferred from browser month.',
      ]),
    }
    return Object.freeze(unavailableViewModel)
  }

  const expectedSeason = resolveChineseSolarSeason(source.solarLongitudeDegrees)
  if (source.season && source.season !== expectedSeason) {
    throw new CelestialPresenterConflictError(
      `Seasonal Current reports ${source.season} at ${source.solarLongitudeDegrees}°, where the reviewed Chinese boundary table resolves ${expectedSeason}.`,
    )
  }

  const expectedBranch = resolveBranchMonthFromSolarLongitude(source.solarLongitudeDegrees)
  if (source.branchMonth && source.branchMonth.character !== expectedBranch.character) {
    throw new CelestialPresenterConflictError(
      `Seasonal Current reports branch ${source.branchMonth.character} at ${source.solarLongitudeDegrees}°, where the reviewed ring mapping resolves ${expectedBranch.character}.`,
    )
  }

  const solarTerm = source.solarTermId ? getSolarTermDisplayDefinition(source.solarTermId) : null
  const complete =
    source.season !== null &&
    solarTerm !== null &&
    source.branchMonth !== null &&
    source.yinYangMovement !== null

  const viewModel: SolarHomeInstrumentViewModel = {
    status: complete ? source.status : 'partial',
    season: source.season,
    solarTerm,
    yinYangMovement: source.yinYangMovement,
    solarLongitudeDegrees: source.solarLongitudeDegrees,
    branchMonth: source.branchMonth,
    markerAngleDegrees: solarMarkerAngleDegrees(source.solarLongitudeDegrees),
    periodBounds: source.periodBounds,
    detailsTarget: { kind: 'seasonal-current' },
    methodology,
    warnings: Object.freeze([
      ...source.warnings,
      ...(source.solarTermId && !solarTerm
        ? [`Solar Term “${source.solarTermId}” is absent from the reviewed display table.`]
        : []),
      ...(!source.branchMonth
        ? ['Month Branch unavailable; no value was guessed from Gregorian month.']
        : []),
      ...(!source.yinYangMovement
        ? ['Annual Yin/Yang movement unavailable; no value was inferred from season or angle.']
        : []),
    ]),
  }
  return Object.freeze(viewModel)
}
