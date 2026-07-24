# Alchemy backend

## Scope

`services/alchemy-api` is a separately deployable Python 3.12 service. FastAPI owns the HTTP
contract, Neo4j is the only persistent database, and offline administration commands own all
external source ingestion. Local Compose and CI use the pinned Community image; the hosted alpha
uses managed AuraDB through the same driver and repository contract. The existing Vue application
remains a static frontend.

Alchemy is educational and research-only. It retrieves sourced information, preserves source
conflicts, compares supplied formulas deterministically, searches licensed or public-domain text,
and prepares bounded retrieval context. It does not diagnose, prescribe, recommend a dose, declare
safety, retain health data, or call an external inference service.

## Local setup

Install Docker Desktop, Node 22.18, Python 3.12, and
[`uv`](https://docs.astral.sh/uv/). From the repository root:

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

## Remote alpha operation

The no-admin remote deployment keeps the existing Docker boundary and uses AuraDB as managed Neo4j:

- `render.yaml` defines the Render Free Docker web service, exact production CORS origins, custom
  API domain, health check, and secret prompts.
- `deploy/start.sh` runs checksum-protected migrations before every process start, applies the
  idempotent synthetic seed only when `ALCHEMY_SEED_DEMO=1`, and binds Uvicorn to the provider's
  assigned `PORT`.
- Aura credentials exist only as Render secret environment variables. The frontend receives only
  `https://api.current-flow.net`.
- Self-hosted Neo4j ports remain loopback-only in Compose. Aura's managed TLS endpoint is never
  exposed through frontend configuration.

The complete account, DNS, Cloudflare Pages, smoke-test, free-tier, and no-admin procedure is in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## Request lifecycle

1. FastAPI validates the route, query filters, or explicit Pydantic body.
2. Request-ID middleware accepts a safe `X-Request-ID` or generates one and returns it.
3. An application service calls the repository protocol or a pure deterministic analysis function.
4. The Neo4j implementation selects only allowlisted labels, relationships, filters, and projections.
   User values are parameters; arbitrary Cypher is never accepted.
5. Database records are converted into typed domain models before transport.
6. Knowledge responses carry data status, sources, warnings, generation time, schema version, and
   algorithm version where applicable.
7. Validation and application failures use one RFC 7807-inspired problem shape. Logs are structured
   JSON and omit secrets and complete bodies.

The application lifespan creates the official asynchronous Neo4j driver, verifies connectivity
before serving, and closes it during shutdown. Missing required database settings fail configuration
at startup.

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
