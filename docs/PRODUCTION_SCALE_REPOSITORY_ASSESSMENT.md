# Production-scale repository assessment

## Assessment basis

This assessment reconciles repository commit `a367578` and the verified live topology on
2026-08-26. It does not treat the original production brief as proof that an item exists. Code,
configuration, tests, provider observations, the accepted production topology decision, and the
production cutover handoff were compared before this follow-up implementation.

## Repository and deployment discovered

- Production branch and GitHub default: protected `master`; retained `main` has no production role.
- Frontend: Vue 3/Vite static build on the existing Cloudflare `currentflow` Worker at
  `current-flow.net` and `www.current-flow.net`.
- API ingress: `current-flow-api-gateway` Worker on Workers Paid, route
  `api.current-flow.net/*`, with the API CNAME still targeting Render and proxied by Cloudflare.
- API compute: Blueprint-managed `current-flow-alchemy-api`, Render Standard, Virginia, one
  process, Docker, dependency-aware readiness.
- Graph: AuraDB Professional, AWS `us-east-1`, 2 GB memory, 1 CPU, 4 GB included storage. The former
  Aura instance remains retained.
- Persistence: Neo4j is the only operational application database. The ingestion lake is a local
  `ObjectStore` abstraction; no Postgres or R2 instance is provisioned.

## Existing foundation before this pass

The repository already enforced Node/npm/Python/uv/Neo4j/driver/TypeScript/Vite/Wrangler versions,
exact JavaScript dependencies, npm lock installation, frontend/backend CI, Render pre-deploy versus
process-only startup, request-size limits, ETags, short public caching, origin-token enforcement,
bounded Neo4j driver settings, workers.dev gateway tests, a read-only Python smoke harness, and a
combined production operations runbook.

The deployed foundation was verified through GitHub PR checks, Render health/readiness, direct Aura
connectivity, gateway MISS/HIT and bypass probes, representative Alchemy reads, and protected-origin
403 behavior. Provider secrets were never stored in the repository.

## Gaps found and disposition

| Area                 | Finding at `a367578`                                                              | Follow-up disposition                                                                         |
| -------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| README               | Still named Node 22 and `npm install`                                             | Corrected to the canonical Node/npm and `npm ci`                                              |
| Browser timeout      | Production retained the old free-instance 90-second timeout                       | Reduced to 30 seconds for always-on Render Standard                                           |
| API cache policy     | Any successful `/api/v1/*` GET could become public                                | Replaced with an authoritative deny-by-default endpoint registry                              |
| Private/cache safety | Authorization was handled; route prefixes and `Set-Cookie` were not centralized   | Added private/admin/health policy classes and tests                                           |
| Neo4j budget         | Pool 50, acquisition 30 s, query 20 s; lifetime/liveness implicit                 | Set reviewed 20/5/10/1800/30/15-second production defaults                                    |
| Query telemetry      | Duration only; no operation, record count, request correlation, or request totals | Added stable operations, result counts, request IDs, and cumulative totals                    |
| Request telemetry    | Used raw paths and omitted response size/cache/query totals                       | Added endpoint templates and required bounded fields                                          |
| Metadata             | Omitted runtime, driver, Git, projection, pool, and worker details                | Added non-secret effective runtime metadata                                                   |
| Worker source        | Runtime-safe MJS but no separate policy module or TypeScript build                | Migrated in place to strict TypeScript and added a policy module                              |
| Worker safety        | No body guard or recursion check                                                  | Added 1 MiB declared/streamed guards and same-host rejection                                  |
| Load testing         | Only a small Python smoke loop                                                    | Added guarded k6 smoke/baseline/medium/burst/concurrency profiles                             |
| Runbooks             | Production operations existed, but requested focused records were absent          | Added focused architecture, recovery, capacity, scale, privacy, edge, and dashboard documents |

## Intentional reconciliations

- Vite remains `7.3.6`, not the originally proposed `7.0.4`. The earlier exact pin produced known
  audit findings; 7.3.6 is the already-audited exact replacement. Downgrading would conflict with
  the same brief's vulnerability requirement.
- The gateway remains under `workers/api-gateway`, not a second `infra/cloudflare/api-gateway`
  copy. Cloudflare Git integration and the live service already use this root; duplicating or moving
  it would create two release authorities.
- Production DNS and provider activation were already completed by a separately authorized and
  verified operation. This follow-up changes repository contracts only and does not repeat or
  destructively unwind that cutover.

## Capacity conclusion

The architecture now has bounded scale controls and a repeatable test foundation, but there is no
measured 100,000-DAU capacity claim. A representative production-sized dataset, approved load
window, Render/Aura/Cloudflare metrics, and recorded p50/p95/p99/error/cache/pool results are still
required before making a capacity statement.
