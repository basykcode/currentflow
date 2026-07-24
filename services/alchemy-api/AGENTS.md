# Alchemy backend engineering rules

- Preserve the educational and research-only boundary. Do not add diagnosis, prescribing, dosing
  recommendations, safety declarations, health-data collection, or medical-advice workflows.
- Neo4j is the only persistent database. Keep Cypher inside `infrastructure/neo4j`, use stable
  application IDs, parameterize all data values, and never expose raw Cypher.
- A source-specific `Claim` and its citation are authoritative. Convenience properties never replace
  claims, conflicts must coexist, and missing interaction data means unknown rather than compatible.
- Keep deterministic calculations pure and independent of API transport and storage.
- Keep Pydantic request and response models explicit, use strict typing, and isolate dynamically typed
  database or external-data boundaries.
- Ingestion is offline administration work. Enforce source rights, checksums, adapters, review status,
  rate limits, and provenance. Never scrape commercial reference sites.
- External inference is disabled until a separately reviewed self-hosted provider is configured.
- Run `uv run alchemy check` and the repository-level `npm run check` before completion.
- Update the OpenAPI contract and backend documentation when public or integration boundaries change.
