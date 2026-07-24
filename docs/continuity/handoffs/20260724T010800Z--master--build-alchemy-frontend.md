# Handoff: Build the Alchemy research and formulation frontend

- UTC timestamp: 2026-07-24T01:08:00Z
- Branch/worktree: `master` at `C:\Users\Client\Documents\Current Flow`
- Starting commit: `11c5ced9ea3199b96e36a6a356dee305563d9e79`
- Current inspected commit: `773974e914a47e6b7d231773122e3a68133deacd`
- Task/objective: Build Current's Alchemy frontend autonomously against a typed synthetic provider
  while a separate agent builds the backend.
- Status: complete, verified, and uncommitted

## Starting context

The task started on `master`, although the requested branch was `feat/alchemy-frontend`. The
worktree already contained `.gitignore` changes and untracked `services/`; branch switching and
committing were therefore prohibited by the task and repository continuity rules. The backend
OpenAPI contract did not exist when the frontend integration decision was made.

During the task, a concurrent backend workflow advanced `master` and added the backend service,
contract, root configuration, documentation, and continuity records to the same worktree. Those
backend-owned files were not edited by this frontend task. Shared root documentation and package
metadata were updated additively and need deliberate patch-level staging.

## Work completed

- Replaced the Alchemy placeholder with a responsive feature shell, nested navigation, visible
  provider/capability state, and the persistent research/education boundary.
- Added precise readonly frontend domain models, normalized UI errors, a fully typed provider
  interface, dependency injection, and a cancellable async-resource composable.
- Added a deterministic, latency-bearing `DemoAlchemyProvider` with five fictional materials, four
  formulas, multilingual identities, citations, conflicts, incomplete records, documented and
  absent relationship states, passage search, graph neighborhoods, formula analysis/comparison,
  and bounded retrieval contexts. It makes no network calls.
- Added `ContractUnavailableAlchemyProvider`; API mode reports `Alchemy API client not generated`
  and never silently falls back to fixtures.
- Implemented directly addressable Materia Medica and Formula Library list/detail routes with
  capability-driven filters, debounced URL-synchronized search, cancellation, empty/error/retry
  states, source claims, conflicts, completeness, citations, relationships, and immutable workbench
  import.
- Implemented a four-draft Formula Workbench with schema-validated versioned local persistence,
  corruption recovery, blank/import/duplicate/rename/delete/select/clear workflows, ingredient
  search and reordering, duplicate/preparation warnings, amount validation, JSON/text export, and
  provider-returned analysis/comparison presentations without a compatibility score.
- Implemented Text Library search, passage selection/detail, retrieval-package preparation, source
  and ambiguity summaries, and JSON export without invoking a model.
- Implemented a polished, deliberately nonfunctional Guided Inquiry preview with research-oriented
  prompts, disabled composer, explicit model status, and no fake response.
- Added responsive Alchemy styling, 24 focused frontend tests, three frontend documents, environment
  declarations/examples, route/provider installation, and shared documentation updates.

## Files or components changed

- `src/features/alchemy/` — frontend domain, providers, fixtures, composables, store, components,
  views, styles, routes, and tests.
- `src/views/AlchemyView.vue`, `src/app/router.ts`, `src/main.ts`, and `src/env.d.ts` — root feature
  integration.
- `.env.example` — frontend mode/base URL/timeout plus preservation of concurrent local API/Neo4j
  examples.
- `package.json` — additive `alchemy:types` generation script.
- `README.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_INTEGRATION.md` — additive frontend behavior and
  integration boundary.
- `docs/ALCHEMY_FRONTEND.md`, `docs/ALCHEMY_FRONTEND_INTEGRATION.md`, and
  `docs/ALCHEMY_UI_DATA_MODEL.md` — new frontend operating and contract documentation.
- `docs/continuity/` — this handoff, the frontend decision, and reconciled project state.

## Decisions made

- [Separate the Alchemy frontend domain from transport](../decisions/20260724T010602Z--separate-alchemy-domain-from-transport.md)

## Important rationale

The browser consumes a frontend domain rather than an in-flight backend schema. This allowed the
complete interface and interaction model to be tested without fabricating transport responses.
Explicit demo and unavailable providers keep data origin visible and prevent fixture fallback from
masquerading as a connected service. Formula drafts are separate device-local user state, never
source knowledge.

## Verification commands and results

- `pnpm dlx npm@11.5.2 install` — succeeded; dependencies installed and audit reported zero
  vulnerabilities. The available runtime reported Node 24.14.0 while the repository requires
  22.18.0.
- Targeted Prettier write/check over the frontend-owned and shared integration files — succeeded.
  The repository-wide `npm run format` was not used because it would rewrite concurrently changing
  backend-owned files; `.env.example` has no configured Prettier parser.
- `pnpm dlx npm@11.5.2 run check` — succeeded:
  - strict `vue-tsc -b` passed;
  - ESLint passed with zero warnings;
  - Vitest passed 11 files and 59 tests, including 24 Alchemy tests;
  - Vite 7.3.6 production build passed with 144 modules transformed.
- The same strict type-check, lint, test, and build stages were also run independently during
  implementation while fixing discovered failures.

## Manual browser verification

Vite was inspected in the in-app browser at desktop and 360×800:

- `/alchemy` redirected to Materia Medica.
- `/alchemy/materia-medica`, a direct material detail, `/alchemy/formulas`, a direct formula detail,
  `/alchemy/workbench`, `/alchemy/texts`, and `/alchemy/inquiry` all rendered and reloaded safely.
- Browser back/forward, debounced query synchronization, `/` search focus, no-result and not-found
  retry states, citations, conflicts, incompleteness, and relationship groups were exercised.
- Two source formulas were copied into independent local drafts; analysis and two-formula comparison
  rendered algorithm versions and distinguished documented relationships, conflicts, no record, and
  incomplete data. Draft names persisted across a full reload.
- Two passages produced a bounded retrieval package containing passages, citations, graph facts, and
  an unresolved ambiguity. No model was called.
- At 360 px, pages had no horizontal overflow, direct details replaced compressed multi-panel
  content, ingredient fields reflowed, and wide formula tables used contained scrolling.
- The browser console had no warnings/errors. Resource inspection found no external or API requests.
  Guided Inquiry remained disabled and displayed no fake answer.

## OpenAPI and HTTP provider status

`contracts/alchemy-openapi.json` was absent at task start, so no transport schemas were guessed and
no `HttpAlchemyProvider` was implemented. The concurrent backend added the contract later. It is
backend-owned and was left untouched; generating types and mapping it now is a separate integration
task so the frontend is not bound mid-flight without endpoint-by-endpoint review.

## Known risks and assumptions

- The current working tree mixes complete but uncommitted frontend and backend work on `master`;
  shared root files must be staged interactively or reconciled before committing.
- Generated transport types, HTTP mappings, request timeout behavior, backend problem mapping, and
  live endpoint integration tests are intentionally pending.
- Final frontend checks ran under Node 24.14.0 because the pinned Node 22.18.0 runtime was unavailable.
- Demo claims are fictional synthetic fixtures. Device-local drafts are not encrypted, synchronized,
  or appropriate for personal health data.
- The backend's Docker/Compose runtime gate remains outside this frontend task and is documented in
  the backend handoff.

## Uncommitted or unmerged state

No branch, commit, merge, rebase, or push was performed. The task began in a dirty shared worktree and
the current branch is `master`, not the expected `feat/alchemy-frontend`. Concurrent work advanced
the checked-out commit during implementation.

## Exact next recommended action

Review and separate the two concurrent workstreams. Stage all Alchemy frontend-owned paths directly,
then use patch staging for shared root files so backend additions are preserved. After the contract
is stable, install `openapi-typescript` and `openapi-fetch`, run `npm run alchemy:types`, implement and
test pure transport mappers plus `HttpAlchemyProvider`, verify every endpoint listed in
`docs/ALCHEMY_FRONTEND_INTEGRATION.md`, and only then set `VITE_ALCHEMY_DATA_MODE=api`.

## Relevant files, commits, issues, or external references

- [`../../ALCHEMY_FRONTEND.md`](../../ALCHEMY_FRONTEND.md)
- [`../../ALCHEMY_FRONTEND_INTEGRATION.md`](../../ALCHEMY_FRONTEND_INTEGRATION.md)
- [`../../ALCHEMY_UI_DATA_MODEL.md`](../../ALCHEMY_UI_DATA_MODEL.md)
- [`../../../src/features/alchemy/`](../../../src/features/alchemy/)
- [Backend handoff](20260724T005309Z--master--establish-alchemy-backend-foundation.md)
- Current branch baseline: `773974e914a47e6b7d231773122e3a68133deacd`
