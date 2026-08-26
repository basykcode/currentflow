# Production operations

This runbook covers the Current Flow frontend, Cloudflare API gateway, Render FastAPI service, and
AuraDB graph. It contains no secret values. Provider credentials belong only in their secret stores.

## Production topology

```text
current-flow.net / www.current-flow.net
  Cloudflare frontend Worker built from GitHub master

api.current-flow.net/api/v1/*
  Cloudflare Worker: current-flow-api-gateway
    -> Render origin: current-flow-alchemy-api (Standard, Virginia)
      -> AuraDB Professional (AWS us-east-1)
```

The API gateway is a transport boundary, not a domain service. It accepts only `/api/v1/*`, applies
the documented cache and CORS policy, forwards a generated request ID and origin token, and returns
bounded problem responses when the origin is unavailable. The checked-in configuration has no
custom-domain route so a source deployment cannot silently take production traffic.

## Release order

1. Confirm `master` is the GitHub default and the release commit has passed the required frontend
   and Alchemy API checks.
2. Confirm the replacement Aura instance is running and test a read-only `RETURN 1` connection
   without printing credentials.
3. Deploy Render. Its pre-deploy command runs migrations and the approved foundation reconciliation.
   The web process starts only after that phase succeeds.
4. Verify the Render origin's liveness, readiness, metadata, and representative read-only knowledge
   endpoints.
5. Deploy `current-flow-api-gateway` to workers.dev with its origin URL and secret origin token.
6. Verify gateway proxying, request IDs, CORS, health/auth/cookie/no-cache bypass, public MISS/HIT,
   error responses, and absence of secret values in responses or logs.
7. Route `api.current-flow.net/*` through the Worker while retaining the Render CNAME target as the
   rollback origin. Verify the same live checks through the production hostname.
8. Enable the matching Render origin-token secret and confirm ordinary direct-origin application
   traffic is rejected while gateway traffic and provider health checks stay healthy.

Never delete the prior Aura instance or credentials during a cutover. Retirement requires a
separate, explicitly authorized change after a retention and restore review.

## Health contracts

- `GET /api/v1/health/live`: process-only liveness. It does not query Neo4j and must return quickly.
- `GET /api/v1/health/ready`: dependency readiness. It returns 503 without revealing an address when
  Neo4j cannot answer.
- `GET /api/v1/meta`: application, graph schema, algorithm, feature, and active-source metadata.
- Representative reads: `/api/v1/herbs?offset=0&limit=5`, `/api/v1/formulas?offset=0&limit=5`, and
  one known detail record from each collection.

Health and all errors are `no-store`. Requests with authorization, cookies, ranges, or explicit
no-cache directives bypass edge caching. Successful anonymous GET responses may use the public
policy and ETag. Request bodies are limited to 1 MiB, query text and filters have explicit maximum
lengths, and collection limits are capped at 100 or lower by the route contract.

## Observability

Render JSON logs record request ID, method, path, status, duration, and outcome without bodies,
credentials, Cypher, or query parameters. Neo4j logs record connectivity and query-dispatch duration
plus outcome. Cloudflare observability records Worker request status and execution without the
origin token.

Investigate or roll back when any of these occur:

- any sustained readiness failure or failed pre-deploy;
- more than 1% API 5xx responses over five minutes;
- API p95 duration above 1 second for 15 minutes after excluding a known provider incident;
- Render memory above 75% or CPU above 70% for 15 minutes;
- any Neo4j connection-acquisition timeout, repeated transaction retry exhaustion, or query timeout;
- Aura storage above 70%, sustained Aura CPU above 70%, or a provider capacity warning;
- Cloudflare gateway 502 responses above 0.5% over five minutes;
- unexpected cache HIT on health, authenticated, cookie-bearing, range, or no-cache requests.

These are investigation thresholds, not automatic scaling commands. Before increasing Render
workers or replicas, keep the total possible Neo4j connections within the reviewed Aura budget.

## Bounded load smoke

The read-only harness defaults to localhost, 2 requests per second, and 10 seconds:

```bash
cd services/alchemy-api
uv run python scripts/load_smoke.py
```

A remote target requires the explicit `--allow-remote` flag. Start with the default rate and compare
failure count plus p50/p95/max latency against the thresholds above. Do not run a higher-rate test
against production without a separate change window and provider-metric observation.

## Rollback

- **Render release:** redeploy the last known-good Git commit. A failed pre-deploy does not replace
  the live instance. Do not reverse already-applied migrations unless a migration-specific recovery
  procedure exists.
- **Aura cutover:** restore the four Render Neo4j secret values to their recorded prior secret set
  only if that database is still healthy. Never paste or record them in Git or a ticket.
- **Gateway:** remove or disable only the `api.current-flow.net/*` Worker route and restore the API
  DNS record's prior proxy state; its CNAME target remains the Render origin.
- **Origin token:** remove the Render token only when traffic has first returned to the direct origin,
  or rotate the token in the Worker before Render so live gateway requests remain accepted.

After rollback, verify all three health/meta reads and one herb/formula read from the user-facing
hostname, then record the exact deployment and observed result in a unique continuity handoff.

## Change log requirements

Every production operation records UTC timestamps, before/after provider state, exact Git commits,
tests and CI check names, deploy identifiers, endpoint results, DNS/proxy changes, and available
rollbacks. Redact secret values, credential filenames, account email addresses, deploy hooks, and
private provider identifiers.
