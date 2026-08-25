# Handoff: Implement Temporal Semantic Resolver v1

- Date (UTC): 2026-08-22
- Branch: `feat/mobile-current-flow-glance`
- Worktree: `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Commit at start/end: `c0c0c716bf2f592b42358b37323913a65435c1dd` (changes remain uncommitted)
- Integration status: feature worktree only; not committed, pushed, or merged

## Objective

Implement the missing deterministic layer between the four calculated temporal hexagrams and the
existing Guidance Output Layer without using an LLM, hexagram titles as advice, or unsourced
classical claims.

## Reconstructed starting state

The worktree already contained uncommitted mobile-glance and Guidance Output Layer changes from the
preceding task. Those changes were preserved. The active provider calculated year, month, day, and
hour hexagrams but always returned an unavailable guidance bundle because no reviewed semantic input
existed. No separate Global Conditions Engine, Moment Signature, Four-Scale Resonance, or Primary
Current classifier was present.

## Implemented

- Added `src/domain/guidance/semantic-resolver` with controlled types, versions, weighting,
  composition, conflict retention, evidence, profile registry/validation, and response/effort/vector
  rules.
- Added the 13 requested Current profiles for Hexagrams 1, 2, 12, 18, 28, 48, 52, 53, 57, 61, 62,
  63, and 64. All resolve through the canonical hexagram registry and use controlled intention IDs.
- Labeled initial profiles `spec-reviewed`, with no fabricated human reviewer. This is product-spec
  review and not classical-source or human editorial approval.
- Kept canonical identity provenance and Current operational evidence in distinct fields. No
  commentary content is imported by the resolver.
- Implemented ordinal day/hour/month/year precedence of 8/4/2/1. The numbers are internal ordering,
  not confidence or probability.
- Required an eligible day profile. Missing lesser-scale profiles produce partial coverage and an
  explicit unavailable evidence record with exact hexagram numbers; a missing day profile returns
  an unavailable resolution.
- Resolved the Hexagram 28 specification mismatch by using controlled `narrow` as the strategic
  vector and retaining `reduce` only as a preferred verb.
- Added an explicit adapter into `GuidanceSemanticInput`. Guidance Synthesis now consumes the
  resolver-selected relation, effort, vectors, verb policy, and eligible intention IDs rather than
  reselecting those values from generic condition defaults.
- Connected `LunarScriptCurrentFlowProvider`: eligible operative days publish validated guidance;
  uncovered days remain explicitly unavailable.
- Added exact validity candidates for the next Earthly Branch hour, civil midnight, and solar term,
  preventing cached guidance from surviving a pillar boundary.
- Added architecture documentation and the accepted decision record
  `20260822T225700Z--adopt-versioned-current-semantic-resolver.md`.

## Verification

Focused checks passed before the full suite:

- `npm run type-check`
- `npm run test:unit -- --run src/domain/guidance/semantic-resolver/__tests__/semanticResolver.spec.ts src/domain/guidance/__tests__/guidanceEngine.spec.ts src/providers/__tests__/lunarScriptCurrentFlow.spec.ts src/providers/__tests__/demoCurrentFlow.spec.ts`
- Result: 4 files, 56 tests passed.

Final mandatory check passed after correcting one lint-only inline type-import issue:

- `npm run check`
- Type check: passed.
- ESLint with zero warnings: passed.
- Unit tests: 31 files, 187 tests passed.
- Workspace isolation tests: 9 passed.
- Commentary validation: 64 hexagrams, 379 summaries, 5 explicit unavailable records, 0 needs
  revision.
- Transition validation: 64 bundles and 384 draft-only summaries passed.
- Production build: passed; 400 modules transformed.

Focused semantic coverage includes:

- exact 13-profile registry and canonical identity reuse;
- Hexagram 28 controlled-vector behavior;
- day precedence against three opposing lesser scales;
- deterministic repeat output and separated evidence;
- partial and unavailable coverage behavior;
- downstream missing-profile evidence;
- conservative effort conflict handling;
- coherent end-to-end Guidance bundles for all 13 MVP day profiles;
- a real live-provider date with day Hexagram 57;
- available and unavailable cache reuse;
- exact midnight and solar-term expiration.

## Decisions and caveats

- The initial profiles are original Current operational formalizations. They are not claims about
  what the received Yi Jing mechanically instructs.
- `LunarMode` and `FieldTexture` are Current compatibility classifications derived from the profile
  composition. They are not an astronomical lunar-phase or observed-weather engine.
- The registry intentionally covers 13 figures, not all 64. Expansion requires explicit profile
  authoring, review metadata, validation, and end-to-end guidance coverage.
- Feature-branch protocol prohibits editing canonical `PROJECT_STATE.md`; it remains unchanged.

## Exact next useful action

Review the 13 product-semantic profiles editorially, recording real reviewer identifiers only when
that review occurs. Then commit this branch's combined mobile-glance, Guidance Output, and Temporal
Semantic Resolver work and integrate it through an explicitly authorized merge/push task.
