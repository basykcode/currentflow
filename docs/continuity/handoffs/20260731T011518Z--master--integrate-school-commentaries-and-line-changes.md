# Integrate school commentaries and line changes

## Status

Complete on `master`. The feature merge was published to `origin/master` at `8b14fc8`; the
continuity reconciliation containing this handoff is the final publication follow-up.

## Objective

Integrate the approved `codex/chat-019fb0b43b1d` work into `master`, restoring the Base
line-change result preview and Forest summary while recovering the six school commentaries and
OLTRs for editorial review.

## Integration

- Integration worktree:
  `C:\Users\Futures Staff\Documents\Current Flow Isolation Integration`
- Starting `master` and `origin/master`: `75e823a`
- Feature tip: `ea077e8`
- Line-change/Forest fix: `bede57b`
- Non-fast-forward merge: `8b14fc8`
- Merge parents: `75e823a` and `ea077e8`
- Merge result: clean, with no conflicts
- Remote verification: `master` and `origin/master` both resolved to the full
  `8b14fc8f16938e12a2bee0d32c053704a607a8ea` merge commit after push and fetch

## Integrated behavior and data

- The Base inspector again presents six changing-line controls followed by a linked preview of the
  resulting hexagram and its route-specific Forest theme and summary.
- The Forest repository lazily loads 64 public bundles covering all 384 single-line routes.
- Daoist, Buddhist, Confucian, Psychological, Human Design, and Gene Keys commentary tabs lazily
  load 64 public bundles containing 379 supported draft summaries and OLTRs.
- Five Buddhist records remain explicitly unavailable for Hexagrams 1, 5, 6, 7, and 17 because
  their evidence is quarantined.
- The UI exposes provenance, evidence mode, source contribution, and draft review status.
- Raw and normalized commentary evidence remains ignored and local-only. The SPA receives only
  quotation-free generated drafts with compact provenance.
- The full directed 64-by-64 Yilin Transformation Lab repository remains source-gated; the 384
  Forest records apply only to the single-line Base selector.

## Verification

The complete merged tree passed:

```text
npm.cmd run check
git diff --check
git diff --cached --check
```

Results:

- strict TypeScript: passed
- ESLint with zero warnings: passed
- Vitest: 25 files, 108 tests passed
- workspace isolation: 9 tests passed
- school commentary validation: 64 bundles, 379 summaries, 5 unavailable, 0 needs-revision
- Forest validation: 64 bundles, 384 draft-only summaries
- production build: passed, 352 modules transformed

Feature-browser QA is recorded in:

- `20260731T005259Z--codex-chat-019fb0b43b1d--restore-line-change-preview-and-forest-summary.md`
- `20260731T010431Z--codex-chat-019fb0b43b1d--recover-school-commentaries-and-oltrs.md`

## Remaining work

- Human-review the 379 school records and 384 Forest records before changing their draft-only
  publication eligibility.
- Replace or repair eligible Buddhist evidence for Hexagrams 1, 5, 6, 7, and 17.
- Keep Absolute Shadow and all remaining lineage modules unavailable until reviewed rules or
  rights-eligible sources exist.

## Exact next useful action

Review representative records across all six schools, then perform the full editorial pass over
the supported commentary and Forest drafts while preserving explicit unavailable states.
