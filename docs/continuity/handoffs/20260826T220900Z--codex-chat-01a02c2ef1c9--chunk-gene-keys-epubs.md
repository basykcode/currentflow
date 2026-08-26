# Handoff: Chunk the two Richard Rudd Gene Keys EPUBs

- UTC timestamp: 2026-08-26T22:09:00Z
- Branch/worktree: `codex/chat-01a02c2ef1c9` / this task's app-managed linked worktree
- Starting commit: `ddb58c291f9c97d2fa66f5e26c986bd02bd39b6a`
- Status: complete as a local-only source refresh; not integrated into tracked commentary evidence

## Objective

Split the user-supplied EPUBs for Richard Rudd's *Gene Keys* and *The 64 Ways* into one complete
plain-text file per Gene Key, with exactly 64 files in each local source folder.

## Work completed

- Claimed the managed worktree lease and branch, then passed the workspace doctor boundary.
- Added a focused, reproducible local extractor at `scripts/chunk_gene_keys_epubs.py`.
- Extended the shared EPUB text helper so *Gene Keys* includes visible spectrum labels stored in
  table cells as well as headings, paragraphs, lists, and blockquotes.
- Extracted all visible chapter text to UTF-8 `.txt` files with source wording and punctuation
  preserved. EPUB layout whitespace is normalized; scripts, styles, navigation, SVG markup, and
  non-text binary assets are excluded.
- Wrote exactly `hex_01.txt` through `hex_64.txt` beneath each ignored local folder:
  - `data/hexagram-commentary/chunked/gene_keys_1_rudd/`
  - `data/hexagram-commentary/chunked/gene_keys_2_rudd/`
- Kept both full-text folders Git-ignored and out of tracked artifacts.

## Integrity results

- `gene_keys_1_rudd`
  - input SHA-256: `ad50c5de17ca7914695fc267ecb39ad175a949522818ffa9c8775d5f08813270`
  - bundle SHA-256: `b935f215329b14fc956c6ebf0573ae24c43c36fc2dce9bc018d7eec7eb08c599`
  - 64 non-empty UTF-8 files; 1,514,669 characters total
- `gene_keys_2_rudd`
  - input SHA-256: `492ea164d3027de80a9e12475f5108cfc97c29ef38b1178f9fffa318fc552f3a`
  - bundle SHA-256: `7d8dbfa79ff20c461715fe351d05853042d1a699aaeeb9c48a09b5ea5893bca0`
  - 64 non-empty UTF-8 files; 986,916 characters total

The supplied *The 64 Ways* EPUB and all 64 extracted chunks match the currently tracked integrity
metadata exactly. The supplied *Gene Keys* EPUB produces zero matches against the 64 older legacy
chunk hashes. The new files therefore were not silently substituted into `manifest.json`,
`chunk-index.jsonl`, normalized packets, drafts, or public bundles: those artifacts still cite the
older legacy evidence and would otherwise carry false provenance.

## Verification

- Both EPUB structures exposed 64 explicit, unique source boundaries.
- *Gene Keys* chapters were identified by their numbered Shadow headings and required corresponding
  Gift and Siddhi headings; every visible chapter text node was accounted for, including table
  cells.
- *The 64 Ways* chapters were identified by exact `Gene Key N` headings; all 64 reproduced the
  tracked hashes.
- Both output folders contain only the exact `hex_01.txt` through `hex_64.txt` filename set; every
  file is non-empty and valid UTF-8.
- Representative files passed the explicit Git-ignore rule.
- Python compilation passed for both extraction scripts.
- `git diff --check` passed, and tracked changes contain no local download path or source passage.
- The repository's type check, zero-warning lint, 122 unit tests, 11 workspace-isolation tests,
  commentary validation, transition validation, and production build all passed when invoked
  directly through the bundled runtime. The literal `npm run check` launcher was unavailable in
  this desktop runtime; bundled pnpm also stopped at its build-approval gate before invoking any
  script, so the same check components were run directly.

## Tracked changes

- `scripts/chunk_gene_keys_epubs.py`
- `scripts/prepare_hexagram_commentary.py`
- `data/hexagram-commentary/README.md`
- this handoff

No commit, merge, rebase, push, branch switch, archive, deletion, or public commentary regeneration
was performed.

## Exact next useful action

If the supplied *Gene Keys* EPUB should replace the legacy evidence source, run a separately
authorized full provenance adoption: update the tracked source/index hashes, rebuild normalized
evidence and Gene Keys packets, revalidate every affected sentence mapping, regenerate the derived
draft/public bundles, and obtain human editorial review. Do not remap the existing chunk IDs alone.
