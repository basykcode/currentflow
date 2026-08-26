# Scaling triggers

Scaling decisions use sustained resource and latency evidence, never DAU alone.

## Render

- Vertically upgrade when one bounded request genuinely needs more CPU/memory or the existing
  instance sustains CPU above 70% or memory above 75% for 15 minutes.
- Horizontally scale when concurrency rises, individual query latency remains healthy, and API p95
  still degrades. Recalculate total Neo4j pool capacity first.
- Consider Render Pro/autoscaling only when traffic variability makes manual instance count
  operationally inefficient and statelessness/load evidence is current.

## AuraDB

Resize for sustained CPU/page-cache pressure, storage above 70%, out-of-memory events, repeated
capacity warnings, or a measured connection budget that the current tier cannot safely support.
Consider Business Critical only for a reviewed SLA, read-secondary, or resilience requirement.

## New boundaries

- Provision Render Postgres at the first private persisted user feature.
- Add a background worker for imports, projection rebuilds, bulk embeddings, exports, or any job
  longer than an ordinary bounded request.
- Add dedicated search only when a representative benchmark shows Neo4j lexical/vector retrieval
  no longer meets latency and relevance requirements.

## Immediate investigation thresholds

- API 5xx above 1% for five minutes.
- API p95 above one second for 15 minutes outside a known provider incident.
- Gateway 502 above 0.5% for five minutes.
- Any connection-acquisition timeout, repeated transaction retry exhaustion, or query timeout.
- Unexpected edge HIT for health, authenticated, cookie, range, no-cache, private, or admin traffic.

Scale only after identifying whether edge cache, API CPU/memory, driver pool, query plan, Aura page
cache, or dataset growth is the actual bottleneck.
