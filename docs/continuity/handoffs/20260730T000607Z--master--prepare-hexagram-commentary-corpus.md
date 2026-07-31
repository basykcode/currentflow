# Handoff: Prepare hexagram commentary corpus

- UTC timestamp: 2026-07-30T00:06:07Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `35a3bb2b23be7bc0f1ac9269199e78c89cab32f5`
- Task/objective: Download the previous application's per-hexagram commentary data, add and
  similarly chunk four supplied sources under the requested labeling scheme, and prepare the result
  for later source-grounded UI synthesis.
- Status: complete with one source-identity blocker and two quarantined inherited chunks

## Starting context

Local `master` matched `origin/master` at `35a3bb2`. The pre-existing untracked cross-device handoff
and `tmp/` Alchemy artifacts were recorded and left untouched. The active frontend had the shared
hexagram inspector and six unavailable commentary tabs, but no local commentary corpus or ingestion
contract.

The legacy public repository stored seven source directories, each intended to contain
`hex_01.txt` through `hex_64.txt`. Its parser history also showed that an earlier Daoist 2 attempt
was excluded from synthesis.

## Work completed

- Pinned and inspected legacy repository commit
  `ed959364eba06e2d41d51f7655e381a7bf97fd19`.
- Imported its seven existing source directories byte-for-byte into the local Git-ignored corpus.
- Extracted exactly 64 explicit chapter boundaries from each valid new source:
  - `psychological_2_balkin`
  - `psychological_3_dening`
  - `gene_keys_2_rudd`
- Inspected the supplied Wang Bi PDF and registered `daoist_2_wang_bi` as blocked. The file is
  *The Classic of the Way and Virtue*, an 81-section Daodejing commentary, not a
  hexagram-organized *Classic of Changes*. No crosswalk or empty placeholder files were fabricated.
- Added a reproducible local preparation script.
- Added a source manifest, one-row-per-chunk JSONL index, SHA-256 hashes, coverage/status fields,
  rights status, and an audit report.
- Quarantined two inherited boundary anomalies:
  - `buddhist_1_cleary/hex_17.txt` contains only a heading and page number.
  - `confucian_2_legge/hex_64.txt` is an extreme size outlier that appears to include
    post-hexagram material.
- Kept all 640 full-text files local-only under a Git-ignored directory. Trackable files contain no
  commentary body, local source path, or download-site filename.
- Documented the architecture/data boundary and accepted a rights/provenance decision.

## Files or components changed

- `.gitignore`
- `scripts/prepare_hexagram_commentary.py`
- `data/hexagram-commentary/README.md`
- `data/hexagram-commentary/manifest.json`
- `data/hexagram-commentary/chunk-index.jsonl`
- `data/hexagram-commentary/audit.json`
- local-only `data/hexagram-commentary/chunked/` corpus
- `docs/ARCHITECTURE.md`
- `docs/DATA_INTEGRATION.md`
- `docs/CALCULATION_SOURCES.md`
- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/decisions/20260730T000122Z--keep-proprietary-hexagram-commentary-local-and-provenance-indexed.md`

## Decisions made

- [Keep proprietary hexagram commentary local and provenance-indexed](../decisions/20260730T000122Z--keep-proprietary-hexagram-commentary-local-and-provenance-indexed.md)

## Important rationale

Public availability of a prior application's copy does not establish redistribution rights for the
underlying commercial books. Keeping full passages local while tracking source identity, hashes,
coverage, and eligibility gives the next synthesis pass an auditable corpus without placing
copyrighted text into Git history or the frontend bundle.

An explicit chapter boundary is required for every hexagram mapping. The supplied Wang Bi work
cannot satisfy that requirement because its sections are Daodejing sections 1-81.

## Verification commands and results

- PDF metadata/outline inspection with `pypdf` - Dening exposed 64 numbered bookmarks; the Wang Bi
  PDF identified the Daodejing and 81-section structure.
- Poppler render inspection - the Dening Hexagram 1 opening and Wang Bi section 1 opening were
  visually checked against extracted text and confirmed the detected structures.
- `python -m py_compile scripts/prepare_hexagram_commentary.py` - passed.
- Full preparation command - produced 640 chunks across ten directories, 638
  ingestion-eligible records, two quarantined records, and one blocked source.
- Immediate second preparation run - all ten chunk-bundle hashes were identical.
- Independent manifest/index validator - verified 11 unique source records, 640 unique
  source/hexagram keys, every file hash/size/character count, expected new-source headings, no Wang
  chunk directory, no tracked full text, and no local paths or download-site labels in metadata.
- `git check-ignore` - confirmed a representative full-text chunk is ignored by the explicit
  commentary rule.
- `git diff --check` - passed.
- `npm.cmd run check` - passed strict Vue/TypeScript checking, zero-warning ESLint, all 74 Vitest
  tests across 17 files, and the production Vite build.

## Known risks and assumptions

- The preparation validates structure and extraction integrity, not the interpretive accuracy of
  every passage. New sources received boundary spot-checks at Hexagrams 1, 2, 28, and 64.
- The inherited corpus is preserved rather than silently corrected. Its two known malformed
  records remain non-eligible.
- Full-text rights remain review-required and local-only. Derived summaries need separate human and
  publication review.
- The Git-ignored corpus must be rebuilt or securely transferred on another workstation; the
  trackable manifest alone contains no source prose.

## Unresolved issues

- Obtain Wang Bi's hexagram-organized *Classic of Changes* for `daoist_2_wang_bi`.
- Repair or replace the two quarantined legacy chunks before claiming a complete 640-of-640 eligible
  corpus.
- Define the derived OLTR/summary schema and review workflow in the next task.

## Uncommitted or unmerged state

All scoped preparation code, metadata, documentation, decision, and this handoff remain uncommitted
on local `master`. The 640 full-text chunks remain intentionally untracked and ignored. No commit,
push, merge, branch switch, or production publication was authorized or performed. The unrelated
pre-existing handoff and Alchemy `tmp/` artifacts remain untouched.

## Exact next recommended action

Provide the hexagram-organized Wang Bi source, then repair the two quarantined legacy records before
generating source-grounded OLTRs and detailed summaries from `ingestion_eligible: true` chunks.

## Relevant files, commits, issues, or external references

- [`../../../data/hexagram-commentary/README.md`](../../../data/hexagram-commentary/README.md)
- [`../../../data/hexagram-commentary/manifest.json`](../../../data/hexagram-commentary/manifest.json)
- [`../../../data/hexagram-commentary/audit.json`](../../../data/hexagram-commentary/audit.json)
- [`../../../scripts/prepare_hexagram_commentary.py`](../../../scripts/prepare_hexagram-commentary.py)
- [Legacy chunk directory](https://github.com/BenKalish42/current-almanac/tree/master/data/chunked)
- Starting commit `35a3bb2b23be7bc0f1ac9269199e78c89cab32f5`
- Reference corpus commit `ed959364eba06e2d41d51f7655e381a7bf97fd19`
