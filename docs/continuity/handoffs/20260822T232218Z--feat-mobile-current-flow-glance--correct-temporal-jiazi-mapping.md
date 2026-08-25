# Handoff: Correct the Temporal Hexagram Jiazi mapping

- Date (UTC): 2026-08-22
- Branch: `feat/mobile-current-flow-glance`
- Worktree: `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Commit at start/end: `c0c0c716bf2f592b42358b37323913a65435c1dd` (changes remain uncommitted)
- Integration status: feature worktree only; not committed, pushed, or merged

## Objective

Audit the provenance and numbering of Current Flow's Temporal Hexagram Jiazi lookup, replace the
hybrid table only after identifying its source system, validate the intended four omissions, add
real-date fixtures, version snapshots, and keep all existing calendrical boundaries unchanged.

## Reconstructed starting state

The worktree already contained uncommitted mobile-glance, Guidance Output, and Temporal Semantic
Resolver work. Those changes were preserved. The active Jiazi lookup was an anonymous
`Map<string, number>` attributed by comment to Howard Choy. It contained 60 unique entries and 60
unique King Wen IDs but omitted `[2, 4, 44, 49]`.

The original 2026-07-24 handoff explicitly marked that practitioner table for subject-matter
review. No `temporalXkdg.ts`, second Jiazi table, Xuan Kong adapter, Fu Xi index converter, mapping
version, or persisted reading store existed.

## Source audit and conclusion

- Howard Choy's original 2011 post and two image sheets contain 64 rows, with dual assignments for
  甲子, 庚寅, 甲午, and 庚申.
- The old code chose 復 for 甲子 but the pure gua 離, 乾, and 坎 for the other three pairs. It was an
  undocumented hybrid projection, not a faithful Fu Xi or Luo Pan sequence.
- Hu Guozhen's `羅經解定` documents the relevant Luo Pan omission rule: 乾、坤、坎、離 remain
  outside the sixty assignments.
- Two independent full/paired transcriptions and Chinese Metasoft's software reference corroborate
  the four dual pairs and their canonical identities.

The evidence supports the Current Flow target as a specific sixty-gua projection, while preserving
the fact that 64-row/seasonal XKDG variants also exist.

## Implemented

- Created `docs/TEMPORAL_HEXAGRAM_MAPPING_AUDIT.md` before changing the mapping. It records the old
  table, history, classification, omission cause, conversion gaps, sources, and a current 2026
  example.
- Replaced the anonymous map with typed `TemporalHexagramMapping`, `JiaziHexagramEntry`, and source
  metadata under version `liu-shi-jiazi-peigua-king-wen-v1`.
- Stored all 60 entries explicitly with stem, branch, canonical King Wen ID, canonical Chinese and
  English identity, cycle index, and entry-level source reference.
- Corrected exactly three assignments:
  - 庚寅: 30 離 → 49 革
  - 甲午: 1 乾 → 44 姤
  - 庚申: 29 坎 → 4 蒙
- Added strict mapping validation for 60 unique Ganzhi, 60 unique gua, source metadata, identity
  match, and derived/declared omissions `[1, 2, 29, 30]`. The former missing set is rejected.
- Added explicit King Wen normalization for canonical IDs, bottom-line-LSB Fu Xi binary indexes,
  and one-based XKDG Luo Pan positions. “XKDG index” is deliberately narrowed to a Luo Pan position
  and is not confused with Gua Qi or Gua Yun.
- Added versioned real-date fixtures under `fixtures/temporal-hexagram-validation`. Provider tests
  compare raw Ganzhi before comparing the mapped King Wen result.
- Added raw Ganzhi, canonical numbering, mapping system, and mapping version to every live temporal
  item. Snapshot provenance now stores the mapping version, and provider model version is 1.1.0.
- Updated calculation details to render Chinese/English identity, exact bounds, canonical King Wen
  numbering, `六十甲子配卦`, and mapping version.
- Added the full mapping/source/variant/migration reference in
  `docs/SIXTY_JIAZI_HEXAGRAM_MAPPING.md` and updated architecture/integration/source documentation.
- Added accepted decision
  `20260822T231835Z--adopt-versioned-sixty-jiazi-king-wen-projection.md`.

No Ganzhi calculation, Li Chun or solar-term boundary, sect-2 day boundary, two-hour boundary,
BaZi adapter, organ clock, or Global Conditions behavior was modified.

## Verification

Start-of-work isolation:

- `npm run workspace:doctor`
- Result: linked worktree isolation passed on `feat/mobile-current-flow-glance`.

Focused checks after implementation:

- direct strict type check with `vue-tsc -b`: passed;
- focused Vitest run across mapping, numbering, provider, UI provenance, demo provider, and semantic
  resolver: 6 files, 52 tests passed;
- live browser verification at `http://127.0.0.1:5173/`: the current 庚申 hour rendered 4 蒙 /
  Youthful Folly, and expanded provenance rendered exact bounds, King Wen label, system, and version
  without visual overflow.

The bundled `pnpm run check` wrapper was attempted but stopped before running project checks because
the bundled runtime is Node 24 rather than the repository's pinned 22.18.0 and its dependency-status
step refused an ignored `esbuild` build script. No package policy was bypassed or changed.

The exact `check` script constituents were then run directly with the bundled Node runtime and all
passed:

- Type check: passed.
- ESLint with zero warnings: passed.
- Unit tests: 32 files, 197 tests passed.
- Workspace isolation tests: 9 passed.
- Commentary validation: 64 hexagrams, 379 summaries, 5 explicit unavailable records, 0 needs
  revision.
- Transition validation: 64 bundles and 384 draft-only summaries passed.
- Production build: passed; 400 modules transformed.
- `git diff --check`: passed.

Mapping-specific coverage includes:

- exact 60-entry/60-identity completeness;
- exact omissions `[1, 2, 29, 30]` and forbidden old omission rejection;
- all four non-pure dual-pair selections;
- regression proof that only three old assignments changed;
- 乾, 坤, 坎, and 離 conversion in King Wen, Fu Xi binary, and XKDG Luo Pan systems;
- complete duplicate-free Luo Pan order;
- two real 2026 four-pillar fixtures, including a 庚申 → 4 蒙 live hour;
- snapshot and temporal-item mapping version propagation; and
- rendered UI system, version, numbering, Chinese name, and English name.

## Migration and caveats

- The old anonymous mapping is designated `old-current-table`; it did not store a version.
- The repository has no persisted saved-reading/snapshot store. Any external historical snapshot
  without a mapping version must remain legacy output and must not be silently recomputed.
- The current in-memory guidance cache is rebuilt from corrected temporal identities. On the three
  changed Ganzhi, downstream availability or guidance may change; this is the intended consequence
  of correcting canonical identity.
- The seasonal 64-row dual-assignment variant remains unimplemented and would require a new mapping
  ID, version, boundary rule, fixtures, and decision.
- Feature-branch protocol prohibits editing canonical `PROJECT_STATE.md`; it remains unchanged.

## Exact next useful action

Review the source/variant decision and the combined uncommitted branch diff, then commit this
branch's mobile-glance, Guidance Output, Temporal Semantic Resolver, and corrected Temporal Hexagram
mapping work in one authorized integration task. Do not reinterpret historical snapshots during
that integration.
