# Load testing

`load-tests/alchemy.js` is a read-oriented k6 workload. It covers liveness/readiness, herb search,
optional herb monograph and formula profile IDs, optional formula comparison input, source list, and
a disabled-until-supplied Canon search path.

| Profile       | Workload                          |
| ------------- | --------------------------------- |
| `smoke`       | 3 virtual users for 30 seconds    |
| `baseline`    | 10 requests/second for 15 minutes |
| `medium`      | 20 requests/second for 5 minutes  |
| `burst`       | 50 requests/second for 30 seconds |
| `concurrency` | 100 virtual users for 2 minutes   |

Thresholds are error rate below 1%, cached public p95 below 250 ms, indexed graph p95 below 750 ms,
and complex bounded p95 below 2000 ms. Pool-acquisition failures, memory trend, CPU, Aura page cache,
and cache-hit rate must be read from provider telemetry and recorded with the k6 result.

Local example:

```bash
TARGET_URL=http://127.0.0.1:8000 LOAD_PROFILE=smoke k6 run load-tests/alchemy.js
```

Any non-local target additionally requires `ALLOW_REMOTE_LOAD=1`. The production API and direct
Render origin also require `ALLOW_PRODUCTION_LOAD=1`, an approved low-traffic change window, and
active provider-metric observation. The manual GitHub workflow uses exact `grafana/k6:1.0.0` and
requires both confirmations. It is never scheduled automatically.

Optional variables are `HERB_ID`, `FORMULA_ID`, `FORMULA_COMPARISON_BODY`, and
`CANON_SEARCH_PATH`. An explicitly authorized direct Render-origin run may additionally supply the
secret `ALCHEMY_ORIGIN_TOKEN`; the manual workflow maps that secret to the job environment and
passes only its variable name into the k6 container. The workload requires the token for the exact
`https://current-flow-alchemy-api.onrender.com` origin and sends it as
`X-Current-Flow-Origin-Token` on every request. HTTP, alternate ports, the gateway, local targets,
and lookalike hosts are rejected when the token is present. Never print the variable, include it in
results, or pass it for any other origin. Do not invent production identifiers or load
private/future routes.
