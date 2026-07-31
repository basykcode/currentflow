# Handoff: Build source-grounded hexagram school commentary

- Date (UTC): 2026-07-30
- Branch: `feat/hexagram-school-commentaries`
- Base: `35a3bb2b23be7bc0f1ac9269199e78c89cab32f5`
- Implementation commits:
  - `4c25f5e` — auditable evidence pipeline
  - `65cb431` — complete six-school draft corpus
  - `1dca917` — modal repository, rendering, tests, docs, and repository skill
- Merge/push status: neither merged nor pushed

## Objective

Turn the 11-source local Yijing corpus into an auditable 64×6 school-commentary system and connect
it to the shared hexagram inspector without redistributing protected source passages or inferring
missing evidence.

## Delivered

- Registered the canonical Daoist, Buddhist, Confucian, Psychological, Human Design, and Gene Keys
  schools plus 11 source records and explicit alias normalization.
- Preserved the protected raw corpus under Git ignore and added checksum-backed normalization,
  coverage, per-source digest, and per-school packet stages.
- Expanded the legacy quarantine from two to six records after checking identity:
  Buddhist Hexagrams 1, 5, 6, 7, and 17; Confucian source 2 Hexagram 64.
- Built a manually reasoned Hexagram 5 pilot and a resumable eight-hexagram generation process.
- Generated 64 tracked draft files and 64 public lazy-load bundles:
  379 evidence-backed records and five explicit unavailable Buddhist records.
- Added sentence-to-source/chunk support, contribution roles, source tensions, evidence modes,
  rights status, content hashes, and review status.
- Added style, prohibited-language, school-contamination, rights, exact eight-word overlap, and
  public-field QA.
- Added the typed cached runtime repository and focused commentary panel with six tabs, remembered
  school, loading/unavailable states, source disclosure, and development-only chunk diagnostics.
- Added schemas, shared and school-specific prompt contracts, batch checkpoints, review reports,
  manual-input report, pipeline/rubric/rights/modal documentation, durable `AGENTS.md` rules, and the
  validated `.agents/skills/hexagram-school-synthesis` skill.

## Corpus and review results

- Registered sources: 11
- Raw indexed chunks: 704
- Eligible normalized chunks: 698
- Quarantined chunks: 6
- Coverage cells: 384
- Evidence-backed cells: 379
- Explicit unavailable cells: 5
- Public bundles: 64
- Automated QA passed: 379
- Needs revision: 0
- Blocked for insufficient evidence: 5
- Quotations included: 0
- Jiaoshi Yilin transition sources: 0; transition synthesis excluded

All automated prose remains `draft-only`. A `qa-passed` result is not human editorial approval.

## Verification

Successful commands:

```text
npm.cmd run commentary:check
npm.cmd run check
python .../skill-creator/scripts/quick_validate.py .agents/skills/hexagram-school-synthesis
git diff --check
```

`npm.cmd run check` results:

- strict TypeScript: passed
- ESLint: passed with zero warnings
- Vitest: 20 files, 81 tests passed
- complete commentary validation: 64 bundles, 379 summaries, five unavailable, zero needs-revision
- production build: passed; each commentary JSON is emitted as a separate lazy chunk

Browser inspection against a fresh Vite server:

- 1440×900 desktop: the transformations, central figure/commentary, and Gene Keys panels remain
  within the modal; generated Hexagram 27 content and canonical Gene Key 27 terms render correctly.
- 390×844 mobile: body, modal, modal scroller, and tablist have no horizontal overflow; the six tabs
  remain a readable two-row grid.
- Arrow-key tab navigation and remembered school were verified.
- Hexagram 1 and Hexagram 5 Buddhist cells show explicit unavailable explanations.
- Browser console contained no warnings or errors.

The skill validator initially lacked PyYAML in its bundled Python environment. PyYAML was installed
only into a temporary validation directory; no application or repository dependency was added.

## Rights and distribution boundary

No file under `data/hexagram-commentary/chunked/` or `content/yijing/internal/` is tracked. Both paths
were confirmed ignored. Public artifacts contain no `originalText` or `normalizedText`, set
`quotationIncluded: false`, and expose source/chunk IDs only in development diagnostics.

## Unresolved manual input

- Correct or replace the five quarantined Buddhist records to restore full Buddhist coverage.
- Repair or replace the oversized Confucian source 2 Hexagram 64 chunk; the current Confucian cell
  remains supported by source 1.
- Supply and register a Jiaoshi Yilin corpus only if transition commentary is later requested.
- Human-review the 379 QA-passed drafts batchwise before changing them to `human-approved` or
  `publishable`.

The complete queue is in
[`../../../content/yijing/reports/MANUAL_INPUT_REQUIRED.md`](../../../content/yijing/reports/MANUAL_INPUT_REQUIRED.md).

## Exact next useful action

Human-review the Hexagram 1–8 batch using `content/yijing/reports/review.md`, edit any accepted
revisions in the corresponding draft files, rebuild public artifacts, and record approval separately
from automated QA.

## Preserved unrelated workspace state

The pre-existing untracked cross-device handoff
`docs/continuity/handoffs/20260724T220539Z--master--resume-cross-device-workspace.md` and the
pre-existing untracked `tmp/` Alchemy artifacts were not staged, edited, or removed.
