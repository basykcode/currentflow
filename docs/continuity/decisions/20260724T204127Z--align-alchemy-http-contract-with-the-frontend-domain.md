# Decision: Align the Alchemy HTTP contract with the frontend domain

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: Alchemy API contract, browser transport, and provenance behavior

## Context

The backend initially returned generic entity summaries and accepted query-driven retrieval, while
the completed frontend required source-backed list properties, document titles, mentioned entities,
and retrieval from passages selected by exact ID. Mapping absent fields in the browser would either
lose useful evidence or invent values.

## Decision

- Keep the backend's generic graph entity model, but include its allowlisted source-backed
  `properties` in summaries.
- Return document titles and typed mentioned-entity summaries with passages.
- Allow text listing with an empty query and retrieval context from exact `passageIds`.
- Generate TypeScript types from the backend-owned OpenAPI contract.
- Keep frontend domain models independent and translate through pure typed mappers.
- Represent absent review state as `unavailable`; never substitute `machine_imported` or another
  status.
- API errors, timeouts, cancellation, and invalid configuration remain visible and never fall back
  to demo data.

## Consequences

The public API contract has additive fields and retrieval input behavior. A contract change requires
OpenAPI export, TypeScript regeneration, backend contract tests, provider tests, and the full
repository check. Demo mode remains deterministic and network-free.
