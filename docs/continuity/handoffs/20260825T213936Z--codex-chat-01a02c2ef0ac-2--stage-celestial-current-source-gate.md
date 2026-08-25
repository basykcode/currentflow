# Handoff: Stage Celestial Current behind an authoritative source gate

- Date (UTC): 2026-08-25T21:39:36Z
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting HEAD: `ad3307d60088ea5f03ff46da69678172ef9757e5`
- Status: unmerged feature work; safe presentation layer complete, production integration blocked

## Objective

Implement the Tech Lead's Celestial Current Home specification without duplicating or fabricating
astronomy. The required initial audit found no Global Conditions Engine, lunar elongation, or
continuous solar longitude in the repository or any local Git ref. Per the specification's manual
decision gate, complete all safe contracts, presenters, geometry, SVG components, unavailable
states, fixtures, tests, and documentation, then stop before false production wiring.

## Implemented

- Added the typed `GlobalConditionsSnapshot` seam plus Lunar and Seasonal source/view-model
  contracts under `src/domain/current-flow/celestial-instruments`.
- Added pure lunar/solar marker geometry, shortest-angle unwrapping, Chinese season boundaries,
  twelve Branch-month sectors, six Cantong qi labels, and the reviewed 24-term display registry.
- Added fail-closed Lunar/Solar presenters. Lunar astronomy and traditional node remain independent;
  Solar season/Branch conflicts throw rather than silently remap; missing semantic fields remain
  partial/unavailable.
- Added local SVG `MoonPhaseGlyph` and `SunDisk`, shared `CelestialCycleRing`, whole-cluster Lunar and
  Solar buttons, responsive `CelestialCurrentHeader`, exactly-three-value text, and a lightweight
  common details shell.
- Reused `CurrentTaijiMark` with a celestial size variant and added `ChineseTermInline`.
- Separated marker orbit from Taiji self-rotation, prevented initial sweeps, supported selected-time
  jumps, shortest-path live motion, forced/system reduced motion, and static rings.
- Changed `YinClock` to minute-boundary sampling and removed visible seconds. Added compact sizing
  and shrink-safe metadata behavior.
- Added a development-only `/__dev/celestial-instruments` gallery with all eight Moon angles, all six
  nodes, an intentional astronomy/calendar mismatch, nine requested Solar states, unavailable
  states, compact/regular layouts, light/dark themes, and reduced motion.
- Added focused domain/component tests, architecture/accessibility/instrument documentation, durable
  repository rules, a source-gate decision record, and the required manual-input record.

## Intentionally not implemented

- `CelestialCurrentHeader` is not wired into production `CurrentFlowGlance`.
- No astronomy dependency, service, approximation, or fixture value was added to production.
- No live Moon hourly/Sun daily/event-boundary scheduler was connected because no authoritative
  source owns its refresh/event contract.
- Existing calculation engines were not modified. No dependency or remote asset was added.

The required decision and recommended path are in
`docs/CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md`.

## Verification

- `npm run check` — passed.
  - type check and lint passed;
  - 43 unit-test files / 316 tests passed;
  - 11 workspace-isolation tests passed;
  - commentary validation: 64 generated hexagrams, 379 summaries, 5 unavailable, 0 needs revision;
  - transitions validation: 64 bundles / 384 summaries;
  - production build: 423 modules transformed.
- Browser fixture QA passed at 375×667, 390×844, 393×852, 430×932, 768×1024, 1366×768, and
  1728×1000. Every size had zero page-level horizontal overflow, zero outer/center cluster overlap,
  and all six primary values visible.
- 150% text at 390×844 retained all six values with natural vertical growth and no horizontal
  overflow.
- Details opened the correct Lunar section, moved focus inside, closed with Escape, and restored
  focus to the cluster.
- Reduced-motion fixture computed `animation-name: none` and zero marker-transition duration; rings
  had no transform.
- Browser console errors/warnings: zero. Remote resource requests from the gallery: zero.

## Manual decision required

Select one authoritative production owner for lunar elongation, illumination, lunation progress,
waxing/waning, continuous solar longitude, Solar Term identity/boundaries, Branch month, Cantong qi
node, annual Yin/Yang movement, statuses, warnings, and methodology. The recommended choice is one
reviewed adapter at the canonical provider boundary, with ephemeris/service, accuracy, time-scale,
event-boundary, and licensing decisions recorded before implementation.

## Exact next action

After that decision, run `npm run workspace:doctor`, implement the approved adapter with golden
boundary fixtures, feed its snapshot through the completed presenters, replace the current
`CurrentFlowGlance` header with `CelestialCurrentHeader`, connect the existing phase scheduler to the
approved event contract, populate the details shell, and rerun `npm run check` plus the viewport
matrix.
