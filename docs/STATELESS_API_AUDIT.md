# Stateless API audit

## Result

The ordinary FastAPI web process has no process-local authoritative state. One instance may stop or
be replaced without losing application data.

| State                                    | Authority                          | Web-process treatment                         |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------- |
| Shared sourced knowledge and projections | Neo4j/AuraDB                       | Accessed through one async driver per process |
| Release artifacts and staging            | Offline `ObjectStore`/release lake | Never accepted as durable through public HTTP |
| `/app/.cache` and local lake paths       | Disposable cache/staging           | Rebuildable; not a persistence guarantee      |
| Formula workbench drafts                 | Browser device storage             | Outside API authority                         |
| Request IDs and query totals             | One request context                | Discarded after response                      |
| Driver connections                       | One process pool                   | Recreated and closed with lifespan            |

Migrations and approved foundation reconciliation run only in Render pre-deploy. `deploy/start.sh`
starts Uvicorn and performs no mutation or seed. Production demo seeding is refused.

## Retry and idempotency boundary

GETs and deterministic analysis requests are retry-safe when callers reuse the same immutable input.
Administrative ingestion uses stable source/release/import identities, checksums, resumable phases,
and idempotent `MERGE` operations. Future user-facing writes must accept an idempotency key and store
its result in Postgres; process memory is not an idempotency store.

## Future repository ports

Users, authentication identities, birth profiles, saved formulas, notes, subscriptions,
Intelligence threads, explicit memories, and usage accounting belong behind Postgres repository
interfaces. Large source releases, Canon TEI/XML, and exports belong behind the existing object-store
port. Neither belongs in Neo4j merely because the graph driver already exists.

## Background boundary

Bulk ingestion, projection rebuilds, imports, exports, and future embedding runs remain CLI or
worker operations with stable job IDs and resumable stages. They are not ordinary public HTTP
requests. See `BACKGROUND_WORK_BOUNDARY.md`.
