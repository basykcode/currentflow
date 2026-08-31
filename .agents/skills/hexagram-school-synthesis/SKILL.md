---
name: hexagram-school-synthesis
description: Build, regenerate, audit, or review the Current Flow Yijing commentary corpus across Daoist, Buddhist, Confucian, Psychological, Human Design, and Gene Keys lenses. Use for source onboarding, chunk normalization, school-packet synthesis, batch generation, commentary QA, rights checks, or hexagram modal content changes.
---

# Hexagram School Synthesis

Use the repository's evidence pipeline to produce concise, attributable, rights-safe commentary
drafts. Preserve the boundary between internal source evidence and public application content.

## Reconstruct the project state

Before changing content:

1. Follow the repository continuity protocol in `AGENTS.md`.
2. Read `docs/HEXAGRAM_COMMENTARY_PIPELINE.md`,
   `docs/HEXAGRAM_SCHOOL_RUBRICS.md`, and `docs/HEXAGRAM_COMMENTARY_RIGHTS.md`.
3. Inspect `content/yijing/school-registry.json`,
   `content/yijing/source-manifest.json`, coverage reports, and the latest commentary handoff.
4. Treat `src/domain/astrology/hexagrams.ts` and `src/domain/astrology/geneKeys.ts` as the
   canonical identity registries. Do not create competing identity tables.

## Classify the task

- For a new or corrected source, update the source preparation boundary first, then rebuild all
  normalized evidence.
- For a single hexagram editorial revision, inspect that hexagram's internal school packets before
  editing its draft.
- For full regeneration, use the eight-hexagram batch command and preserve reviewed pilot content
  unless the task explicitly replaces it.
- For UI-only work, consume public generated JSON through the commentary repository. Never import
  internal packets, digests, normalized chunks, or raw text into application code.

## Prepare evidence

Evidence preparation and synthesis require the ignored local corpus. If
`CURRENT_FLOW_CODEX_EXECUTION=cloud`, do not fetch, upload, reconstruct, or infer those inputs. A
Cloud task may validate tracked public bundles or change rights-safe rendering, but source onboarding,
packet rebuilding, and draft synthesis must be routed to a rights-approved local worktree.

Run:

```bash
npm run commentary:inventory
npm run commentary:prepare
```

Preparation verifies the source manifest, checksums local chunks, normalizes school aliases, rejects
quarantined records, builds per-source digests, assembles school packets, and writes coverage
reports. The raw and normalized research files are local and Git-ignored.

Stop synthesis for any cell whose packet has `evidenceMode: insufficient`. Do not repair a
misidentified chunk by guessing. Record the unavailable reason instead.

## Synthesize

Read the shared contract in `content/yijing/prompts/school-synthesis-v1.md` and the matching school
rubric under `content/yijing/prompts/schools/`.

Each available record must have:

- one 12–24 word essence;
- one 90–140 word summary in 4–6 sentences;
- original prose with no quotations;
- every sentence mapped to at least one eligible source ID;
- source roles and tensions preserved;
- Human Design mechanics kept conditional on whole-chart context;
- Gene Keys Siddhis presented only as contemplative horizons;
- psychological language that is descriptive and non-diagnostic;
- no prediction, personal prescription, certainty claim, or cross-school terminology leakage.

Write drafts to `content/yijing/drafts/hexagrams/NN.json`. All synthesized records remain
`draft-only` until a human editor approves them.

For deterministic full-corpus scaffolding, run:

```bash
npm run commentary:generate-drafts
```

To resume one batch, call the script with one of the batch starts:

```bash
node scripts/commentary/generate-drafts.mjs 33
```

Valid starts are 1, 9, 17, 25, 33, 41, 49, and 57. Batch state and hashes are written to
`content/yijing/generation-state.json`.

## Build and review

Run:

```bash
npm run commentary:build-public
npm run commentary:validate
npm run commentary:review
```

Inspect `content/yijing/reports/review.md` and `review.json`. Resolve every `needs-revision` record.
Blocked records are valid only when the evidence packet is explicitly insufficient.

The public bundle may contain synthesis, source titles and contributors, source/chunk identifiers,
coverage, rights status, and review metadata. It must not contain source passages, normalized text,
or quotations. Development-only UI disclosure may show source and chunk identifiers; production UI
shows human-readable attribution only.

## Verify interface changes

When commentary rendering changes:

1. Run focused repository, panel, and inspector tests.
2. Open `/tools/hexagrams`, inspect a representative available record and an unavailable record.
3. Test desktop and a narrow mobile viewport.
4. Verify the tablist with Arrow keys, Home, and End; remembered selection; source disclosure;
   loading and unavailable states; and the absence of horizontal overflow.
5. Run `npm run check`.

## Protect provenance and rights

- Never commit `data/hexagram-commentary/chunked/` or `content/yijing/internal/`.
- Never invent licenses, missing metadata, source positions, translations, or traditional
  calculations.
- Keep rights statuses conservative. `user-supplied-internal` and `review-required` evidence may
  support original drafts but does not authorize quotation or public source distribution.
- Treat an automated `qa-passed` status as a technical gate, not human approval.
- Update reports, documentation, continuity state, and a task-specific handoff whenever tracked
  outputs or workflow boundaries change.
