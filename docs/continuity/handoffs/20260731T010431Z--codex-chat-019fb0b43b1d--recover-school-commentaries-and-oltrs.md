# Handoff: Recover school commentaries and OLTRs

- Date (UTC): 2026-07-31
- Branch: `codex/chat-019fb0b43b1d`
- Base commit: `bede57b` (`fix(hexagrams): restore line change preview and Forest summary`)
- Recovery source: integrated commentary merge `3873ced`
- Merge/push status: neither merged nor pushed

## Objective

Recover the completed six-school commentary corpus and its source-grounded OLTRs into the same
isolated branch that already contains the Advanced Transformation Lab and the 384 Forest
single-line transition summaries, so the combined inspector can receive human review before
integration.

## Reconstructed history

The commentary work existed on the older `codex/hexagram-forest-transitions` lineage as three
feature commits (`4c25f5e`, `65cb431`, and `1dca917`). Merge commit `3873ced` had already reconciled
that work with the chat-isolation foundation at `828c400`, making its first-parent diff the
authoritative recovery point. The later Forest commit `dd9013c` was already recovered into this
branch by `bede57b`.

In this corpus, OLTR means **One Line To Remember**: the 12–24-word `essence` attached to each
school/hexagram synthesis record. It is separate from a selected changing-line result and its
Forest transition summary.

## Recovered behavior and data

- Restored the canonical Daoist, Buddhist, Confucian, Psychological, Human Design, and Gene Keys
  registries and eleven source records.
- Restored 64 draft files and 64 lazy public bundles containing 379 evidence-backed school records
  and five explicit unavailable Buddhist records.
- Restored sentence-to-chunk support, source contribution roles, rights state, content hashes,
  evidence mode, review state, generation metadata, schemas, reports, prompt contracts, and the
  local-only evidence pipeline.
- Restored the typed cached commentary repository and the focused accessible six-tab commentary
  panel.
- Replaced the inspector's unavailable commentary placeholder without removing the Transformation
  Lab, line-change result card, typed modal navigation, or Forest transition insight.
- Labeled each available short essence as `OLTR · One Line To Remember` above the detailed school
  summary.
- Reconciled documentation, `AGENTS.md`, ESLint script coverage, and `npm run check` so both the
  school corpus and Forest corpus are validated.
- Preserved `docs/continuity/PROJECT_STATE.md` unchanged because this remains unmerged feature work.

## Rights and provenance boundary

No raw or normalized source prose was imported. `data/hexagram-commentary/chunked/` and
`content/yijing/internal/` remain ignored, and the SPA lazy-loads only
`content/yijing/generated/hexagrams/*.json`. Public records contain original synthesis, compact
provenance, and `quotationIncluded: false`. Automated `qa-passed` remains technical QA only; all
available content is visibly `draft-only` pending human editorial review.

## Verification

Successful commands:

```text
npm.cmd run workspace:doctor
npm.cmd run commentary:validate
npm.cmd run transitions:validate
npx.cmd vitest run src/components/hexagrams/__tests__/HexagramCommentaryPanel.spec.ts src/components/hexagrams/__tests__/HexagramInspector.spec.ts src/features/hexagram-commentary/__tests__/repository.spec.ts src/features/hexagram-commentary/__tests__/generated-content.spec.ts src/features/hexagram-transitions/__tests__/repository.spec.ts src/features/hexagram-transitions/__tests__/generated-content.spec.ts
npm.cmd run check
npm.cmd run commentary:review
git diff --check
git diff --cached --check
```

Final results:

- strict TypeScript and ESLint: passed
- Vitest: 25 files, 108 tests passed
- workspace isolation tests: 9 passed
- school commentary validation: 64 bundles, 379 summaries, five unavailable, zero needs-revision
- Forest validation: 64 bundles, 384 draft-only transition summaries
- commentary review: 379 QA-passed, zero needs-revision, five blocked
- production build: passed with school and transition JSON emitted as lazy chunks

Browser inspection at `http://127.0.0.1:5173/tools/hexagrams` verified:

- Hexagram 5 displays all six school tabs, a labeled OLTR, detailed synthesis, evidence mode, source
  count, and draft-review status.
- Source disclosure lists titles, contributors, roles, evidence modes, locator counts, and source
  tensions without protected passages.
- Buddhist Hexagram 5 displays the explicit quarantined-source unavailable state.
- End and Home keyboard navigation move focus/selection across the tablist, and the selected school
  persists after closing and reopening the inspector.
- Changing Hexagram 5 line 2 still previews linked Hexagram 63 and the Forest summary “Favored
  Homecoming.”
- At the available 1280×720 browser viewport, body, dialog, modal scroller, commentary panel, and
  tablist had no horizontal overflow; the console contained no warnings or errors.

The recovered source workstream's original handoff records a separate successful 390×844 mobile
inspection. This recovery pass did not emulate that viewport because the current in-app preview
surface exposed a fixed 1280×720 viewport; the original responsive panel CSS is unchanged except
for the small OLTR label.

## Remaining editorial work

- Correct or replace the quarantined Buddhist records for Hexagrams 1, 5, 6, 7, and 17 before
  claiming full Buddhist coverage.
- Repair or replace Confucian source 2 for Hexagram 64; the current Confucian record remains
  supported by source 1.
- Human-review the 379 QA-passed school drafts and 384 Forest transition drafts before changing any
  publication eligibility.

## Exact next useful action

Use the retained local preview to review representative hexagrams and all six lenses. Record
editorial changes separately from technical QA. After approval, explicitly authorize integration;
then merge this branch from a clean integration worktree and push `master`.
