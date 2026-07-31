# Hexagram commentary pipeline

## Outcome

Current Flow builds six source-grounded interpretive lenses for each King Wen hexagram while
keeping protected source passages outside Git and outside the browser bundle. The application ships
only original draft synthesis, human-readable attribution, compact provenance, coverage, rights,
and review status.

The six canonical school IDs, in display order, are:

1. `daoist`
2. `buddhist`
3. `confucian`
4. `psychological`
5. `human-design`
6. `gene-keys`

Aliases are accepted only at ingestion. All stored and runtime records use canonical IDs.

## Data boundaries

| Boundary | Location | Tracked | May contain source prose | Runtime import |
| --- | --- | --- | --- | --- |
| Raw prepared chunks | `data/hexagram-commentary/chunked/` | No | Yes | Never |
| Normalized chunks, digests, packets | `content/yijing/internal/` | No | Yes | Never |
| Manifests, schemas, reports | `content/yijing/` | Yes | No protected passages | Build/review only |
| Editorial drafts | `content/yijing/drafts/hexagrams/` | Yes | Original synthesis only | No |
| Public bundles | `content/yijing/generated/hexagrams/` | Yes | Original synthesis only | Lazy-loaded |

The canonical hexagram identity registry remains `src/domain/astrology/hexagrams.ts`. The canonical
Gene Keys spectrum remains `src/domain/astrology/geneKeys.ts`.

## Stages

### 1. Inventory and normalization

`npm.cmd run commentary:inventory` verifies the source and school registries, normalizes aliases,
counts sources and chunks, identifies duplicates, and reports ambiguous records.

`npm.cmd run commentary:normalize` verifies each eligible local file against its indexed SHA-256,
normalizes Unicode and whitespace without changing the original file, assigns a stable chunk ID,
and writes local research records. The stable form is:

```text
<source-id>:hex-<NN>:<first-12-checksum-characters>
```

### 2. Coverage, digests, and school packets

`npm.cmd run commentary:coverage` creates the 64×6 coverage matrix. A cell is available only when
at least one eligible registered source contributes direct evidence.

`npm.cmd run commentary:build-digests` extracts source-local claims and vocabulary. It does not
synthesize across sources.

`npm.cmd run commentary:build-packets` joins eligible digests for one hexagram and one school,
retaining shared emphases, distinct emphases, source tensions, contribution statuses, evidence
mode, coverage, and publication eligibility.

`npm.cmd run commentary:prepare` runs all four preparation stages.

### 3. Draft synthesis

The reviewed Hexagram 5 pilot is preserved at
`content/yijing/drafts/hexagrams/05.json`. Deterministic editorial scaffolding for the remaining
hexagrams uses `content/yijing/editorial-dynamics.json`; it contains thematic abstractions, not
source quotations or a second identity registry.

`npm.cmd run commentary:generate-drafts` processes eight King Wen numbers at a time and writes a
checkpoint under `content/yijing/reports/batches/`. It may be resumed with:

```powershell
node scripts/commentary/generate-drafts.mjs 33
```

Valid starts are `1`, `9`, `17`, `25`, `33`, `41`, `49`, and `57`. The process does not overwrite
the reviewed Hexagram 5 pilot. `content/yijing/generation-state.json` records batch completion and
draft hashes.

### 4. Public build and QA

`npm.cmd run commentary:build-public` joins each draft to its internal evidence packet, resolves
human-readable attribution, maps sentences to chunk IDs, checks source availability and rights,
runs style and cross-school contamination checks, and warns on exact eight-word source overlap.

`npm.cmd run commentary:validate` requires 64 bundles, six unique school records per bundle,
complete sentence support, zero quotations, and clean unavailable records.

`npm.cmd run commentary:review` writes public-prose review reports and the manual-input queue.

`npm.cmd run commentary:check` rebuilds the local evidence and every derived artifact. It requires
the ignored local source corpus. The ordinary `npm.cmd run check` validates the already generated
public corpus and does not require protected files.

## Evidence and review states

- `multi-source-direct`: two or more eligible direct sources.
- `single-source-direct`: one eligible direct source.
- `direct-plus-framework`: direct commentary plus a separately identified framework.
- `framework-applied`: clearly labeled framework application without direct commentary.
- `insufficient`: no eligible evidence; public prose must be empty.

Automated review statuses are `qa-passed`, `needs-revision`, or `blocked`. `qa-passed` means the
technical evidence, style, and rights gates passed. It is not human approval. Publication remains
`draft-only` until a human editor changes the record to `human-approved` and separately accepts its
publication eligibility.

## Current coverage

The corpus registers 11 sources and 704 raw King Wen files. Six source records are quarantined,
leaving 698 eligible chunks. The resulting matrix has 379 evidence-backed cells and five explicitly
unavailable cells: Buddhist Hexagrams 1, 5, 6, 7, and 17. No Jiaoshi Yilin transition corpus is
registered; transition synthesis is excluded rather than inferred.
