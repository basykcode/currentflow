# Handoff: Establish the Alchemy graph-backed backend foundation

- UTC timestamp: 2026-07-24T00:53:09Z
- Branch/worktree: `master` at `C:\Users\Client\Documents\Current Flow`
- Starting commit: `d3f0e97ca3f72bfebf6848788754f7e006dd8c66`
- Task/objective: Build the production-grade Current Alchemy backend foundation and frontend contract.
- Status: partial

## Starting context

The backend task began on `master` at `d3f0e97`, ahead of its then-upstream state, with substantial
pre-existing uncommitted frontend/Astrology, documentation, and package changes. Those changes were
preserved. While this task was running, a separate workflow advanced and published `master` through
`773974e914a47e6b7d231773122e3a68133deacd`; it also left an uncommitted Alchemy frontend workstream
in the shared working directory. This task did not switch, merge, rebase, push, or rewrite branches.

The applicable continuity records established a static Vue frontend, deterministic authority,
visible provenance, and no hidden network calls. The Alchemy assignment explicitly added a separate
backend without superseding that frontend deployment decision.

## Work completed

- Added a Python 3.12, uv-managed FastAPI service with strict settings, lifecycle-managed asynchronous
  Neo4j connectivity, structured JSON logs, request IDs, typed responses, and standard errors.
- Added Neo4j constraints, indexes, full-text indexes, a checksum-protected migration runner, a
  parameterized repository, safe allowlisted exploration, and protected demo reset/seed/audit tools.
- Modeled stable graph identities, formulas and preparations, sources, claims, conflicts, documents,
  passages, citations, import runs, and review/provenance status.
- Added fictional synthetic data that exercises aliases, conflicts, formula composition, sourced
  interactions, missing knowledge, text retrieval, and idempotent seeding.
- Implemented herb/formula/source/document discovery and detail routes, graph neighborhood and
  constrained exploration, deterministic formula analysis and two-to-four formula comparison,
  bounded retrieval context, and a deliberately disabled AI synthesis endpoint.
- Added checksum- and rights-enforced source manifests plus synthetic, conservative USDA Duke,
  cached/rate-limited PubChem, user-supplied text/JSONL, and blocked SymMap adapters.
- Exported the stable OpenAPI contract, added exact container definitions, CI, administration
  commands, tests, and the requested architecture, schema, governance, API, safety, and AI docs.
- Corrected small lint incompatibilities in the concurrently present Alchemy frontend boundary so
  the repository-wide quality gate could pass; no frontend surface was designed or implemented by
  this backend task.
- Ran the API against a portable local Neo4j instance because no Docker-compatible runtime exists on
  this machine. All 22 public routes and expected error paths passed the live smoke matrix.

## Files or components changed

- `services/alchemy-api/` — service, domain, repository, migrations, adapters, fixtures, tests, CLI,
  lockfile, Dockerfile, and service documentation.
- `contracts/alchemy-openapi.json` — generated frontend contract.
- `compose.yaml` and `.env.example` — local service orchestration and secret-free configuration.
- `.github/workflows/alchemy-api.yml` — backend-scoped quality, integration, and image-build workflow.
- `docs/ALCHEMY_*.md`, `README.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_INTEGRATION.md` — operation,
  integration, governance, and safety documentation.
- `.gitignore` and `package.json` — ignored backend state and additive administration scripts.
- `eslint.config.js` and four files under `src/features/alchemy/` — narrowly scoped fixes required for
  the existing repository check.
- `docs/continuity/` — this handoff, the associated decision, and reconciled project state.

## Decisions made

- [Establish a provenance-first Alchemy graph service](../decisions/20260724T005309Z--establish-provenance-first-alchemy-graph-service.md)

## Important rationale

The graph stores what a source claims, not a synthesized clinical truth. Source disagreement and
missing mappings remain explicit. Runtime API operations are deterministic and local; external source
access is administration-only. Formula output reports exact supported-unit calculations and sourced
signals without extrapolating traditional units, safety, compatibility, dosing, diagnosis, or
personal suitability.

## Verification commands and results

- `uv sync --frozen` — succeeded with the committed `uv.lock`.
- `uv run alchemy check` — succeeded: 49 Python files formatted, Ruff clean, strict mypy clean across
  39 source files, 26 tests passed, one opt-in integration test skipped, and OpenAPI current.
- `$env:ALCHEMY_RUN_INTEGRATION='1'; uv run pytest -m integration -vv` — succeeded against real Neo4j
  Community 5.26.28: one passed, 26 deselected.
- `uv run alchemy db verify` and `uv run alchemy db migrate` — succeeded; both migrations present and
  the repeated migration applied nothing.
- `uv run alchemy data seed-demo` twice — identical result: four entities, one passage, one source.
- `uv run alchemy data audit` — 14 nodes, four claims, one source, zero warnings.
- Synthetic manifest validation and `--dry-run` ingestion — succeeded: six nodes, six relationships,
  and one intentional unavailable-field message.
- USDA Duke manifest validation against the official 6,033,990-byte archive and `--dry-run`
  ingestion — checksum succeeded; 174,300 nodes, 191,175 relationships, 164,820 raw records
  preserved, and zero unresolved fields.
- Live PowerShell HTTP matrix against `http://127.0.0.1:8000/api/v1` — all 22 endpoints and expected
  `422`/`501` paths returned their expected status.
- `pnpm dlx npm@10.9.2 run check` — invoked the repository `npm run check` script successfully:
  strict Vue type-check and ESLint passed, 56 frontend tests passed, and the production Vite build
  completed.
- `pnpm dlx npm@10.9.2 run alchemy:check` — root backend wrapper succeeded.
- Direct Prettier `--check` over the backend-facing Markdown, YAML, JSON-adjacent root files, and
  continuity records — succeeded after formatting; generated OpenAPI was restored by its exporter.
- Static YAML validation of `compose.yaml` — succeeded and confirmed exact Neo4j image, telemetry
  disablement, auth interpolation, and both services.
- `git diff --check` plus local-link and secret-pattern audits — succeeded; Git reported only the
  repository's existing LF-to-CRLF checkout notices.
- `docker version` — not run because `docker` is unavailable; container start and image build remain
  the only unverified final gates.

## Failed or rejected approaches worth remembering

- Docker, Podman, nerdctl, and a system Java runtime were unavailable. Verification used official
  portable Temurin Java and Neo4j Community artifacts outside the repository.
- Neo4j environment-variable-to-config translation belongs to the Docker entrypoint and did not
  disable telemetry for the portable archive. The first short-lived process was stopped; the
  temporary `neo4j.conf` was then patched before restarting. Use the checked-in Compose setting in
  container environments.
- No real SymMap ingestion was attempted because its manifest remains `review_required`.

## Known risks and assumptions

- The Dockerfile and Compose lifecycle were reviewed and statically parsed but not built or started.
- USDA Duke mappings are deliberately conservative and require domain review before non-demo import.
- PubChem is opt-in administration enrichment; normal requests make no network calls.
- No production traditional-source corpus, authentication, personal workspace, health-data storage,
  embeddings, or inference model is connected.
- A concurrent, uncommitted Alchemy frontend exists in the same worktree and needs ownership and
  integration review independently of this backend handoff.

## Unresolved issues

- Run the exact Docker Compose and image-build gates on a machine with Docker.
- Review and separate or deliberately combine the concurrent frontend work before committing.

## Uncommitted or unmerged state

No commit was created because the worktree was dirty at task start and changed concurrently. At
handoff, `master` and `origin/master` both point to
`773974e914a47e6b7d231773122e3a68133deacd`; the Alchemy backend, contract, documentation, root
integration edits, continuity records, and a separate Alchemy frontend remain uncommitted.

## Exact next recommended action

On a Docker-capable machine, copy `.env.example` to `.env`, set a local password and PubChem contact,
then run `docker compose up -d --build neo4j alchemy-api`, `npm run alchemy:migrate`,
`npm run alchemy:seed`, the live smoke matrix, and `docker compose build alchemy-api`.

## Relevant files, commits, issues, or external references

- [`../../ALCHEMY_BACKEND.md`](../../ALCHEMY_BACKEND.md)
- [`../../ALCHEMY_API.md`](../../ALCHEMY_API.md)
- [`../../ALCHEMY_GRAPH_SCHEMA.md`](../../ALCHEMY_GRAPH_SCHEMA.md)
- [`../../ALCHEMY_DATA_GOVERNANCE.md`](../../ALCHEMY_DATA_GOVERNANCE.md)
- [`../../../contracts/alchemy-openapi.json`](../../../contracts/alchemy-openapi.json)
- [`../../../services/alchemy-api/README.md`](../../../services/alchemy-api/README.md)
- Current branch baseline: `773974e914a47e6b7d231773122e3a68133deacd`
