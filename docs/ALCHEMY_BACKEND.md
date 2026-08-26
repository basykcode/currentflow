# Alchemy backend

## Scope

`services/alchemy-api` is a separately deployable Python 3.12 service. FastAPI owns the HTTP
contract, Neo4j is the only persistent database, and offline administration commands own all
external source ingestion. Local Compose and CI use the pinned Community image; production uses
AuraDB Professional through the same driver and repository contract. The existing Vue application
remains a static frontend.

Alchemy is educational and research-only. It retrieves sourced information, preserves source
conflicts, compares supplied formulas deterministically, searches licensed or public-domain text,
and prepares bounded retrieval context. It does not diagnose, prescribe, recommend a dose, declare
safety, retain health data, or call an external inference service.

## Local setup

Install Docker Desktop and the exact Node, npm, Python, and
[`uv`](https://docs.astral.sh/uv/) versions declared in `config/toolchain.json`. From the repository
root:

```powershell
Copy-Item services/alchemy-api/.env.example .env
# Replace NEO4J_PASSWORD and the PubChem contact placeholder in .env.
npm run alchemy:up
npm run alchemy:migrate
npm run alchemy:seed
```

The local endpoints are:

- API: `http://localhost:8000`
- OpenAPI UI: `http://localhost:8000/api/v1/docs`
- Neo4j Browser: `http://localhost:7474`

Those defaults are for a single human checkout. Concurrent Codex chats must use
`npm run workspace:alchemy -- up` and read their assigned endpoints from
`npm run workspace:doctor`; use `npm run workspace:alchemy -- migrate` and
`npm run workspace:alchemy -- seed` for the data setup steps. The wrapper gives each worktree
separate ports, containers, volumes, and Neo4j CLI targeting. See
[`CODEX_PARALLEL_WORK.md`](CODEX_PARALLEL_WORK.md).

Neo4j is bound to loopback in Compose. Deployment designs must keep Bolt and Browser on a private
network rather than expose them publicly. Compose also disables Neo4j anonymous usage reporting.

Direct service operation:

```powershell
Set-Location services/alchemy-api
Copy-Item .env.example .env
uv sync --frozen
uv run alchemy db migrate
uv run alchemy data seed-demo
uv run uvicorn current_alchemy.app:create_app --factory --host 0.0.0.0 --port 8000
```

## Production operation

The no-admin remote deployment keeps the existing Docker boundary and uses AuraDB Professional as
managed Neo4j:

- `render.yaml` defines the Render Standard Docker web service, exact production CORS origins,
  custom API domain, pre-deploy phase, health check, bounded Neo4j settings, and secret prompts.
- `deploy/predeploy.sh` runs checksum-protected migrations and the approved idempotent foundation
  reconciliation before activation. It refuses demo seeding in production.
- `deploy/start.sh` is process-only and binds one Uvicorn worker to the provider's assigned `PORT`
  with graceful shutdown.
- Aura credentials exist only as Render secret environment variables. The frontend receives only
  `https://api.current-flow.net`.
- The Cloudflare API Worker forwards an independently generated origin token and applies the public,
  private, health, authorization, cookie, range, and explicit-bypass cache policy.
- Self-hosted Neo4j ports remain loopback-only in Compose. Aura's managed TLS endpoint is never
  exposed through frontend configuration.

The complete account, DNS, gateway, smoke-test, scaling, rollback, and no-admin procedures are in
[`DEPLOYMENT.md`](DEPLOYMENT.md) and [`PRODUCTION_OPERATIONS.md`](PRODUCTION_OPERATIONS.md).

## Request lifecycle

1. FastAPI validates the route, query filters, or explicit Pydantic body.
2. Production policy middleware accepts a safe `X-Request-ID` or generates one, enforces the request
   size and optional gateway origin token, and returns the request ID.
3. An application service calls the repository protocol or a pure deterministic analysis function.
4. The Neo4j implementation selects only allowlisted labels, relationships, filters, and projections.
   User values are parameters; arbitrary Cypher is never accepted.
5. Database records are converted into typed domain models before transport.
6. Knowledge responses carry data status, sources, warnings, generation time, schema version, and
   algorithm version where applicable.
7. Public anonymous GET responses receive a short shared-cache policy and ETag. Health, errors,
   non-GETs, authorization, and cookies are private or `no-store`.
8. Validation and application failures use one RFC 7807-inspired problem shape. Logs are structured
   JSON with request/query duration and outcome and omit secrets, complete bodies, Cypher, and query
   parameters.

The application lifespan creates the official asynchronous Neo4j driver with bounded pool,
acquisition, connection, retry, and query deadlines, then closes it during shutdown. It does not
make process liveness depend on connectivity at startup; `/health/ready` performs that check.
Missing required database settings still fail configuration at startup.

## Architectural boundaries

- `domain`: stable identities, claims, documents, formula inputs, and pure analysis.
- `application/ports`: repository and future local-model interfaces.
- `application/services`: ingestion orchestration.
- `infrastructure/neo4j`: all runtime Cypher and migrations.
- `infrastructure/external`: administration-only PubChem HTTP client.
- `ingestion`: manifests, rights/checksum enforcement, conservative adapters, and normalization.
- `api`: explicit transport models, route composition, errors, and envelopes.
- `cli`: safe migration, demo, audit, ingestion, OpenAPI, and quality commands.

No PostgreSQL, Redis, Kafka, Elasticsearch, APOC, GraphQL, LLM framework, telemetry vendor, or
external AI SDK is present.

## Quality commands

```powershell
uv run ruff format --check .
uv run ruff check .
uv run mypy src
uv run pytest
uv run alchemy openapi export --check
uv run alchemy check
```

Docker-backed integration tests run only when `ALCHEMY_RUN_INTEGRATION=1` and point at a disposable
Neo4j instance. The root `npm run check` remains the frontend gate.
