# Handoff: Add Wang Bi hexagram commentary

- UTC timestamp: 2026-07-30T00:22:50Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `35a3bb2b23be7bc0f1ac9269199e78c89cab32f5`
- Task/objective: Replace the blocked Daoist 2 source with the user-supplied Wang Bi
  *Classic of Changes* EPUB and prepare its 64 hexagram sections for later ingestion.
- Status: complete and uncommitted

## Starting context

The local commentary-preparation workstream was already uncommitted on `master`. It contained seven
byte-preserved legacy sources, three newly extracted sources, and a blocked `daoist_2_wang_bi`
record for an earlier, incorrect Daodejing PDF. Two legacy chunks were quarantined. The unrelated
pre-existing cross-device handoff and `tmp/` Alchemy artifacts were present and left untouched.

## Work completed

- Verified the corrected EPUB metadata:
  - *The Classic of Changes*
  - *A New Translation of the I Ching as Interpreted by Wang Bi*
- Inspected the EPUB spine and found exactly 64 explicit `HEXAGRAM N` section markers in King Wen
  order across its four hexagram-commentary XHTML files.
- Replaced the blocked-source inspection path with a `--wang-bi-epub` input and deterministic
  extractor.
- Generated `daoist_2_wang_bi/hex_01.txt` through `hex_64.txt`, retaining each marked section's
  judgment, image, line commentaries, and notes up to the next marked hexagram.
- Updated the manifest and audit so Daoist 2 is ready with 64/64 chunks and no blocked sources.
- Rebuilt the complete local corpus:
  - 11 source directories
  - 704 total chunks
  - 702 ingestion-eligible chunks
  - 2 quarantined legacy chunks
- Updated data-integration, calculation-source, staging, and project-state documentation.
- Preserved the accepted local-only rights boundary. Full commentary remains Git-ignored; tracked
  metadata contains hashes and provenance but no source prose, local paths, or download-site names.

## Files or components changed

- `scripts/prepare_hexagram_commentary.py`
- `data/hexagram-commentary/README.md`
- `data/hexagram-commentary/manifest.json`
- `data/hexagram-commentary/chunk-index.jsonl`
- `data/hexagram-commentary/audit.json`
- local-only `data/hexagram-commentary/chunked/daoist_2_wang_bi/`
- `docs/DATA_INTEGRATION.md`
- `docs/CALCULATION_SOURCES.md`
- `docs/continuity/PROJECT_STATE.md`
- this handoff

The other files from the original uncommitted commentary-preparation workstream remain part of the
same pending change set.

## Decisions and rationale

No new architecture decision was needed. The accepted
[local-only commentary decision](../decisions/20260730T000122Z--keep-proprietary-hexagram-commentary-local-and-provenance-indexed.md)
already specified that Daoist 2 could be enabled when a hexagram-organized Wang Bi
*Classic of Changes* arrived. The corrected EPUB fulfills that condition with explicit 1-64
boundaries; no inferred crosswalk is used.

## Verification commands and results

- EPUB metadata and spine inspection with `zipfile` and `lxml` - verified the title/subtitle and
  exactly 64 ordered section markers: 1-15, 16-33, 34-49, and 50-64 across four files.
- `python -m py_compile scripts/prepare_hexagram_commentary.py` - passed.
- Full preparation command - produced 704 chunks across 11 directories, 702 ingestion-eligible
  records, two quarantined records, and zero blocked sources.
- Immediate repeated preparation runs - all 11 chunk-bundle hashes were identical.
- Independent manifest/index validator - verified:
  - 11 unique sources and 704 unique source/hexagram records;
  - exactly `hex_01.txt` through `hex_64.txt` for every source;
  - every file SHA-256, byte count, character count, and source bundle hash;
  - every Wang Bi chunk begins with its matching explicit `HEXAGRAM N` marker;
  - no tracked full-text chunk and no local path or download-site label in tracked metadata.
- Representative Wang Bi boundaries at Hexagrams 1, 2, 15/16, 33/34, 49/50, and 64 - passed.
- `git diff --check` - passed.
- `npm.cmd run check` - passed strict Vue/TypeScript checking, zero-warning ESLint, all 74 Vitest
  tests across 17 files, and the production Vite build.

## Known risks and unresolved work

- Extraction integrity and section boundaries are verified; interpretive accuracy and future
  summaries still require human review.
- `buddhist_1_cleary/hex_17.txt` and `confucian_2_legge/hex_64.txt` remain quarantined and
  non-ingestion-eligible.
- Full-text rights remain local-review-required. Derived OLTRs and summaries need a separately
  reviewed publication boundary.
- The ignored corpus must be rebuilt or securely transferred on another workstation.

## Uncommitted or unmerged state

The complete commentary-preparation workstream remains uncommitted on local `master`. No commit,
push, merge, branch switch, or production publication was authorized or performed. The unrelated
pre-existing handoff and Alchemy `tmp/` artifacts remain untouched.

## Exact next recommended action

Repair or replace the two quarantined legacy chunks, then define the source-grounded OLTR/summary
schema and human-review workflow using only `ingestion_eligible: true` records.

## Relevant files and references

- [`../../../data/hexagram-commentary/README.md`](../../../data/hexagram-commentary/README.md)
- [`../../../data/hexagram-commentary/manifest.json`](../../../data/hexagram-commentary/manifest.json)
- [`../../../data/hexagram-commentary/audit.json`](../../../data/hexagram-commentary/audit.json)
- [`../../../scripts/prepare_hexagram_commentary.py`](../../../scripts/prepare_hexagram_commentary.py)
- [Original preparation handoff](20260730T000607Z--master--prepare-hexagram-commentary-corpus.md)
- Starting commit `35a3bb2b23be7bc0f1ac9269199e78c89cab32f5`
- Reference corpus commit `ed959364eba06e2d41d51f7655e381a7bf97fd19`
