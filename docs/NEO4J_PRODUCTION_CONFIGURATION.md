# Neo4j production configuration

One FastAPI process creates one official async Neo4j driver. Initial defaults are sized for one
Render Standard process and one AuraDB Professional 2 GB instance:

| Setting                                        | Default |
| ---------------------------------------------- | ------: |
| `NEO4J_MAX_CONNECTION_POOL_SIZE`               |      20 |
| `NEO4J_CONNECTION_ACQUISITION_TIMEOUT_SECONDS` |       5 |
| `NEO4J_CONNECTION_TIMEOUT_SECONDS`             |      10 |
| `NEO4J_MAX_CONNECTION_LIFETIME_SECONDS`        |    1800 |
| `NEO4J_LIVENESS_CHECK_TIMEOUT_SECONDS`         |      30 |
| `NEO4J_MAX_TRANSACTION_RETRY_TIME_SECONDS`     |      15 |
| `NEO4J_QUERY_TIMEOUT_SECONDS`                  |      15 |

The installed 5.28.2 driver types and implementation were checked for these exact seconds-based
arguments. `Query(timeout=...)` applies the server transaction deadline to every repository query.
The driver is closed during lifespan shutdown.

Every query is parameterized, bounded, deterministically ordered where collection-sized, assigned a
stable operation name, and logged after result consumption with duration, returned record count,
outcome, and request ID. Request logs include total query count and cumulative Neo4j time. Cypher,
parameters, database addresses, credentials, and full source passages are excluded.

Before increasing Uvicorn workers or Render instances, calculate:

```text
maximum possible connections = instances × workers per instance × pool size
```

Benchmark and review that total against Aura metrics. Any acquisition timeout, repeated retry
exhaustion, or query timeout is an investigation signal, not a reason to silently raise every
limit.
