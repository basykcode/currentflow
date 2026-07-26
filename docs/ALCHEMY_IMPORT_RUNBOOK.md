# Alchemy import runbook

## Prerequisites

Use Python 3.12, `uv`, and Neo4j 5.26. Configure `NEO4J_*`, a truthful PubChem contact user agent,
and optionally `ALCHEMY_DATA_ROOT`. Do not store credentials in source.

```powershell
cd services/alchemy-api
uv sync --frozen --all-groups
uv run alchemy db verify
uv run alchemy db migrate
uv run alchemy sources validate
```

## Plan and acquire a release

```powershell
uv run alchemy downloads plan source:disease-ontology --release v2026-06-30
uv run alchemy downloads fetch source:disease-ontology --release v2026-06-30
uv run alchemy downloads verify source:disease-ontology --release v2026-06-30
```

Review the resolved manifest and checksum report under
`var/alchemy-data/raw/source%3Adisease-ontology/v2026-06-30`. A byte or SHA mismatch is a hard
failure. Do not edit the raw artifact to make it pass.

## Inspect with no graph writes

```powershell
uv run alchemy ingest source:disease-ontology `
  --release v2026-06-30 `
  --through graph `
  --dry-run `
  --mode subset `
  --subset-limit 250 `
  --batch-size 500
```

Inspect all reports, especially rights, rejects, unresolved mappings, schema, nulls, duplicates,
and audit summary. For a full release use `--mode full` after the subset passes.

## Load and prove idempotency

```powershell
uv run alchemy ingest source:disease-ontology `
  --release v2026-06-30 `
  --through graph `
  --mode subset `
  --subset-limit 250 `
  --batch-size 500
uv run alchemy graph counts
# Repeat the same ingest and confirm counts are unchanged.
uv run alchemy graph audit
uv run alchemy graph provenance disease:doid:0001816
uv run alchemy graph rebuild-projections
```

`--resume` continues from a checkpoint after an interrupted run. Do not use a dry-run checkpoint to
claim a graph was loaded; perform a non-dry run without `--resume` first.

## Reports

```powershell
uv run alchemy reports build source:disease-ontology --release v2026-06-30
uv run alchemy reports open source:disease-ontology --release v2026-06-30
```

The release summary must state exact commands, counts, rejects, unresolved fields, rights status,
audit results, and versions. Commit manifests and code, never downloaded source artifacts.

## Failure recovery

- Download interruption: rerun `downloads fetch`; a valid partial response may resume.
- Hash mismatch or HTML response: remove only the named invalid `.part` file after inspection and
  verify the official URL/manifest.
- Schema drift: stop, update the adapter and fixture, increment schema/adapter versions, and create
  a new release report.
- Rejects or count drift: do not project; fix or explicitly disposition every record.
- Critical graph audit: preserve the report, repair evidence/mappings, rerun load and audit, then
  rebuild projections.
- Manual-only source: follow `ALCHEMY_DATA_PIPELINE.md` and `MANUAL_DATA_ACQUISITION.md`; never add
  browser automation or credentials to bypass the gate.

## Verification

```powershell
uv run alchemy check
cd ../..
npm.cmd run check
```

CI additionally runs the source/rights checks and a disposable Neo4j integration test.
