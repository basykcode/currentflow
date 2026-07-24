# Decision: Establish a provenance-first Alchemy graph service

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: Alchemy architecture, data governance, public API, and safety boundaries

## Context

Current needs a backend truth layer for sourced materia-medica research, formula inspection and
comparison, constrained relationship exploration, and passage retrieval. The existing Vue
application remains a static client, while herbal identities, source disagreement, formula variants,
and claim-level evidence require a separately operated data service.

## Constraints and requirements

- Neo4j Community Edition is the only persistent database for this foundation.
- Every displayed knowledge datum must expose provenance, demo status, conflict, or unavailability.
- Source claims and conflicts must remain queryable instead of being collapsed into one asserted fact.
- Formula analysis must be deterministic and versioned; it must not invent dose conversions, safety
  classifications, inferred traditional roles, or a compatibility score.
- End-user requests must not trigger external data or model calls.
- Arbitrary Cypher, APOC, medical recommendations, diagnosis, personal health storage, and
  unconfigured AI synthesis are outside the boundary.
- The existing static-SPA decision remains valid for the frontend.

## Options considered

1. **Embed Alchemy fixtures and logic in the Vue application** — easy to demonstrate, but duplicates
   the knowledge contract, cannot enforce ingestion governance centrally, and cannot preserve a
   production graph boundary. Rejected.
2. **Use a generic relational CRUD service** — familiar operationally, but makes typed, bounded
   relationship exploration and claim/evidence traversal less direct. Rejected for this foundation.
3. **Create a separate FastAPI service backed only by Neo4j** — keeps the public contract typed,
   places all Cypher behind a repository boundary, and represents evidence-bearing relationships and
   conflicts directly. Accepted.

## Decision

Implement Alchemy as a separately deployable Python 3.12 FastAPI service in
`services/alchemy-api`, using the official asynchronous Neo4j driver and Neo4j Community Edition as
its sole persistent store. Treat claims, citations, source manifests, review state, and import runs as
first-class data. Keep domain analysis pure and independent from HTTP and Cypher. Allowlisted,
parameterized repository queries are the only graph access exposed to requests.

External-source access is restricted to explicit administration commands. USDA Duke ingestion is a
conservative, checksum-pinned subset import; PubChem enrichment is rate-limited and cached; SymMap is
blocked pending rights review. Future model integration may consume a bounded retrieval package, but
the model port remains disabled and cannot create source facts.

## Rationale and supporting evidence

This boundary gives the frontend a stable OpenAPI contract without making it authoritative for
research data. It also makes incomplete identity resolution, conflicting source claims, raw-record
preservation, and source licensing enforceable at ingestion time. A pure formula-analysis engine is
testable without Neo4j or Docker and can report only calculations supported by its declared unit
rules and graph evidence.

## Consequences and tradeoffs

- The frontend and backend now have separate runtime and deployment lifecycles.
- Local development needs Python/uv and Neo4j, or Docker Compose in a container-capable environment.
- API clients must handle explicit incomplete, conflicted, review-required, and unavailable states.
- Production source onboarding requires manifest, checksum, rights, mapping, and review work rather
  than ad hoc scraping.
- Semantic/vector retrieval, authentication, personal workspaces, and model synthesis remain future
  integrations rather than implicit dependencies.

## Implementation or migration implications

- Apply versioned constraints and indexes through `alchemy db migrate`.
- Seed only clearly labeled synthetic fixtures with `alchemy data seed-demo`.
- Export and review `contracts/alchemy-openapi.json` when routes or models change.
- Keep all future Cypher in the Neo4j repository/migration boundary and all source adapters in the
  offline ingestion boundary.
- Keep Neo4j ports private in deployment even though local Compose binds them to loopback.

## Verification criteria

- Reapplying migrations and demo seed is idempotent.
- Repository audit reports no missing provenance/review warnings for the demo graph.
- Formula analysis and comparison tests prove deterministic, score-free behavior.
- Raw Cypher is rejected; the disabled synthesis endpoint returns `501 model_not_connected`.
- The OpenAPI freshness check, Ruff, strict mypy, ordinary tests, and a real Neo4j integration pass.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../ALCHEMY_BACKEND.md`](../../ALCHEMY_BACKEND.md)
- [`../../ALCHEMY_GRAPH_SCHEMA.md`](../../ALCHEMY_GRAPH_SCHEMA.md)
- [`../../ALCHEMY_DATA_GOVERNANCE.md`](../../ALCHEMY_DATA_GOVERNANCE.md)
- [`../../ALCHEMY_SAFETY.md`](../../ALCHEMY_SAFETY.md)
- [`../handoffs/20260724T005309Z--master--establish-alchemy-backend-foundation.md`](../handoffs/20260724T005309Z--master--establish-alchemy-backend-foundation.md)
