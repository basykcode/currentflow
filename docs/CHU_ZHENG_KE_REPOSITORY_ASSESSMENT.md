# Chū–Zhèng–Kè repository assessment

- Date: 2026-08-25
- Method under assessment: `temporal-hour-phase:chu-zheng-ke-96-v1`
- Status: implementation assessment; the findings below define the integration boundary

## Existing Shíchen and Organ architecture

`LunarScriptCurrentFlowProvider` is the active Current Flow adapter. For every requested UTC
instant it projects one IANA-zone civil coordinate with `getZonedCivilTime`, gives that same civil
coordinate to `lunar-javascript` for the hour pillar, and selects the active Organ Hour from the
twelve-window meridian-clock table in `organClock.ts`. The active Shíchen index is therefore the
two-hour local-civil window selected by `floor(((civilHour + 1) % 24) / 2)`, with Zǐ beginning at
23:00.

The existing provider already accepts an explicit `Date`. That is the authoritative live,
historical, and simulated instant seam. There is no separate browser-side simulation mode and no
active local-mean-solar or apparent-solar implementation. Settings currently provide timezone and
an optional location label only.

## Authoritative time basis

The active and only implemented basis is `local-civil`. Organ identity, Earthly Branch, hour pillar,
Hour Hexagram, and the new phase coordinate must all derive from the same timezone projection. The
phase calculator must never derive a second position from Vue wall-clock fields or fixed UTC
subtraction.

The Shíchen resolver will expose a normalized `[0, 120)` basis-minute coordinate. It will resolve
future minute, Kè, Macro, and Shíchen boundaries by projecting candidate UTC instants through the
same local-civil engine and observing the normalized coordinate. This keeps the public phase engine
independent of civil-time and future solar-time implementations.

## DST policy

The existing policy is IANA timezone projection through `Intl.DateTimeFormat`. Spring gaps and fall
repeats follow the civil labels returned for the actual UTC instant. Existing future Shíchen-boundary
logic scans real UTC minutes and selects the first projected whole minute whose authoritative
Earthly Branch differs.

The new resolver will preserve that policy. A DST transition can make the real UTC duration between
two civil Shíchen boundaries differ from 120 minutes, so boundary discovery must not add a fixed UTC
duration. Repeated civil labels remain distinct actual instants; skipped labels are not fabricated.
The coordinate reports a warning when an offset transition causes a nonstandard real-time span.

## Current Chū–Zhèng–Kè implementation

`organClock.ts` currently derives an hour-parity half and a 15-minute quarter directly from civil
hour/minute fields. It also assigns eight Current product “cultivation” meanings. That calculation
is presentation-coupled, has no seconds/milliseconds, does not expose normalized boundaries, and
cannot express DST policy. The eight meanings are not received historical data and conflict with
the required observational-only Micro Hour model.

The old `ChuZhengKeMoment` and cultivation copy will be retired. A framework-independent shared time
module will own exact Chū/Zhèng/Kè classification, boundary metadata, methodology metadata, and the
pure event comparator. `OrganMoment` will remain the Organ Hour domain model and gain the resolved
phase and presentational Shíchen identity it needs.

## Guidance architecture

The Temporal Semantic Resolver composes reviewed Year, Month, Day, and Hour Hexagram profiles. Day
is authoritative, Hour is subordinate, and the deterministic Guidance engine renders OLTR,
intention, and execution candidates. Guidance is cached by semantic resolution and timezone until
the earliest recorded semantic boundary.

This is a supported maturity-extension point. Macro Hour will be a typed, versioned modifier of the
existing Hour theme. It will add supported and discouraged maturity verbs, evidence of kind
`macro-hour`, and a Macro-specific resolution identity. It will not alter the Hour Hexagram,
response relation, effort level, or primary Day work. Micro Hour will not enter semantic evidence,
resolver identity, or guidance validity in v1.

The validity layer currently tracks the next Earthly Branch, civil day, and solar term. It must add
the resolved Macro boundary. In Zhèng that boundary is the next Shíchen boundary. Micro boundaries
must remain absent.

## Clock and UI architecture

`AstrologyView.vue` currently refreshes the complete snapshot with a drifting 60-second interval.
`YinClock.vue` owns a separate display clock. The view will adopt a recursive minute-aligned clock
service with an injectable live/frozen instant source, visibility recovery, cleanup, and event
classification. Reusing the provider cache means a Micro event updates phase presentation without
recreating guidance.

The home Organ card is a focused clickable component paired equally with the Hour Hexagram. It
currently says `Internal State` and shows speculative cultivation copy. It will become `ORGAN
SYSTEM`, present Organ/element and Branch/animal identity, show concise Macro and Micro rows, and
render a compact reusable SVG timeline. The calculation disclosure is the existing suitable home
for the detailed timeline, methodology, time basis, warnings, and development-only debug data.

The existing `BrandMark.vue` is a Current flowing-line mark, not a Taiji asset. No reusable Taiji
asset or SVG exists in the repository. The implementation will add one shared
`CurrentTaijiMark.vue` using the standard Taiji character as the single application component. It
will not copy a third-party asset or alter the existing wordmark.

## Planned change boundary

- Add normalized Shíchen identity/coordinate resolution and pure Chū–Zhèng–Kè modules.
- Replace speculative Micro semantics with Phase 0–3 and first/second/third/fourth Kè labels.
- Add Macro maturity to resolver composition, guidance evidence, candidate tie-breaking, cache
  identity, and validity boundaries.
- Add a minute-aligned live/frozen clock source and highest-priority temporal event reporting.
- Add shared Taiji and compact/detailed `ShichenFlowTimeline` components.
- Update Organ System and calculation disclosure presentation with accessibility and reduced motion.
- Add exact-boundary, event-priority, timezone, DST, simulation, semantic, provider, scheduler, and
  component coverage.
- Update methodology, architecture, validation, guidance, and glance-layout documentation.

No new dependency, network call, hour-pillar rule, Hexagram mapping, Organ Hour mapping, or
user-facing solar-time mode is required.
