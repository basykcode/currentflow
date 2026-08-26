# Decision: Adopt a production Render, AuraDB, and Cloudflare gateway topology

- Status: accepted
- Date (UTC): 2026-08-26
- Scope: production deployment, reliability, and origin security

## Context

The original alpha topology used a sleeping Render Free process, AuraDB Free, and a DNS-only API
CNAME. It proved the application boundaries but did not provide production uptime, a pre-deploy
phase, edge cache controls, or origin protection. The former Aura endpoint also stopped resolving,
which left the API crash-looping and made the dependency failure indistinguishable from process
liveness.

The production accounts now support a Render paid workspace, Workers Paid, a Render Standard
instance, and AuraDB Professional. The public frontend remains a static Cloudflare Worker build.

## Constraints and requirements

- Keep Neo4j as the only persistent store and keep all credentials server-side.
- Preserve the old database and prior DNS values until the replacement is proven.
- Make migrations and foundation reconciliation a release phase, not mutable web-process startup.
- Keep liveness process-only and readiness dependency-aware.
- Bound database connections, transactions, request bodies, pagination, and edge caching.
- Route the API through Cloudflare only after a workers.dev validation and retain a reversible origin.

## Options considered

1. **Retain the free alpha topology** — rejected because cold starts, automatic sleeping, and the
   lack of a pre-deploy phase do not meet the production objective.
2. **Move FastAPI into a different runtime** — rejected because it would duplicate or replace the
   verified Docker/FastAPI boundary without improving the immediate Aura cutover.
3. **Use Render Standard, AuraDB Professional, and a narrow Cloudflare API Worker** — selected. It
   preserves the existing service contracts while adding controlled release phases, paid uptime,
   edge policy, and an origin-token boundary.

## Decision

Run `current-flow-alchemy-api` as a single Uvicorn process on Render Standard in Virginia. Render's
pre-deploy phase runs checksum-protected migrations and the approved foundation reconciliation;
the web start command only starts the disposable API process. The process initializes a bounded
Neo4j driver without making startup depend on immediate database connectivity. `/health/live`
reports process availability, while `/health/ready` performs the dependency check.

Use AuraDB Professional in AWS `us-east-1`. Keep its URI, username, password, and database name only
in Render secret environment values. Use one worker-local Neo4j pool with explicit acquisition,
connection, retry, and query deadlines.

Introduce `current-flow-api-gateway` as a separate Cloudflare Worker. It accepts only `/api/v1/*`,
forwards an origin token, bypasses cache for health, authorization, cookies, range, and explicit
no-cache requests, and caches only successful public GET responses whose origin policy permits it.
The Worker must pass its focused tests and workers.dev smoke checks before `api.current-flow.net`
is routed through it. The existing Render CNAME is the recorded rollback path.

## Rationale and supporting evidence

- The application already has explicit health, repository, and Docker boundaries.
- Render Standard supplies paid always-on compute, pre-deploy commands, zero-downtime deploys, and
  one-off operational access without moving persistence into the container.
- AuraDB Professional supplies the managed graph in the same US East geography as Render.
- A path-scoped Worker can apply cache and origin policy without moving domain logic or credentials
  into the browser.
- A direct connectivity probe to the replacement Aura instance succeeded before any production
  secret change.

## Consequences and tradeoffs

- The gateway and Render become two independently observable deployment boundaries.
- Enabling the origin token intentionally makes the direct Render application routes return 403;
  liveness and readiness remain available for provider health checks.
- One Standard CPU uses one Uvicorn worker. Horizontal or larger-instance scaling requires
  recalculating the aggregate Neo4j connection budget.
- Edge cache correctness depends on the API's explicit public/private policy and the Worker's bypass
  tests. New authenticated routes must be private and must not inherit public caching.

## Implementation or migration implications

- Keep `render.yaml`, toolchain pins, lockfiles, CI, health contracts, and runbooks synchronized.
- Deploy and verify the Worker on workers.dev before changing the API route.
- Generate the origin token outside source, store the same secret in Render and the Worker, and do
  not include it in logs or continuity records.
- Observe the new Aura release before considering retirement of any prior database or credential.

## Verification criteria

- Frontend and backend CI checks pass on `master`.
- Render pre-deploy, image build, and zero-downtime activation succeed on Standard.
- `/health/live`, `/health/ready`, `/meta`, and representative Alchemy reads return expected live
  responses through both the staged gateway and the production hostname.
- Health, authorization, cookie, and no-cache requests bypass the edge cache; eligible public GETs
  produce a MISS followed by a HIT.
- Direct application routes reject missing origin tokens after the gateway cutover, while health
  checks remain usable.

## Supersedes

- [Host the alpha Alchemy API on Render and its graph on AuraDB](20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md)

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../PRODUCTION_OPERATIONS.md`](../../PRODUCTION_OPERATIONS.md)
- [`../../../render.yaml`](../../../render.yaml)
- [`../../../workers/api-gateway/wrangler.jsonc`](../../../workers/api-gateway/wrangler.jsonc)
