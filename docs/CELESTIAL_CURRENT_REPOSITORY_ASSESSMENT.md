# Celestial Current repository assessment

## Conclusion

The repository does not currently contain the Global Conditions Engine required by the Celestial
Current specification. It also does not contain authoritative lunar elongation, illumination,
lunation progress, waxing/waning state, or continuous solar longitude. This is a core integration
blocker, not an optional detail-field gap.

The safe presentation work is implemented behind typed source contracts and explicit unavailable
states. Production Home integration remains intentionally unwired so the UI cannot imply that
calendar labels or browser dates are astronomical calculations.

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
dependency exposes GanZhi and Jie-boundary functions used here, but the app has no reviewed contract
for the continuous astronomical values required by these instruments.

## Reusable architecture found

- `CurrentFlowGlance` is the first-glance composition boundary.
- `YinClock` is the central clock and now presents minute precision without visible seconds.
- `CurrentTaijiMark` is the canonical present marker and is reused by both rings.
- `ChineseTermInline` provides the required character, Pinyin, and English pattern.
- `CalculationProvenanceDetails` is specific to the existing Current Flow snapshot. No Lunar or
  Seasonal details section exists, so a focused `CelestialCurrentDetails` shell is staged for the
  future Global Conditions data.

## Safe implementation boundary

`src/domain/current-flow/celestial-instruments` defines the required upstream source seam,
presentation-only view models, reviewed display tables, pure geometry, conflict checks, and
development fixtures. The Vue components consume only those view models; they do not calculate
astronomy.

The development route `/__dev/celestial-instruments` exercises the implementation with values that
are explicitly marked as fixtures. It is excluded from production route registration and
navigation.

See `CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md` for the one decision required before production
integration.
