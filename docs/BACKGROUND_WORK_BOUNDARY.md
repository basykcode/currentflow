# Background-work boundary

Bulk ingestion, graph projection rebuilds, large exports, bulk embeddings, and long research jobs
must not run inside an ordinary web request. The existing administration CLI is the current
execution boundary.

A future worker contract requires:

- a stable job ID and immutable input manifest;
- idempotency key and deduplicated enqueue;
- explicit queued/running/succeeded/failed/canceled states;
- resumable, checksum-protected stages;
- bounded batch size, retries, and deadlines;
- progress and result metadata stored in Postgres, not process memory;
- large inputs/results stored through the object-store port;
- safe cancellation and restart without corrupting the last accepted projection;
- redacted structured logs and operator-visible failure reason;
- web APIs limited to enqueue/status/cancel authorization, never raw job execution.

Do not provision a Render worker until a consuming feature exists. When required, deploy it from the
same checked release image in Virginia, use internal Postgres for job state, and keep Neo4j mutation
behind the same migration/projection safety gates.
