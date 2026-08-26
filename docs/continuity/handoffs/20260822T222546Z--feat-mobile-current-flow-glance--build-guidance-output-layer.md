# Handoff: Build the deterministic Guidance Output Layer

- UTC timestamp: 2026-08-22T22:25:46Z
- Branch/worktree: `feat/mobile-current-flow-glance` at
  `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Starting commit: `c0c0c716bf2f592b42358b37323913a65435c1dd`
- Task/objective: Implement the OLTR synthesis engine, controlled Intention selector, bounded
  Execution selector, cross-output validator, validity/version contracts, tests, documentation, and
  Current Flow frontend integration without letting presentation or a language model choose
  semantic state.
- Status: complete

## Starting context

The isolated worktree was clean on the completed but unmerged mobile-glance feature commit. It had
no upstream. `origin` correctly used `git@github-basykcode:basykcode/currentflow.git`.

Repository inspection found the four deterministic temporal hexagrams and structural relationships,
but no Global Conditions Engine, Moment Signature, Primary Current classifier, or live semantic
methodology. The active provider deliberately returned interpretation as unavailable. Its OLTR was
factual placeholder copy; the six-school OLTR corpus is a separate set of source-grounded editorial
drafts and is not a temporal guidance engine. Current Intelligence was also a disconnected future
shell.

## Work completed

- Added the standalone strict-TypeScript `src/domain/guidance` domain boundary with versioned
  semantic contracts, seven response relations, qualitative effort and profiles, evidence,
  validity, output versions, and available/unavailable bundle types.
- Added a deterministic semantic resolver mapping controlled upstream conditions to one primary
  response relation. It never receives or interprets raw dates, GanZhi, hexagram numbers, organ
  periods, or Vue state.
- Added controlled OLTR phrase banks, 100-point internal scoring, hard format/grammar/safety
  validation, and validated fallbacks for all seven relations.
- Added the exact 15-item controlled intention lexicon, including distinct `守 Shǒu` and `收 Shōu`
  records, deterministic weighted ranking, compatibility validation, and up to two meaningfully
  distinct alternatives.
- Added a versioned low-risk action library across somatic, task, environment, and pause categories,
  plus deterministic selection and validation for endpoint, action count, effort, relation,
  direction, intention, repetition, unsupported claims, high stakes, and safety.
- Added cross-output validation and pure domain operations for selecting an alternative intention
  and re-ranking Execution without changing semantic synthesis, Primary Current, OLTR, validity, or
  versions.
- Migrated `CurrentFlowSnapshot` from freeform `synthesis` fields to `guidance: GuidanceBundle` and a
  separate `relatedHexagrams` structural field.
- Added a visibly demo-labeled available semantic fixture to `DemoCurrentFlowProvider`.
- Added an explicit unavailable bundle to `LunarScriptCurrentFlowProvider`, cached until the next
  Earthly Branch boundary. No live semantic state is inferred while the upstream classifier is
  absent.
- Added `GuidanceOutputPanel` and migrated the glance OLTR. The component displays the bundle, lets
  the user choose ranked alternatives, and delegates Execution re-ranking to pure domain functions.
- Added the five required acceptance fixtures plus excess and deficiency coverage, 26 domain tests,
  three focused component tests, provider cache/availability tests, and migrated glance tests.
- Added engine and discovered-architecture documentation, an accepted architecture decision,
  integration/source documentation updates, and durable guidance rules in `AGENTS.md`.
- Preserved `docs/continuity/PROJECT_STATE.md` unchanged because this remains unmerged feature work.

## Files or components changed

- `src/domain/guidance/**`
- `src/domain/astrology/types.ts`
- `src/providers/demoGuidance.ts`
- `src/providers/guidanceBoundary.ts`
- `src/providers/demoCurrentFlow.ts`
- `src/providers/lunarScriptCurrentFlow.ts`
- `src/components/astrology/GuidanceOutputPanel.vue`
- `src/components/astrology/CurrentFlowOltr.vue`
- `src/components/astrology/CurrentFlowGlance.vue`
- `src/components/astrology/SynthesisPanel.vue`
- focused provider, domain, and component tests
- `docs/GUIDANCE_OUTPUT_ARCHITECTURE.md`
- `docs/GUIDANCE_OUTPUT_ENGINE.md`
- `docs/ARCHITECTURE.md`, `docs/DATA_INTEGRATION.md`, and `docs/CALCULATION_SOURCES.md`
- `AGENTS.md`

## Decisions made

- [Gate guidance output on versioned semantic input](../decisions/20260822T222049Z--gate-guidance-output-on-versioned-semantic-input.md)

## Important rationale

Implementing the output layer from an already-semantic contract fulfills deterministic selection,
coherence, validity, and UI requirements without fabricating a traditional mapping from the four
temporal hexagrams. Explicit live unavailability is an intentional product boundary, not an
unfinished renderer. A future classifier can replace the unavailable input only after its own
methodology, evidence, and boundary behavior are reviewed.

## Verification commands and results

- `npm run workspace:doctor` — passed on the isolated branch, lease, and runtime slot 0.
- `npx vitest run src/domain/guidance/__tests__/guidanceEngine.spec.ts ...` — focused guidance,
  provider, glance, and UI tests passed throughout implementation; final focused set was 5 files /
  41 tests before expanded full-suite coverage.
- `npm run lint` — zero warnings and errors.
- `npm run check` — passed after final implementation:
  - strict Vue/TypeScript type checking;
  - zero-warning ESLint;
  - 30 frontend test files / 161 tests;
  - 9 workspace isolation tests;
  - commentary validation: 64 bundles, 379 summaries, five explicit unavailable, zero revisions;
  - Forest validation: 64 bundles / 384 summaries;
  - 388-module production build.
- `git diff --check` — passed.
- Prettier checks were run across every changed and newly added source/documentation file.

## Browser verification

A stale Vue scheduler error appeared once while the original server accumulated HMR updates across
the snapshot-contract migration. Restarting `npm run workspace:dev` cleared it. Fresh reloads then
showed no browser warnings or errors.

- Mobile 390 × 844: body `scrollWidth` and `clientWidth` both 390; Guidance Status bottom 829.8px,
  fully inside the initial viewport; no horizontal overflow.
- The visible first viewport retained the complete Year/Day/Month and Organ/Hour hierarchy and the
  full explicit unavailable reason.
- Desktop 1280 × 800: body `scrollWidth` and `clientWidth` both 1280; the unavailable panel remained
  bounded and Related Hexagrams retained three columns.
- The browser viewport override was reset, and the local preview remains available at
  `http://127.0.0.1:5173/` from a fresh development server.

## Failed or rejected approaches worth remembering

- Assigning intention or response semantics directly from the existing temporal hexagram numbers was
  rejected because the repository contains no reviewed mapping and the task forbids a duplicate
  interpretation system.
- Treating the source-grounded school commentary OLTRs as the live temporal OLTR was rejected because
  they are draft hexagram commentary records with different provenance and purpose.
- The accumulated HMR process was not accepted as browser evidence after a contract-wide migration;
  a clean server restart was required before the final UI and console pass.

## Known risks and assumptions

- Live guidance remains unavailable until a reviewed upstream semantic classifier supplies
  `GuidanceSemanticInput`. The complete available path is currently exercised by fixtures and the
  demo provider.
- The condition taxonomy, response mappings, intention compatibility metadata, and action library
  are Current formalizations and still need product/domain editorial review before live activation.
- The active provider's Earthly Branch validity boundary is derived from civil-time branch changes
  and is tested for the accepted New York fixture. Independent DST-edge and semantic-boundary
  fixtures should accompany the future live classifier.

## Unresolved issues

- No reviewed Global Conditions, Moment Signature, or Primary Current semantic classifier is present.
  Connecting one is a separate architecture and source-review task, not part of this output-layer
  implementation.

## Uncommitted or unmerged state

All guidance implementation, tests, documentation, decision, and this handoff are uncommitted on
`feat/mobile-current-flow-glance`. They are stacked on the committed mobile-glance feature at
`c0c0c71`. Nothing was merged, rebased, or pushed, and `PROJECT_STATE.md` was not edited.

## Exact next recommended action

Review the local unavailable state and the demo/component acceptance behavior. If approved,
explicitly authorize committing this scoped layer and integrating/pushing the stacked feature branch;
then plan the reviewed upstream semantic classifier as a separate workstream.

## Relevant files, commits, issues, or external references

- [Guidance output architecture](../../GUIDANCE_OUTPUT_ARCHITECTURE.md)
- [Guidance Output Engine](../../GUIDANCE_OUTPUT_ENGINE.md)
- [Guidance architecture decision](../decisions/20260822T222049Z--gate-guidance-output-on-versioned-semantic-input.md)
- [Guidance domain](../../../src/domain/guidance)
- Starting commit `c0c0c716bf2f592b42358b37323913a65435c1dd`
