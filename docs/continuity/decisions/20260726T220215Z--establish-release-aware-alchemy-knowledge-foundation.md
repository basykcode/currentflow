# Decision: Establish a release-aware Alchemy knowledge foundation

- Status: accepted
- Date (UTC): 2026-07-26
- Scope: data architecture, graph identity, provenance, rights, and offline ingestion

## Context

The Alchemy service had a provenance-first API and synthetic/limited adapters, but lacked a durable
release registry, immutable acquisition layer, canonical/source-record separation, identity
assertions, rights-aware projections, and a reproducible real-source load. Adding more traditional,
chemical, biological, literature, and toxicity sources without these controls would create
irreversible identity and licensing ambiguity.

## Constraints and requirements

- Neo4j remains the only persistent operational database.
- Every displayed or projected datum needs provenance or explicit unavailability.
- Source facts and traditional formula witnesses must not be overwritten by canonical convenience.
- Name/fuzzy matching cannot silently merge identities.
- Rights, checksums, rejects, and schema drift must block production projection by default.
- Acquisition must be offline, explicit, resumable, and free of runtime API network calls.
- The existing public FastAPI/OpenAPI contract must remain stable.

## Options considered

1. **Load normalized rows directly into existing canonical labels** — smaller initial change, but
   loses release-owned records, mapping rationale, and reversible identity. Rejected.
2. **Use a second persistent relational database for manifests and staging** — familiar for ETL but
   adds an operational datastore and conflicts with the accepted service boundary. Rejected.
3. **Use immutable release files plus rebuildable DuckDB/Parquet staging and a reified Neo4j
   evidence graph** — preserves source truth, supports batch operations, and keeps one persistent
   application database. Selected.

## Decision

Maintain a machine-readable source/rights registry and one immutable manifest per source release.
Acquire artifacts only through explicit administration commands, verify exact size and SHA-256, and
store them under a local/object-store-compatible release lake.

Stage and inspect releases in DuckDB, export normalized and graph-ready Parquet, and load Neo4j with
parameterized allowlisted batches. Preserve each upstream row as a `SourceRecord`. Reify claims,
mapping assertions, formula witnesses/ingredient uses, and observations. Keep predictions separate.

Permit automatic identity only for authoritative exact external identifiers or exact chemical
InChIKeys. Names and fuzzy matches remain proposed review items.

Compute production eligibility with a deny-by-default rights policy inherited at row level. Allow
projection rebuilds only after critical graph audits pass. Treat direct canonical relationships as
regenerable projections, never the authoritative evidence.

Use Disease Ontology `v2026-06-30` as the first real, pinned, automatically acquired slice. Keep
permission-pending and blocked source adapters disabled.

## Consequences and tradeoffs

- Source truth, release/version lineage, mapping rationale, and licensing are queryable end to end.
- Re-runs are deterministic and graph-count stable.
- The graph contains more nodes and relationships than a direct canonical import.
- Full releases require more disk and transformation time, but raw artifacts remain immutable and
  derived layers are rebuildable.
- Release approval does not automatically approve future releases.
- Vector search is deferred until model, dimension, reproducibility, and rights decisions exist.

## Implementation or migration implications

- Migrations `003`–`005` add evidence/canonical constraints, indexes, and projection metadata.
- `data/source-registry` and `data/manifests/releases` become machine governance inputs.
- `var/alchemy-data` is ignored and holds raw/derived/report state.
- The new `alchemy sources`, `downloads`, `ingest`, `graph`, and `reports` commands are offline
  administrative interfaces.
- The public HTTP/OpenAPI contract remains byte-for-byte unchanged.

## Verification criteria

- Registry and manifests validate with 36 uniquely identified sources and one pinned real release.
- The pinned artifact passes exact byte and SHA-256 verification.
- A deterministic real subset stages, normalizes, exports, loads, and audits with no silent rejects.
- Repeating the load leaves graph counts unchanged.
- A canonical disease returns its source-record, release, source, license, and import-run path.
- Fuzzy/name candidates cannot be accepted automatically.
- Backend, Neo4j integration, and root checks pass.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../ALCHEMY_GRAPH_ARCHITECTURE.md`](../../ALCHEMY_GRAPH_ARCHITECTURE.md)
- [`../../ALCHEMY_DATA_PIPELINE.md`](../../ALCHEMY_DATA_PIPELINE.md)
- [`../../ALCHEMY_RIGHTS_AND_LICENSING.md`](../../ALCHEMY_RIGHTS_AND_LICENSING.md)
- [`../../../services/alchemy-api/data/source-registry/sources.yaml`](../../../services/alchemy-api/data/source-registry/sources.yaml)
