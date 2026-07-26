# Handoff: Publish the Alchemy knowledge foundation

- UTC timestamp: 2026-07-26T22:58:04Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `c839ad593762c31d8d682ff5a0ed09c3dd0a8668`
- Feature commit: `e24f4403248e7c988b4f1e2e70faf7f8030e9399`
- Feature continuity commit: `0eea8d3a8463e56debf0a44ece28f7acc788c53e`
- Production metadata fix: `b32f2d5`
- Task/objective: Integrate, publish, migrate, and production-verify the release-aware Alchemy
  knowledge foundation on the existing Cloudflare/Render/Aura topology.
- Status: code, graph-schema migration, and web publication complete; first real Aura data import
  remains an authenticated administration step

## Starting context

The complete implementation and local verification were uncommitted on
`feat/alchemy-knowledge-graph`. Local and remote `master` both pointed to `c839ad5`. The existing
deployment was healthy on Cloudflare Pages, Render, and AuraDB, with Render configured to deploy
`master` only after checks pass and to run checksum-protected Neo4j migrations before Uvicorn.

The unrelated untracked
`docs/continuity/handoffs/20260724T220539Z--master--resume-cross-device-workspace.md` predated the
task and remained untouched.

## Publication order and work completed

1. Re-ran the complete local backend/root gates and inspected the final diff.
2. Committed the foundation as `e24f440` and its development continuity record as `0eea8d3`.
3. Pushed `feat/alchemy-knowledge-graph`.
4. Fast-forwarded local `master` from `c839ad5` to `0eea8d3`.
5. Pushed `master`, triggering GitHub, Render, and Cloudflare.
6. Corrected the public graph-schema metadata from v1 to v2 in `b32f2d5` and pushed the final
   production head.
7. Waited for backend quality, clean Neo4j integration, graph audit, container build, and
   Cloudflare build checks to pass.
8. Verified the new Render process came live only after the migration-aware startup command
   succeeded against Aura.
9. Verified the connected production Alchemy UI reports API v1, graph schema v2, and one active
   source without fixture fallback.

## Production migration evidence

`services/alchemy-api/deploy/start.sh` uses `set -eu`, executes `alchemy db migrate`, and starts
Uvicorn only afterward. Production changed from `alchemy-graph-v1` to `alchemy-graph-v2` and
dependency readiness reports Neo4j ready. Therefore migrations `003`–`005` completed successfully
on the configured Aura database before the new Render image accepted traffic. Earlier migrations
remain checksum-protected and idempotent.

The production graph still reports one active source: the visibly synthetic interface fixture.
The real Disease Ontology subset was not imported during this publication because the Render
administration session was not authenticated. No database credentials were copied out of Render or
stored locally.

## Verification commands and results

- `npm.cmd run check` — passed strict TypeScript, zero-warning ESLint, 74 frontend tests, and Vite
  production build.
- `uv run alchemy check` — passed Ruff formatting/lint, MyPy across 50 source files, 33 ordinary
  tests, and the unchanged OpenAPI contract.
- `uv run pytest -m integration -vv` — passed against clean Neo4j 5.26.28.
- GitHub `Alchemy API` run `30223980968` — quality, Neo4j integration/graph audit, and container jobs
  all completed successfully.
- `Workers Builds: currentflow` for `b32f2d5` — completed successfully.
- `GET https://api.current-flow.net/api/v1/health/live` — HTTP 200 and live.
- `GET https://api.current-flow.net/api/v1/health/ready` — HTTP 200 with Neo4j ready.
- `GET https://api.current-flow.net/api/v1/meta` — HTTP 200, API v1, graph schema
  `alchemy-graph-v2`, one active source.
- Production-origin herb request — HTTP 200 with
  `Access-Control-Allow-Origin: https://current-flow.net`.
- Live browser smoke — Alchemy reports `current-alchemy-api`, source-reported status, API v1,
  graph schema v2, one active source, and three explicitly synthetic material records.

## Known risks and assumptions

- The release-aware schema and administration CLI are live, but Disease Ontology data has not yet
  been written to Aura.
- Render Free can cold-start and AuraDB Free can pause after inactivity.
- The public alpha API has CORS but no authentication or abuse controls.
- The synthetic startup seed remains enabled because the first real source is a disease ontology and
  does not replace the material/formula records required by existing public routes.
- Render's authenticated shell or another approved administrative execution boundary is required
  for the first production source import. Provider credentials must remain inside Render.

## Uncommitted or unmerged state

The production commits are published to `origin/master`; `feat/alchemy-knowledge-graph` is published
at `0eea8d3`. This publication handoff and the final canonical state reconciliation are pending a
documentation-only commit. The unrelated pre-existing untracked handoff remains untouched.

## Exact next recommended action

Sign in to Render, open the `current-flow-alchemy-api` administration shell, and run:

```sh
ALCHEMY_DATA_ROOT=/tmp/alchemy-data \
  alchemy ingest source:disease-ontology \
  --release v2026-06-30 \
  --through graph \
  --mode subset \
  --subset-limit 250 \
  --batch-size 500
alchemy graph audit
alchemy graph counts
alchemy graph provenance disease:doid:0001816
alchemy graph rebuild-projections
```

Confirm the second identical ingest leaves counts unchanged. Keep `ALCHEMY_SEED_DEMO=1` until a
rights-approved material/formula source replaces the current UI fixture.

## Relevant files, runs, and handoffs

- [Foundation handoff](20260726T220953Z--feat-alchemy-knowledge-graph--build-knowledge-graph-foundation.md)
- [Deployment guide](../../DEPLOYMENT.md)
- [Import runbook](../../ALCHEMY_IMPORT_RUNBOOK.md)
- [GitHub production run](https://github.com/basykcode/currentflow/actions/runs/30223980968)
- [Production API readiness](https://api.current-flow.net/api/v1/health/ready)
