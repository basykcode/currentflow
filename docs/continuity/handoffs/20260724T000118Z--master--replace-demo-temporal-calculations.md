# Handoff: Replace demo temporal calculations

- UTC timestamp: 2026-07-24T00:01:18Z
- Branch/worktree: `master` at `C:\Users\Client\Documents\Current Flow`
- Starting commit: `d3f0e97ca3f72bfebf6848788754f7e006dd8c66`
- Task/objective: Replace demo Astrology data with sourced, timezone-aware current calculations,
  including 2026 Fire Horse → Hexagram 28 and the correct organ hour.
- Status: complete

## Starting context

`master` tracked `origin/master`, was one continuity commit ahead of the remote, and had a clean
working tree. The active `DemoCurrentFlowProvider` returned static year/month/day/hour hexagrams,
organ period, relationships, and synthesis copy. The provider contract accepted only an instant; the
Settings timezone was a nonfunctional scaffold.

## Work completed

- Added `lunar-javascript` 1.7.7 and a narrow strict-TypeScript declaration for the APIs in use.
- Added IANA-timezone civil projection, GanZhi English descriptions, a complete 64-hexagram King Wen
  catalog, the complete 60 Jia Zi → 64 Da Gua lookup, the twelve organ periods, and structural
  relationship transforms.
- Added and activated `LunarScriptCurrentFlowProvider`.
- Selected exact Li Chun year, exact solar-term month, sect-2 day, and traditional two-hour pillar
  conventions.
- Made the device-local timezone preference drive calculations and report invalid-value fallback.
- Replaced demo banners and synthesis claims with computed provenance and explicit unavailable states.
- Replaced the fixed heart illustration with a generic twelve-period clock indicator.
- Added 31 new tests for timezone projection, the Fire Horse golden case, source-table completeness,
  the midnight-spanning organ period, and every civil organ-clock hour.
- Documented sources, assumptions, limitations, architecture, and the consequential calculation
  decision.

## Files or components changed

- Dependencies: `package.json`, `package-lock.json`
- Domain: `src/domain/astrology/`
- Provider: `src/providers/lunarScriptCurrentFlow.ts`, `src/providers/currentFlow.ts`
- UI: Astrology, Settings, synthesis, related-hexagram, and organ components
- Tests: `src/domain/astrology/__tests__/`,
  `src/providers/__tests__/lunarScriptCurrentFlow.spec.ts`
- Documentation: `README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_INTEGRATION.md`,
  `docs/CALCULATION_SOURCES.md`, continuity state and decisions

## Decisions made

- [Calculate temporal facts with declared source boundaries](../decisions/20260723T235840Z--calculate-temporal-facts-with-declared-source-boundaries.md)

## Important rationale

`lunar-javascript` owns the calendar calculation but does not assign hexagrams or organ periods.
Those data therefore remain separate, versioned lookups with their own sources. Interpretive
synthesis stays unavailable because no verified rule or constrained language model is connected.
The calendar library has no timezone parameter, so the provider supplies timezone-projected civil
parts instead of passing the host-local `Date` directly.

## Verification commands and results

- `npm run check` — passed after making the bundled npm executable available on `PATH`: strict
  type-check, ESLint with zero warnings, 35/35 Vitest tests across six files, and Vite production
  build with 99 modules transformed.
- In-app browser inspection at desktop and 390 × 844 responsive viewport — Fire Horse / Hexagram 28
  and computed provenance rendered correctly; mobile client width equaled scroll width; no console
  warnings or errors.

## Failed or rejected approaches worth remembering

- Calling the npm CLI directly without an `npm.cmd` on `PATH` allowed top-level commands but caused
  the composite `npm run check` script to fail resolving nested `npm` calls. A temporary local wrapper
  enabled the exact project command; it was removed after verification.
- A calendar library alone cannot produce the requested hexagrams. Do not infer or market a
  date-to-hexagram formula; use the documented 60-entry lookup.

## Known risks and assumptions

- Exact solar-term boundary results inherit `lunar-javascript` behavior and need independent
  before/after golden fixtures.
- The 60 Jia Zi table is a practitioner source and should receive subject-matter review before
  stronger authority claims.
- The organ period follows civil time, not apparent solar time, because the app does not request
  coordinates.
- The day convention is sect 2; other lineages may advance the day pillar at late Zi.

## Unresolved issues

- No interpretive synthesis or execution guidance is connected.
- Personal BaZi and changing-line methods remain out of scope.
- The task changes are not committed or pushed.

## Uncommitted or unmerged state

All code, tests, dependency, UI, documentation, decision, state, and this handoff changes are present
in the `master` working tree and are uncommitted. There were no pre-existing working-tree changes to
preserve. The branch remains one pre-task continuity commit ahead of `origin/master`.

## Exact next recommended action

Review and commit the live-calculation change, then add cross-library fixtures immediately before and
after 2026 Li Chun and monthly solar-term transition instants.

## Relevant files, commits, issues, or external references

- [`../../CALCULATION_SOURCES.md`](../../CALCULATION_SOURCES.md)
- [`../../../src/providers/lunarScriptCurrentFlow.ts`](../../../src/providers/lunarScriptCurrentFlow.ts)
- [`../../../src/domain/astrology/jiaZiHexagrams.ts`](../../../src/domain/astrology/jiaZiHexagrams.ts)
- [`../../../src/domain/astrology/organClock.ts`](../../../src/domain/astrology/organClock.ts)
- Starting commit `d3f0e97ca3f72bfebf6848788754f7e006dd8c66`
