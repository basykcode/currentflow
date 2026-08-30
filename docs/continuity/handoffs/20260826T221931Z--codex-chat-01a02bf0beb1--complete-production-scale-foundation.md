# Handoff: Complete the production-scale repository foundation

- Date (UTC): 2026-08-26
- Branch: `codex/chat-01a02bf0beb1`
- Starting commit: `a367578f73620d29f45ca8ffda0020e326bc6cbe`
- Implementation commits:
  - `66f2419` — `feat(api): harden production lifecycle and data access`
  - `14eea13` — `feat(edge): add typed gateway and guarded load foundation`
- Integration status: unmerged and unpushed

## Objective and reconstructed state

Complete the repository-side production foundation described by the user without repeating or
reversing the separately authorized 2026-08-26 Render, AuraDB, Cloudflare, GitHub, and DNS cutover.
The starting deployment was already live on protected `master`: Render Standard in Virginia, one
process, AuraDB Professional in AWS US East, Workers Paid, a protected Render origin, and
`api.current-flow.net` routed through the API gateway. All provider credentials and the former Aura
instance remained outside this task.

The existing branch already contained the earlier toolchain, startup split, basic cache middleware,
and gateway scaffold. This pass reconciled those files with code, tests, provider evidence, the
accepted topology decision, and the prior production handoff before editing. `npm run
workspace:doctor` passed for session `01a02bf0beb1`, slot 2.

## Implemented behavior

- Replaced broad public GET caching with deny-by-default API and Worker endpoint registries covering
  public-cacheable, public-uncacheable, private, health, and administrative classes plus six edge
  rate-policy classes.
- Kept cacheable representations deterministic: public knowledge envelopes no longer contain a
  per-request body ID or wall-clock generation time, while every response and edge cache hit carries
  the current `X-Request-ID`. Authorization, Cookie, `Set-Cookie`, errors, writes, health, private,
  range, and explicit no-cache traffic cannot enter public cache.
- Added bounded declared and streamed request bodies, a 30-second application deadline, security
  headers, strong ETags and 304 handling, exact CORS, endpoint-template logs, and redacted structured
  request/query telemetry. Raw paths, request bodies, Cypher, parameters, secrets, and provider
  exception text are not serialized.
- Configured one Neo4j driver per process with pool/acquisition/connect/lifetime/liveness/retry/query
  limits of 20 / 5 s / 10 s / 1800 s / 30 s / 15 s / 15 s. Every repository query now has a stable
  operation name, server deadline, consumption-time duration, record count, outcome, and request
  correlation. Driver construction and clean shutdown have focused tests.
- Extended `/api/v1/meta` with Git, Python, Neo4j driver, projection, process-worker, and effective
  non-secret pool/timeout metadata. Liveness remains process-only and readiness remains one bounded
  dependency check.
- Preserved Render's pre-deploy mutation boundary and process-only startup. The container default now
  uses the same `deploy/start.sh` entry point as Render. Blueprint values remain Standard, one worker,
  `master`, Virginia, and origin enforcement enabled because the verified cutover predates this task.
- Added a temporary secondary Render token slot for actual zero-downtime edge-token rotation: origin
  accepts old and new, Worker promotes new, Render promotes new, then the old slot is removed after
  observation.
- Migrated the existing live-authority gateway root in place from MJS to strict TypeScript. It adds a
  separate policy module, bounded streamed forwarding, recursion protection, safe CORS/security and
  hop-header handling, exact cache/bypass behavior, current request IDs on hits, and structured logs.
  `wrangler.jsonc` remains workers.dev-capable and contains no custom-domain route or secret.
- Aligned the Node 24 runtime with the newest TypeScript-5.8-compatible Node 24 tsconfig base
  (`@tsconfig/node24@24.0.0`). Vite remains the previously audited `7.3.6` instead of downgrading to
  the vulnerable proposed `7.0.4`. npm install-script approval is exact-version pinned for the
  lockfile's esbuild, workerd, and optional fsevents packages.
- Added frontend/backend CI synchronization, toolchain policy tests, a manual exact-image k6 workflow,
  five guarded profiles, production double opt-in, thresholds, and parse/policy tests. No production
  load was generated.
- Added focused assessment, architecture, toolchain, statelessness, cache, edge, Neo4j, observability,
  load, capacity, scaling, privacy, background-work, recovery, branch, infrastructure-plan, and
  dashboard documentation. `PROJECT_STATE.md` was not edited because this is not an authorized
  integration reconciliation.

## Verification

Final integrated working state passed:

- Exact npm 11.17.0 `npm ci`: 347 packages installed, 348 audited, zero vulnerabilities; install
  script approvals were non-interactive and exact-version pinned.
- `npm run check`: toolchain verification and 3 policy tests; strict type-check; ESLint; 48 files / 393
  application tests; 11 workspace guardrail tests; 11 gateway tests; Wrangler 4.126.0 dry-run build;
  3 load-policy tests; commentary and transition validators; Vite 7.3.6 production build.
- `uv 0.11.32 sync --frozen --all-groups`: 47 locked packages checked.
- `uv run alchemy check` equivalent through the exact synchronized environment: Ruff format/check,
  mypy across 53 source files, 52 passed backend tests, one disposable-Neo4j integration test skipped
  unless `ALCHEMY_RUN_INTEGRATION=1`, and current OpenAPI contract.
- k6 entry bundle/parse through the locked esbuild: passed.
- GitHub workflow and Render files parsed as YAML mappings; Render/Worker focused configuration tests
  passed.
- `git diff --check`: passed before commits.

Docker is not installed on this host, so a local image build could not run. The repository retains
the required `alchemy-container` GitHub check, which builds the exact Docker context on every pull
request. No k6 traffic, provider change, deployment, DNS mutation, push, or live probe was performed
by this repository-only follow-up.

## Activation and rollback

The deployed `master`, local `master`, and `origin/master` remained at
`a367578f73620d29f45ca8ffda0020e326bc6cbe` while this work was prepared. Review these commits through
the protected pull-request path and require `frontend-quality`, `alchemy-quality`,
`alchemy-neo4j-integration`, and `alchemy-container`. After merge, verify the Render release and
gateway build separately, use workers.dev before promotion, and follow the order in
`PRODUCTION_RECOVERY_RUNBOOK.md` and `EDGE_GATEWAY.md`. Do not run a production load profile without
an approved window and provider-metric observation.

Known limits remain explicit: there is no measured 100,000-DAU claim, no production-sized benchmark,
no provisioned Postgres/R2/background worker, and no automatic Cloudflare rate rule. The former
AuraDB and prior rollback evidence must remain retained until a separate authorized decision.
