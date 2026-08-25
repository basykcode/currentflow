# Celestial Current repository assessment

## Conclusion

The prior source-selection gate is resolved. Current Flow will use a local, pinned
`astronomy-engine` adapter as the authoritative physical-astronomy source for lunar elongation,
illumination, phase events, true ecliptic-of-date solar longitude, and exact Solar Term crossings.
`lunar-javascript` adapter remains the sole authority for the traditional Chinese lunar date and
Cantong qi lunar-day node on the canonical `Asia/Shanghai` calendar basis.

The existing typed source contracts, fail-closed presenters, and unavailable states remain the
integration boundary. Physical astronomy stays framework-independent and local: no remote
astronomy API, API key, runtime astronomy request, Vue calculation, or fixture-backed production
value is permitted.

## Repository evidence inspected

- `src/domain/astrology/types.ts` and the canonical Current Flow snapshot contract;
- `src/providers/currentFlow.ts`, `src/providers/lunarScriptCurrentFlow.ts`, and provider tests;
- `src/domain/time` and the live Shíchen scheduler;
- `src/components/astrology/CurrentFlowGlance.vue`, `YinClock.vue`, and
  `CalculationProvenanceDetails.vue`;
- `package.json`, `lunar-javascript` declarations, and all local Git refs/history for
  `GlobalConditionsSnapshot`, `LunarCurrent`, `SeasonalCurrent`, `solarLongitude`, lunar
  elongation, illumination, and lunation progress.

The active `LunarScriptCurrentFlowProvider` owns Four Pillars, exact solar-term month boundaries,
Organ/Shíchen classification, Chū–Zhèng–Kè phase, structural hexagrams, and guidance projection. Its
dependency exposes GanZhi and Jie-boundary functions used here. Those calendrical results remain
independent from the new continuous physical-astronomy adapter.

## Reusable architecture found

- `CurrentFlowGlance` is the first-glance composition boundary.
- `YinClock` is the central clock and presents independently dissolving hours, minutes, and seconds
  on a four-second wall-clock cadence.
- `CurrentTaijiMark` is the canonical present marker and is reused by both rings.
- `ChineseTermInline` provides the required character, Pinyin, and English pattern.
- `CelestialCurrentDetails` is the focused production details surface for Moon/Sun event data,
  traditional-calendar classification, methodology, warnings, and visual mappings.

## Implemented boundary

`src/domain/current-flow/celestial-instruments` defines the required upstream source seam,
presentation-only view models, reviewed display tables, pure geometry, conflict checks, and
development fixtures. The Vue components consume only those view models; they do not calculate
astronomy.

`src/domain/astronomy` now owns the pinned local ephemeris adapter and typed physical snapshot.
`src/providers/localDeterministicCelestialCurrent.ts` combines its results with
`lunar-javascript` calendar classification, contains the bounded live caches, and isolates Moon,
Sun, and calendar failures. `AstrologyView` supplies the same instant to temporal and celestial
providers and activates both instruments through production `CurrentFlowGlance`.

The development route `/__dev/celestial-instruments` still exercises the UI with values explicitly
marked as fixtures. It is excluded from production route registration and navigation and is not a
production fallback.

See [`CELESTIAL_EPHEMERIS_PROVIDER.md`](CELESTIAL_EPHEMERIS_PROVIDER.md) for the accepted provider
and [`CELESTIAL_CURRENT_VALIDATION.md`](CELESTIAL_CURRENT_VALIDATION.md) for the current
`computed` validation status. The historical manual gate is preserved as resolved in
[`CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md`](CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md).
