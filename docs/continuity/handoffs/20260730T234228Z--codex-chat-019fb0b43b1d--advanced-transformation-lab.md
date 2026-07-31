# Handoff: Advanced Yijing Transformation Lab

- **Status:** Feature complete; unmerged
- **Branch:** `codex/chat-019fb0b43b1d`
- **Base:** `828c400` (`master`; includes the Codex isolation integration)
- **Remote reconciliation:** `git fetch origin master` confirmed `origin/master` is an ancestor of
  this branch; local `master` is two isolation commits ahead.
- **Date:** 2026-07-30

## Objective

Turn the existing Hexagram Inspector into a same-dialog Base Hexagram / Advanced Transformation Lab
workbench. Preserve deterministic calculations, exact modal Back behavior, canonical hexagram
identity, explicit provenance, responsive accessibility, and calm unavailable states for missing
lineage sources.

## Implemented

- Replaced the inspector's single selected-number state with a typed modal-screen stack, arrival
  context, scroll restoration, session chain, visited set, moving lines, and Lab filters.
- Kept the four compact Base results: Relating, Nuclear, Complement, and Reversal.
- Added six Lab sections: Explore, Change Lab, Interior, Classical Systems, Time & Maps, and
  Structure.
- Added one shared `TransformationHexagramCard` for Base, Lab, destination, and path targets.
  Self-mappings expand locally and never create history loops.
- Added a pure strict-TypeScript transformation domain with:
  - relating, nuclear, complement, reversal, and trigram exchange;
  - the deduplicated eight-operation symmetry family;
  - King Wen pair/neighbors and source-gated Zagua;
  - five-result Mutual Field and bounded Deep Nuclear cycle detection;
  - all 63 line-change destinations with exact binomial group counts;
  - factoradic, lazily paged minimal paths (maximum 720);
  - centrality, positional convention, Three Powers, correspondence, and ordinary/nuclear trigram
    anatomy.
- Added per-inspector memoization with no mutable singleton.
- Added source-gated contracts/placeholders for Eight Palaces, wandering/returning soul,
  host/response, Na Jia, Gua Bian, flying/hidden, enveloping body, Twelve Message Hexagrams, Gua-Qi,
  Shao Yong maps, lunar-phase trigrams, Cantong Qi, reading conventions, and directed Jiaoshi Yilin
  transitions.
- Added algorithm, Lab, provenance, data-contract, and source-input documentation; an accepted
  modal/source-gate decision; durable `AGENTS.md` rules; and the repository skill
  `.agents/skills/yijing-transformation-lab`.
- Removed the superseded `TransformationButton.vue`.
- Fixed the Windows isolation launcher so `npm run workspace:dev` invokes npm through Node instead
  of failing with `spawn EINVAL`.
- Corrected a browser-discovered 360px CSS Grid minimum-sizing overflow. Page, dialog, modal scroll,
  and Lab widths now remain contained; only the intended chain/tab rails scroll horizontally.

## Provenance and source status

- Every calculated target resolves through `src/domain/astrology/hexagrams.ts`; no parallel registry
  was added.
- Structural targets without reviewed content are `structural-only`.
- The four non-central Mutual Field projections, symmetry compositions, Deep Nuclear stages after
  N1, and transformation paths are labeled Current formalizations.
- No raw/normalized commentary evidence, Yilin verse, lineage table, network call, prediction,
  score, or generated classical interpretation was added.
- Jiaoshi Yilin remains `source-needed` as an ordered origin-to-destination repository.
- All lineage/time-map modules remain `source-needed`; exact required inputs are in
  `docs/YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md`.
- `commentary:validate` does not exist on this master base and commentary data/loaders/content were
  not changed.

## Verification

Passed:

```text
npm run workspace:doctor
npm run check
```

`npm run check` included:

- strict Vue/TypeScript checking;
- ESLint with zero warnings;
- 19 Vitest files / 95 tests;
- 9 workspace-isolation tests;
- production Vite build (215 modules).

Repository skill validation passed with the official `quick_validate.py` validator using the bundled
Python runtime and available PyYAML path.

Browser QA used the isolated `npm run workspace:dev` runtime at `127.0.0.1:5173`:

- verified Base Hexagram 5 and its four compact results;
- opened Lab without replacing the dialog;
- retained base line 4 on Lab entry/return;
- selected all six lines and observed Hexagram 35, Hamming distance 6, and 720 paths;
- observed the stable first page of six lazy paths;
- filtered two-line destinations to 15;
- enabled the Yilin filter and observed zero matches plus the explicit missing-repository notice;
- opened Hexagrams 35, 48, 38, and 39 through results and verified arrival context/chain branching;
- verified Back restored Change Lab, all six moving lines, and the two-line filter;
- verified keyboard Left/Right section navigation and focusable native line controls;
- verified Classical Systems and Structure source/provenance displays;
- verified Escape closes the modal, restores focus to the Hexagram 5 opener, and restores body
  scrolling;
- verified close resets chain and returns the next Lab session to Explore with the base moving line;
- measured desktop containment and 360×800 containment;
- observed no browser console warnings or errors.

No external resource request is present in the transformation implementation. The browser's resource
timing API was unavailable in the controlled surface, so this was verified by implementation/source
inspection rather than a captured network waterfall.

## Integration notes

- This feature branch intentionally does not edit `docs/continuity/PROJECT_STATE.md`.
- Review the source-gated labels with a domain editor before activating any future table.
- The next integration action is to merge or cherry-pick this branch from a clean integration
  worktree, then reconcile `PROJECT_STATE.md` there.
