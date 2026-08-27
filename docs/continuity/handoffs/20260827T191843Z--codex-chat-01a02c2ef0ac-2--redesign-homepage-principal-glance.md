# Handoff: Redesign the homepage principal glance

- Date (UTC): 2026-08-27T19:18:43Z
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting HEAD: `ca93cf500af1b59560c3121dd22f76b6dee623cb`
- Status: unmerged feature work; implementation and verification complete

## Objective

Replace the tall five-card Astrology home composition with a calm desktop glance instrument that
keeps the celestial header, moves OLTR directly beneath it, prioritizes Hour and Day, and places
validated Intention and Execution beside the active Organ System. Preserve all domain authority,
provenance, unavailable behavior, inspector interactions, responsive accessibility, and lower-page
depth.

## Implemented

- Reordered the first-glance flow to celestial header → full-width OLTR band → principal instrument
  → compact broader temporal context.
- Added focused `PrincipalGlanceGrid` composition:
  - Organ System spans the left desktop column.
  - Hour uses the featured treatment above Day in the center.
  - Intention and Execution occupy the right column.
- Added a horizontal temporal-card visual option so GanZhi/zodiac identity sits beside the canonical
  hexagram glyph while the title, received language, and Gene Key spectrum remain centered below.
- Added compact Guidance presentation without changing Guidance resolution:
  - every domain-supplied controlled Intention is shown as character, tone-marked Pinyin, and English;
  - up to three already-validated ranked Executions show their existing category, action,
    observable endpoint, and top selection rationale;
  - separate Intention and Execution unavailable states render without controls or fabricated data.
- Added `TemporalContextDetails`, whose summary keeps Year and Month identities visible and whose
  disclosure reuses the shared cards and inspector.
- Retired the presentation-only `FiveElementComposition`; no snapshot, provider, temporal,
  Guidance, provenance, Organ, or inspector domain contract changed.
- Removed duplicate lower-page Guidance while preserving Related Hexagrams, future-depth affordance,
  and the existing calculation/provenance disclosure below the first-glance region.
- Preserved native card buttons, keyboard activation, visible focus, touch targets, reduced-motion
  clock behavior, natural scrolling, and safe responsive stacking.
- Updated architecture and layout documentation and added accepted decision
  `20260827T191623Z--adopt-principal-desktop-glance-instrument.md`.

## Verification

- `npm run workspace:doctor` — passed before tracked changes; this worktree remains exclusively
  leased to session `01a02c2ef0ac` on branch `codex/chat-01a02c2ef0ac-2`, runtime slot 3.
- Focused component/view suites — passed: 3 files / 16 tests before the final full run.
- Final `npm run check` with bundled Node 24.19.0/npm 11.5.2 — passed:
  - strict TypeScript;
  - ESLint with zero warnings;
  - 48 Vitest files / 395 application tests;
  - 11 workspace-isolation tests;
  - commentary validation with 379 summaries and 5 explicit unavailable records;
  - transition validation with 384 summaries;
  - production build with 472 modules transformed.
- `git diff --check` — passed.
- Live in-app browser review on isolated `http://127.0.0.1:5176/`:
  - 1280 × 720, 1366 × 768, and 1440 × 900 kept the header, complete OLTR, and principal grid in
    the first viewport at standard text size;
  - 375 × 667, 390 × 844, 430 × 932, and 1024 × 768 retained natural, non-overlapping responsive
    stacking;
  - every inspected viewport had zero horizontal document overflow;
  - keyboard Enter opened the shared Hour inspector, its close control worked, and the Year/Month
    disclosure exposed both shared cards;
  - a fresh preview load had no console errors;
  - responsive screenshots were inspected in memory and not written to the repository.

## Files changed

- Added:
  - `src/components/astrology/PrincipalGlanceGrid.vue`
  - `src/components/astrology/TemporalContextDetails.vue`
  - `docs/continuity/decisions/20260827T191623Z--adopt-principal-desktop-glance-instrument.md`
  - this handoff
- Updated:
  - `src/components/astrology/CurrentFlowGlance.vue`
  - `src/components/astrology/CurrentFlowOltr.vue`
  - `src/components/astrology/GuidanceOutputPanel.vue`
  - `src/components/astrology/HexagramCard.vue`
  - `src/components/astrology/OrganCard.vue`
  - `src/components/astrology/SynthesisPanel.vue`
  - `src/views/AstrologyView.vue`
  - focused glance, Guidance, and route tests
  - `docs/ARCHITECTURE.md`
  - `docs/CURRENT_FLOW_GLANCE_LAYOUT.md`
  - `docs/GUIDANCE_OUTPUT_ARCHITECTURE.md`
- Removed:
  - `src/components/astrology/FiveElementComposition.vue`

## Remaining limitations and next action

- The production Current inspected in-browser supplied one controlled intention and two validated
  executions. The layout truthfully renders those entries; it is ready to show up to three of each
  when the domain supplies them. No filler interpretation or action was created.
- The successful production build retains the repository's non-failing warning for an Astrology
  route chunk above 500 kB; no new runtime network dependency was introduced.
- Product review in the deliverable preview is the next useful action. No push, merge, rebase,
  deployment, branch switch, or commit was performed; the complete feature and continuity diff
  remains on this permanent Astrology branch.
