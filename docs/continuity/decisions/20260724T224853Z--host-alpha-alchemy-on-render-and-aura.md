# Decision: Host the alpha Alchemy API on Render and its graph on AuraDB

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: deployment architecture and operations

## Context

The Vue frontend is live on Cloudflare Pages at `https://current-flow.net`, and Cloudflare is
authoritative for the domain. The repository already contains a Dockerized FastAPI service and a
Neo4j-backed graph, but no remote backend has been provisioned. The active workstation has no
administrator credentials and must not depend on Docker Desktop, firewall changes, inbound local
network access, or system-level installation.

Cloudflare Pages cannot execute the existing Python Docker image. Cloudflare Containers can execute
it, but as of this decision they require the $5/month Workers Paid plan and provide only ephemeral
container disk. Durable Neo4j storage would still require another service.

## Constraints and requirements

- Preserve the checked-in Docker image and the Neo4j repository boundary.
- Require no local Docker daemon, listener, tunnel, or administrator permission.
- Keep credentials out of source, frontend bundles, continuity records, and chat.
- Prefer a free path for current alpha traffic.
- Preserve exact production CORS origins, TLS, provenance labeling, and visible unavailability.
- Make migrations deterministic and idempotent before the API accepts traffic.

## Options considered

1. **Cloudflare Pages plus Pages Functions** — rejected because the Workers runtime cannot execute
   the existing FastAPI Docker service and is not a Neo4j host.
2. **Cloudflare Containers plus managed Neo4j** — viable later, but rejected for the free alpha
   because Containers require Workers Paid, use ephemeral disk, and do not remove the managed graph
   dependency.
3. **A free self-managed VM running API and Neo4j** — rejected for now because it introduces OS
   patching, firewall, backup, storage, and recovery responsibilities that exceed the alpha's
   operational capacity.
4. **Render Free Docker API plus AuraDB Free** — selected because both build and run remotely,
   preserve the implemented boundaries, require no workstation administration, and have clear paid
   upgrade paths.

## Decision

Keep the frontend on Cloudflare Pages. Define the Alchemy API as a Render Free Docker web service in
`render.yaml`, with remote image builds, dependency-aware health checking, exact CORS origins, and
`api.current-flow.net` as its custom domain. Use AuraDB Free as the alpha Neo4j service and store its
TLS connection values only in Render secret environment variables.

Run checksum-protected migrations before every API process start. Seed the visibly synthetic dataset
when `ALCHEMY_SEED_DEMO=1`; disable that setting when reviewed production data should no longer be
refreshed.

This operationally refines the earlier Neo4j Community foundation: local Compose and CI continue to
use the pinned Community image, while the remote alpha uses Neo4j's managed AuraDB service through
the same official driver and repository contract.

## Rationale and supporting evidence

Render supports remote Dockerfile builds, custom domains, managed TLS, secret environment values,
and a Free web-service instance. AuraDB provides a managed Free Neo4j instance and a direct upgrade
path. The combination requires only account creation and dashboard secret entry from the user; all
code, image construction, migration, and serving work happens remotely.

The free services are suitable for an alpha, not a production SLA. Render Free spins down on idle,
and AuraDB Free pauses after inactivity and can delete a long-paused instance. These limits are
documented as explicit operating risks rather than hidden.

## Consequences and tradeoffs

- The API's first request after idle can take about a minute, so the production frontend timeout is
  90 seconds.
- AuraDB Free must be resumed after a pause and must not remain paused for 30 days; snapshots require
  an explicit export plan.
- AuraDB Free uses a provider-managed TLS endpoint rather than a private Render network. Its
  credentials remain backend-only, but network-level private connectivity requires a future paid
  topology.
- The public alpha API has CORS enforcement but no authentication or abuse control. It must not hold
  personal or health data.
- Paid always-on API hosting, database backups, authentication, rate limiting, and monitoring are
  release gates for production-grade operation.

## Implementation or migration implications

- Create an AuraDB Free instance and enter its URI, username, password, and generated database name
  in Render.
- Apply the root `render.yaml` Blueprint and verify migrations, seed, readiness, and metadata.
- Point the Cloudflare `api` CNAME at the actual Render service, initially DNS-only for certificate
  verification.
- Configure the Cloudflare Pages production build for API mode and redeploy it.
- Do not expose Aura credentials or use this workstation as an origin.

## Verification criteria

- GitHub backend checks and the remote Docker build pass.
- `https://api.current-flow.net/api/v1/health/ready` reports HTTP 200 with Neo4j ready.
- `/api/v1/meta` reports at least one active synthetic source for the initial alpha seed.
- `https://current-flow.net/alchemy` reports the API provider connected without fixture fallback.
- A cold start completes within the configured 90-second frontend timeout.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../ALCHEMY_BACKEND.md`](../../ALCHEMY_BACKEND.md)
- [`../../../render.yaml`](../../../render.yaml)
- [Establish a provenance-first Alchemy graph service](20260724T005309Z--establish-provenance-first-alchemy-graph-service.md)

## Factual correction

On 2026-07-24, the first Aura deployment demonstrated that a new Aura database name is not
necessarily `neo4j`. The Blueprint now prompts for `NEO4J_DATABASE`, and operators must use the
database name in Aura's downloaded credential file rather than assuming the username and database
name match.
