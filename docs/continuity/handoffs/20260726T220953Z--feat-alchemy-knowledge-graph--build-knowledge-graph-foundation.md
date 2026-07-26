# Handoff: Build the release-aware Alchemy knowledge foundation

- UTC timestamp: 2026-07-26T22:09:53Z
- Branch/worktree: `feat/alchemy-knowledge-graph` /
  `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `c839ad593762c31d8d682ff5a0ed09c3dd0a8668`
- Feature commit: `e24f4403248e7c988b4f1e2e70faf7f8030e9399`
- Task/objective: Establish the provenance-first, rights-aware source/release data foundation and
  prove one real source through Neo4j.
- Status: implementation and local verification complete; committed and unmerged

## Starting context

The integrated FastAPI/Neo4j backend already had strict domain/API models, migrations, an async
repository, synthetic data, limited legacy adapters, a CLI, and an OpenAPI seam used by the Vue
frontend. It did not have a release lake, machine source/rights registry, canonical/source-record
separation, reified mappings/observations/formula witnesses, or production projection audits.

`master`, `origin/master`, and HEAD were all `c839ad5`. The untracked handoff
`20260724T220539Z--master--resume-cross-device-workspace.md` predated the task and was preserved
untouched. The user authorized creating the feature branch; no push, merge, rebase, or deletion was
authorized.

## Work completed

- Created and switched to `feat/alchemy-knowledge-graph`.
- Added validated source-registry/release-manifest models for 36 candidate sources and a
  deny-by-default rights engine with row-level inheritance and separate approved/share-alike/
  pending projections.
- Added an immutable local/object-store-compatible release lake, resumable/atomic verified
  downloader, checkpoints, manual-instruction output, and generated reports.
- Added phased adapter/pipeline contracts, DuckDB staging, Parquet normalized/graph exports, and
  allowlisted batched Neo4j loading.
- Added stable canonical/source identity, reified `MappingAssertion`, `Claim`,
  formula-witness/ingredient-use, occurrence/bioactivity/toxicity/exposure observations, and a
  separate prediction model.
- Added Neo4j migrations `003`–`005`, 20 graph audit checks, graph counts/provenance commands, and
  approved-projection rebuilding.
- Added the new `sources`, `downloads`, `ingest`, `graph`, and `reports` CLI workflow while keeping
  legacy administration commands.
- Preserved the checked-in public OpenAPI contract byte-for-byte.
- Added a visibly synthetic comprehensive graph fixture covering ambiguity, rejection, mixed
  rights, prepared materials, formula witnesses, observations, predictions, and provenance.
- Added the Disease Ontology OBO adapter and pinned official `v2026-06-30` release manifest.
- Added CI source/rights audits and post-integration graph audit.
- Added architecture, data dictionary, pipeline, identity, rights, source-register, permission,
  manual acquisition, and import-runbook documentation.

## Real release evidence

The official Disease Ontology OBO artifact was downloaded from the pinned `v2026-06-30` tag.

- Observed bytes: `7,162,791`
- SHA-256: `079fbbfc6d39f5d6c87b7ad1d2db2e058916584aefdcde0a42156860edae2bbc`
- Available terms: `14,735`
- Deterministic subset: `250` terms, `188` aliases, `528` xrefs, `195` parent records
- Null definitions: `18`
- Normalization rejects: `0`
- Parents outside subset, reported unresolved: `183`
- Export/load: `1,966` release-owned nodes and `2,672` relationships
- Global graph after migration/projection metadata: `1,972` nodes and `2,672` relationships
- Second identical import: same counts
- Graph audit: zero critical failures
- Provenance sample: `disease:doid:0001816` → source record → release → Human Disease Ontology /
  CC0 1.0 / deterministic import run

Downloaded OBO, raw/resolved manifests, DuckDB, Parquet, graph exports, reports, caches, and logs are
under ignored `var/alchemy-data` and are not part of Git.

## Verification commands and truthful results

- `uv run alchemy sources validate` — passed; 36 sources and one release manifest.
- `uv run alchemy downloads plan/fetch/verify source:disease-ontology --release v2026-06-30` —
  passed exact byte and SHA-256 verification.
- `uv run alchemy ingest source:disease-ontology --release v2026-06-30 --through graph --dry-run
  --mode subset --subset-limit 250 --batch-size 500` — passed with zero rejects/critical failures.
- The same non-dry ingest run twice against disposable Neo4j — both passed; graph counts unchanged.
- `uv run alchemy graph audit` — passed with zero critical failures.
- `uv run alchemy graph provenance disease:doid:0001816` — returned the complete release/license
  path.
- `uv run alchemy graph rebuild-projections` — passed for 250 source records/canonical entities.
- `uv run pytest -m integration -vv` — passed 1 integration test against clean Neo4j 5.26.28.
- `uv run alchemy check` — passed formatting, Ruff, MyPy across 50 source files, 33
  non-integration tests, and OpenAPI contract check.
- `npm.cmd run check` — passed strict TypeScript, zero-warning ESLint, 74 frontend tests, and Vite
  production build.
- `git diff --check` — passed.

The disposable Neo4j listener was stopped after verification. Its portable Neo4j/JRE files remain
under the task-specific system temporary directory and do not affect the repository.

## Manual acquisition status

No manual gate was reached. Disease Ontology had an official public machine-readable artifact.
Permission-pending and blocked sources stayed disabled and were not scraped or ingested. No
external AI service was called.

## Known risks and assumptions

- The real slice validates an ontology path, not yet a natural-products occurrence or
  bioactivity/toxicity release.
- The checked-in release manifest deliberately starts with environment verification/audit flags
  false; local acquisition creates the ignored resolved manifest with observed metadata and true
  flags.
- Full-release performance has not been benchmarked; the subset proves batching and semantics.
- Share-alike policy and fixtures are implemented, but no full share-alike source was imported.
- Vector indexing is deferred until an embedding/reproducibility/rights decision exists.
- Neo4j emits harmless unknown-token notifications for audit predicates whose labels/properties do
  not yet occur in a particular sparse fixture graph.

## Uncommitted or unmerged state

The feature is committed as `e24f440` on `feat/alchemy-knowledge-graph`. This handoff and the
reconciled project-state update are pending a documentation commit. The unrelated pre-existing
untracked handoff remains unmodified.

## Exact next recommended action

Review the feature diff and create coherent scoped commits if authorized. After integration, pin an
official LOTUS release, implement its occurrence adapter/fixture, and run a deterministic subset
through the same rights, staging, mapping, Neo4j, provenance, and idempotency gates.

## Relevant files, decisions, and external references

- [Knowledge architecture](../../ALCHEMY_GRAPH_ARCHITECTURE.md)
- [Import runbook](../../ALCHEMY_IMPORT_RUNBOOK.md)
- [Source register](../../ALCHEMY_SOURCE_REGISTER.md)
- [Rights policy](../../ALCHEMY_RIGHTS_AND_LICENSING.md)
- [Decision record](../decisions/20260726T220215Z--establish-release-aware-alchemy-knowledge-foundation.md)
- Disease Ontology release:
  `https://github.com/DiseaseOntology/HumanDiseaseOntology/releases/tag/v2026-06-30`
