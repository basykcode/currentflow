# Production-scale architecture

## Topology

```text
Browser
  -> Cloudflare frontend Worker (static Vue/Vite)
  -> api.current-flow.net/api/v1/*
       -> Cloudflare API gateway Worker
            -> Render Standard FastAPI origin, Virginia
                 -> AuraDB Professional, AWS us-east-1
```

The design prepares progressive scaling without changing the product's domain architecture. The
browser remains a static application, the gateway remains a stateless transport boundary, FastAPI
owns the public contract, and Neo4j remains the canonical shared knowledge graph.

## Horizontal-safety contract

- Render pre-deploy owns migrations and approved projection/foundation reconciliation.
- Web startup performs no schema, foundation, or seed mutation.
- Each web process creates exactly one bounded async Neo4j driver and closes it on shutdown.
- Process disk and memory are disposable; `/app/.cache` is a rebuildable cache only.
- End-user requests never perform ingestion or projection rebuilds.
- Request bodies, query text, pagination, graph depth, result counts, request time, acquisition time,
  and Neo4j query time are bounded.
- Public/private cache classes are explicit at the API and edge. Unknown routes default to
  `no-store`.

## Scale path

The initial one-process Standard service establishes the baseline. Increase workers only after
measuring process memory and multiplying the per-process Neo4j pool across the whole service.
Horizontal instances are appropriate when request concurrency grows while individual queries remain
bounded. Aura resizes respond to measured page-cache, CPU, memory, storage, or connection pressure.

Long imports, projection rebuilds, bulk embeddings, and research jobs cross the background-work
boundary and do not justify making web requests longer. Private persisted features introduce the
separately planned Render Postgres boundary; large immutable artifacts use the existing object-store
port with Cloudflare R2 as the selected future implementation.

## Deliberately absent

Kubernetes, Redis, a service mesh, a second operational database, process-local distributed rate
limiting, and external observability vendors are not part of this foundation. Scaling decisions are
metric-driven, not based on DAU alone.
