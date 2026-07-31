# Restore the line-change preview and Forest summary

## Status

Complete and verified on `codex/chat-019fb0b43b1d`; not merged into `master` and not pushed.

## Diagnosis

The live site correctly recalculated the selected single-line result, but the Advanced
Transformation Lab refactor placed that dynamic result in the compact relationship list above the
selector. The selector itself no longer contained the prior result preview/link.

The completed Forest transition workstream at `dd9013c` was a sibling branch from the same isolation
base and had never been integrated into the Lab workstream or `master`. Its source-grounded summary
component and 384 one-line route bundles were therefore absent from the live build.

## Implemented

- Restored the Base screen's four intrinsic relationships: Nuclear, Complement, Reversal, and
  Exchanged Trigrams.
- Added a dedicated shared `TransformationHexagramCard` directly beneath the six-position line
  selector. It previews the selected relating hexagram and opens that result through the existing
  typed modal-navigation stack.
- Added `HexagramTransitionInsight` immediately beneath the result card so each source-to-target
  route displays its Forest theme, summary, draft review status, source locator, and redirect
  disclosure.
- Recovered only the Forest transition feature from `dd9013c`; the unrelated school-commentary
  workstream was not imported.
- Added the typed lazy transition repository, 64 runtime bundles containing 384 one-line summaries,
  metadata/audit records, protected-source preparation and public validation scripts, tests,
  documentation, and the previously accepted Forest evidence decision.
- Kept source verses and notes outside Git and the SPA. Tracked summaries are quotation-free,
  draft-only, route-specific paraphrases with passage hashes and rights/review metadata.
- Kept the complete 64 × 64 Yilin Transformation Lab module source-gated. The 384 one-line subset
  supports only the Base selector and does not activate the all-destination Yilin filter.
- Extended the ESLint JavaScript boundary only to `scripts/transitions/**/*.mjs`; the first complete
  check exposed that the sibling branch's broader lint configuration was not present here.

## Verification

Passed:

```text
npm.cmd run workspace:doctor
npm.cmd run transitions:validate
npx.cmd vitest run src/features/hexagram-transitions src/components/hexagrams/__tests__/HexagramTransitionInsight.spec.ts src/components/hexagrams/__tests__/HexagramInspector.spec.ts
npm.cmd run check
git diff HEAD --check
```

Results:

- Focused tests: 4 files, 11 tests passed.
- Full Vitest suite: 22 files, 101 tests passed.
- Workspace isolation: 9 tests passed.
- Forest validation: 64 bundles and 384 draft-only summaries passed.
- Production build: 283 modules transformed.
- TypeScript/Vue type-check and ESLint passed with zero warnings.

Browser QA:

- Reproduced the live regression at `https://current-flow.net/tools/hexagrams`: Hexagram 5 line 2
  updated the remote compact card to Hexagram 63 but left no preview or Forest summary in the
  selector region.
- Verified the local isolated preview at `http://127.0.0.1:5173/tools/hexagrams`: Hexagram 5 line 1
  showed linked Hexagram 48 plus the “Overlooked Capacity Recognized” summary.
- Selecting line 2 changed the checked control, linked result, route, theme, and summary to Hexagram
  63 / “Favored Homecoming” without reloading.
- Opening the result navigated to Hexagram 63 inside the same dialog.
- The narrow layout had no line-panel or dialog horizontal overflow.
- Browser console warnings/errors: none.

## Continuity

- `docs/continuity/PROJECT_STATE.md` remains unchanged because this is a feature worktree.
- The imported Forest decision remains authoritative; no new consequential architecture decision
  was required for this regression fix.
- The dirty coordination-only checkout at
  `C:\Users\Futures Staff\Documents\Current Flow` was inspected read-only and remains unchanged.

## Exact next useful action

From a clean integration worktree on `master`, merge this feature branch, reconcile
`PROJECT_STATE.md`, rerun `npm.cmd run check`, and publish only with explicit merge/push
authorization.
