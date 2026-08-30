# Production observability

FastAPI and the Cloudflare gateway emit structured JSON to their provider-native logs. No external
observability vendor is introduced by this foundation.

FastAPI request events include timestamp, level, service, environment, build SHA, instance and
process IDs, request ID, endpoint template, method, status, duration, response size, cache policy,
rate-policy class, query count, cumulative Neo4j time, and outcome. Query events add the stable
operation and returned record count. Exception output records only the exception type; stack text
and provider error strings are not serialized into production JSON.

Worker events include timestamp, service, request ID, method, status, duration, cache status,
endpoint class, and rate-policy class. They omit raw paths so future private identifiers cannot
become log dimensions. They never include the origin token, Authorization, Cookie, body, or query
values.

`/api/v1/meta` exposes only non-secret diagnostics: application/API/graph versions, Git SHA, Python
and Neo4j driver versions, projection versions, enabled/disabled feature flags, worker count, and
effective pool/timeouts. `/health/live` is process-only. `/health/ready` performs one bounded
connectivity check and no graph audit.

Never log credentials, Aura URI values, complete request bodies, birth data, medications, notes,
conversation text, private user identifiers, Cypher, parameters, or complete source passages.

Provider dashboards should alert or trigger investigation at the thresholds in
`SCALING_TRIGGERS.md`. A future log export must preserve the same redaction contract and requires a
separate privacy/security review.
