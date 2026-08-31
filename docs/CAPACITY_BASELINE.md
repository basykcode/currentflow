# Capacity baseline

## Current evidence

No production-scale load result is recorded yet. Repository tests, provider smoke checks, and a
small bounded live probe prove correctness, not capacity. The current graph has one active official
data source, but a full node/relationship/dataset inventory was not captured with an approved load
window. Therefore this repository makes no 100,000-DAU readiness claim.

## Required record for each run

| Field         | Required value                                                   |
| ------------- | ---------------------------------------------------------------- |
| Date / commit | UTC time and exact Git SHA                                       |
| Compute       | Render plan, instances, workers, CPU, memory                     |
| Database      | Aura plan/region, memory/CPU/storage; no credentials             |
| Dataset       | release IDs, graph node/relationship counts, projection versions |
| Gateway       | Worker version, cache policy, warm/cold state                    |
| Workload      | target, k6 profile, VUs/RPS, duration, endpoint mix              |
| Result        | request count, p50/p95/p99/max, error rate, cache hit rate       |
| Resources     | Render CPU/memory, Aura CPU/page cache/storage, pool timeouts    |
| Outcome       | pass/fail, bottleneck, next experiment, rollback or scale action |

The first useful baseline is the `smoke` profile against a disposable integration graph containing
the same releases as production. A production baseline requires a separate approved window. Record
results here only when the dataset and provider metrics are available; do not paste raw logs or
secret-bearing exports.
