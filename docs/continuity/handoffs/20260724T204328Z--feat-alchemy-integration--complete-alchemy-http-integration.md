# Handoff: Complete Alchemy HTTP integration

- **Timestamp:** 2026-07-24T20:43:28Z
- **Branch / worktree:** `feat/alchemy-integration` / `C:\Users\Client\Documents\Current Flow`
- **Starting commit:** `773974e914a47e6b7d231773122e3a68133deacd`
- **Objective:** Fully reconcile the recent Alchemy frontend and backend without fabricating missing
  knowledge.
- **Status:** Complete and verified locally; uncommitted pending `CMP`.

## Work completed

- Added `openapi-fetch` and `openapi-typescript`, regenerated the backend-owned contract, and checked
  in generated TypeScript paths.
- Implemented `HttpAlchemyProvider` for status, capabilities, herbs, formulas, analysis, comparison,
  text, graph neighborhoods, and retrieval context.
- Added pure transport mappers that preserve statuses, review state, source claims, citations,
  conflicts, incompleteness, formula inputs, algorithm/data versions, and request IDs.
- Added cancellation plus timeout composition, sanitized problem mapping, invalid-configuration
  handling, source-title-to-ID resolution, and an absolute no-demo-fallback rule.
- Extended the backend contract additively with allowlisted summary properties, document titles,
  mentioned-entity summaries, unfiltered text listing, and exact selected-passage retrieval.
- Added an explicit `unavailable` frontend review state instead of inventing a review classification.
- Updated architecture, integration, frontend, UI-model, and root documentation.

## Verification

- `services/alchemy-api/.venv/Scripts/python.exe -m current_alchemy.cli.main check` passed:
  Ruff formatting/lint, strict mypy, 26 tests passed, one opt-in Neo4j integration test skipped, and
  the OpenAPI contract was current.
- `pnpm dlx npm@10.9.2 run check` passed through the workspace Node wrapper: strict Vue/TypeScript,
  ESLint with zero warnings, 62 Vitest tests, and the Vite production build.
- Targeted `HttpAlchemyProvider` tests cover every provider method, problem/request-ID preservation,
  timeout normalization, and no synthetic fallback.
- `git diff --check` is required once more after formatting this handoff.

## Known remaining limits

- No Docker-compatible runtime is installed, so the Compose/image build gate remains unverified.
- The opt-in live Neo4j integration test was not rerun in this task; prior backend work recorded a
  successful portable-Neo4j run.
- Verification used the available Node 24.14.0 runtime; the repository baseline remains Node 22.18.0.
- All Alchemy work is still uncommitted in the shared worktree by design.

## Next action

When the user sends `CMP`, partition the backend, frontend, and integration paths into scoped commits,
merge deliberately into `master`, and push. Do not use broad staging.

## Decision

- [Align the Alchemy HTTP contract with the frontend domain](../decisions/20260724T204127Z--align-alchemy-http-contract-with-the-frontend-domain.md)
