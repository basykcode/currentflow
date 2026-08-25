# Implement Chū–Zhèng–Kè Organ System

## Status

- Workstream: Astrology
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting commit: `86c9169b40b6c4f9dc8581731c492278f6897ed4`
- Integration status: feature work is complete and locally committed on its dedicated lane; it is not merged or pushed.

## Objective

Implement the Tech Lead's Chū–Zhèng–Kè temporal model as a single authoritative extension of the existing Shíchen clock, use Macro Hour only as guidance maturity, keep Micro Hour observational, and replace the former organ-clock presentation with an accessible Organ System flow card and timeline.

## Delivered

- Added the shared canonical Shíchen index and a normalized `[0, 120)` local-civil phase coordinate. Organ identity, Earthly Branch, hour pillar, hour hexagram, Macro Hour, Micro Hour, and timeline marker now derive from that same coordinate.
- Added a pure `chu-zheng-ke` package with exact phase classification, whole-minute marker positioning, boundary prediction, deterministic event priority, method identifiers, and DST-aware diagnostics.
- Added Macro Hour maturity to semantic guidance. Chū favors starting/following valid work; Zhèng favors continuing/consolidating it. This can score or break ties only among relation-compatible candidates and cannot change effort, response relation, day identity, or hour identity.
- Kept Micro Hour observational. It appears in the Organ System card, provenance, debug data, and scheduler events, but it is intentionally absent from guidance evidence, guidance identity, and guidance validity.
- Added a minute-aligned scheduler with frozen-time support, visibility recovery, cleanup, and explicit event priority: Shíchen, Macro, Micro, then minute.
- Added the shared `CurrentTaijiMark`, a dependency-free SVG Shíchen timeline with three major points, six minor points, eight Kè segments, active progress, the next Branch, reduced-motion handling, and compact/detailed modes.
- Reworked the home card as `Organ System`: Organ and Element, Branch Animal Hour, Macro Hour, Micro Hour, timeline, and exact time range. The full card remains interactive and the Organ/Hour pair remains equal-sized.
- Expanded calculation provenance with the active model, basis, exact UTC bounds, DST warnings, the Micro guidance exclusion, detailed Kè state, and development-only debug values.
- Updated the architecture, calculation, integration, layout, guidance, and temporal-resolver documentation. Added the repository assessment, clock specification, UI specification, validation plan, and the accepted coordinate decision.
- Added no dependencies and bundled no raw/source-gated evidence.

## Authoritative basis and DST policy

The active model uses the selected instant interpreted in the selected IANA time zone's local civil clock. Shíchen start is the matching odd local hour. Boundaries are found by scanning real UTC minutes for the next matching local-civil state, so spring gaps and fall repeats are explicit rather than silently treated as fixed elapsed duration.

The standard 96-Kè nomenclature is implemented as a Current formalization over this product clock. The UI reports a warning when a Shíchen's real UTC duration differs from 120 minutes. During a repeated fall-back local hour, the same civil marker position can recur and is reported as repeated civil time rather than fabricated into a distinct traditional mapping.

## Verification

- `npm run check` — passed on 2026-08-25:
  - TypeScript strict type check passed.
  - ESLint passed with zero warnings.
  - Vitest: 38 files, 257 tests passed.
  - Workspace isolation: 11 tests passed.
  - Commentary validation: 64 generated hexagrams, 379 summaries, 5 explicit unavailable records, 0 needing revision.
  - Transition validation: 64 Forest bundles and 384 draft-only summaries.
  - Production build: 421 modules transformed.
- Responsive in-app browser QA passed at `375x667`, `390x844`, `393x852`, `430x932`, `768x1024`, and `1440x1000`:
  - no horizontal overflow;
  - Organ System and Hour cards have equal width and height;
  - the timeline marker remains inside its stage;
  - home and detailed provenance interactions work;
  - browser console was clean during interaction QA.
- Motion inspection confirmed the normal 4-second marker glide and 90-second Taiji rotation, with component-level and global reduced-motion overrides that remove both animations.
- `git diff --check` — passed before the handoff was added.

## Known limits

- Only the documented local-civil model is active; alternative astronomical or apparent-solar bases are not silently mixed in.
- Historical claims beyond the documented Chū/Zhèng/Kè clock structure remain source-qualified; the 96-segment application is labeled as a Current formalization.
- At the shortest tested phone height (`375x667`), the glance continues by natural vertical scrolling; the two primary cards and timeline remain intact without horizontal clipping.

## Next useful action

Continue future Astrology work in this same permanent lane. If this feature is later integrated, review this commit and its decision record together, rerun `npm run check`, and repeat live boundary checks near a Macro transition, Shíchen transition, and both DST directions before merging.
