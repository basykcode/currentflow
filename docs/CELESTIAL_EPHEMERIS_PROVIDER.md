# Celestial ephemeris provider

## Accepted provider

Current Flow uses the local `astronomy-engine` package, pinned to **2.1.19**, as the authoritative
physical-astronomy adapter for Celestial Current. The reviewed package license is **MIT**. It is
bundled with the lazy Astrology route and makes no runtime network request, uses no API key, and
does not read device location.

The framework-independent adapter is `AstronomyEngineCelestialProvider` under
`src/domain/astronomy`. Vue components receive typed snapshots and do not import or reproduce
astronomical calculations.

## Functions and calculations

The adapter uses these `astronomy-engine` functions:

- `AstroTime` to normalize a validated absolute ISO 8601 instant;
- `MoonPhase` for geocentric Moon–Sun ecliptic elongation in `[0, 360)`;
- `Illumination(Body.Moon, ...)` for the illuminated fraction in `[0, 1]`;
- `SearchMoonPhase` for the previous and next New Moon;
- `SearchMoonQuarter` for the next strictly future quarter event;
- `SunPosition(...).elon` for the Sun's true ecliptic-of-date longitude;
- `SearchSunLongitude` for exact 15-degree Solar Term crossings.

New Moon searches are bounded to 40 days in either direction. Solar crossing searches are bounded
to 24 days. Search results must be ordered around the requested instant or the adapter returns a
typed failure. The eight familiar phase names use centered 45-degree sectors. Exact New/Full
turning states and exact Solar Term boundaries use a `1e-6` degree numerical tolerance.

Lunar age, lunation duration, and progress are calculated only from the two searched New Moon
events. They appear in details, not on Home. The current, previous, and next Solar Terms are resolved
from searched events and the reviewed 24-term identity table.

## Traditional Chinese calendar boundary

The existing `lunar-javascript` **1.7.7** dependency remains the sole traditional-calendar
authority. Current Flow first projects the same absolute instant into `Asia/Shanghai`, constructs
the corresponding civil time with `Solar.fromYmdHms`, and reads the traditional lunar year, signed
month/leap-month state, day, month length, and exact Month Pillar Branch. No Moon phase is inferred
from the lunar date and no traditional date is inferred from astronomical phase.

The Cantong qi node is a reviewed six-part classification of traditional lunar days: 1–5 震, 6–10
兌, 11–15 乾, 16–20 巽, 21–25 艮, and 26–30 坤. Its movement label is Current Flow semantic metadata,
not a physical-astronomy result.

## Combined production provider

`LocalDeterministicCelestialCurrentProvider` combines physical astronomy and traditional-calendar
classification into one immutable `CelestialCurrentSnapshot`. The production Astrology route asks
this provider and `LunarScriptCurrentFlowProvider` for the same `Date`; it rejects a mismatch between
the temporal snapshot, celestial snapshot, and visible clock instant.

Moon, Sun, and Chinese-calendar calculation failures are isolated. A working side remains visible,
the failed side becomes explicitly unavailable, the combined status becomes `partial`, and raw
dependency errors are never shown. Presenter conflicts use the typed
`celestial-presenter-failure` identifier.

## Status and methodology

The provider is production-visible with status `computed`. It is not marked `verified` because a
separate independently maintained ephemeris fixture corpus has not yet been accepted. Methodology
identifiers and exact dependency versions travel with the snapshot. Physical astronomy, Chinese
calendar classification, Current semantic labels, and Current visual mapping remain separate in
the details dialog.

## Live cadence and caching

Selected/simulated mode calculates the requested instant immediately, bypasses presentation caches,
freezes the clock at that same instant, and disables marker interpolation.

Live mode samples both domains on initial load and then schedules the earlier of the ordinary clock
wake and the provider's next exact structural wake:

- Lunar Home view model: at most one hour, or the next major quarter sooner;
- Solar Home view model: until the next `Asia/Shanghai` midnight, or exact Solar Term sooner;
- visibility resume: the ordinary live scheduler recalculates from the current wall clock.

Ephemeris event brackets and Home view models use small bounded in-memory caches. They store no
personal data and persist nothing. The Moon-event, next-quarter, and Solar-Term caches are each
capped at 12 entries.

## Deployment compatibility and limitations

The package's ESM/browser export compiles in the production Vite build. A browser-platform bundle
probe verifies that the shared domain has no accidental Node-only import, which is the relevant
Cloudflare web-runtime constraint for this client-side application. Current Flow has no Worker or
Pages Functions astronomy calculation and therefore does not duplicate the dependency server-side.

Known limitations:

- status remains `computed` pending independent golden ephemeris fixtures;
- `astronomy-engine` and `lunar-javascript` may place a few exact Jie transitions minutes apart;
  the astronomical ring follows the searched physical crossing, the Four Pillars calculation keeps
  its existing calendar authority, and the difference is reported instead of silently reconciled;
- Solar Term identity is snapped only within the documented numerical tolerance;
- this provider supplies present/selected conditions, not forecasts, natal interpretation, medical
  guidance, or a remote astronomy service.
