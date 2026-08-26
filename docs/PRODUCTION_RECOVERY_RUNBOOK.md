# Production recovery runbook

Record UTC time, exact Git/provider versions, observed symptoms, actions, and results. Never copy
secrets or provider exports into Git, logs, or continuity files.

## Failed Render release or pre-deploy

1. Keep the last healthy deployment serving; a failed pre-deploy must not replace it.
2. Capture the failing migration/checksum code and safe error category.
3. Verify Aura connectivity and provider status without printing the URI or password.
4. Fix forward when a migration has applied. Reverse only when that exact migration has a tested
   reverse operation and a reviewed data-loss analysis.
5. Redeploy a reviewed commit and verify live, ready, meta, herb, and formula endpoints.

## Database unavailable

Liveness should remain 200 and readiness should return a bounded 503. Do not disable dependency
checks or raise timeouts blindly. Inspect Aura status, CPU/page cache/storage, connection acquisition,
and query deadlines. If an authorized rollback is necessary, restore the retained former secret set
in Render and verify it before changing any gateway route. The former AuraDB must not be deleted.

## Projection recovery

Run the critical graph audit, then the idempotent projection rebuild through an administrative job.
The last accepted projection remains authoritative until the new version completes. Record source
release IDs, counts, content/projection versions, and audit output.

## Worker rollback

Promote the last known-good secret-bearing Worker version at 100% traffic. Verify workers.dev, then
the public hostname, cache MISS/HIT, auth/cookie/range/no-cache bypass, CORS, errors, and origin
protection. Do not expose the token.

## Full direct-origin rollback

1. Disable Render edge-token enforcement and wait for a healthy deployment.
2. Verify direct application reads.
3. Only then remove the exact Worker route and return the unchanged API CNAME to its recorded prior
   proxy state.

Reversing that order causes an avoidable outage. Do not change apex or `www` DNS.

## Secret rotation

Add the new token to Render's temporary secondary-token slot first and wait for a healthy deploy.
Then promote the Worker with the new primary token, verify, promote that value to Render primary,
and remove the old/secondary value only after the observation window. Rotate Aura values only after
a secret-safe direct connection test and never delete the prior database during the same operation.

## Backup evidence

Confirm Aura snapshot/export availability and restore policy in the provider console. A provider
snapshot is not a tested recovery until a separately authorized restore exercise records the target,
dataset, time, and verification. R2 lifecycle/versioning and future Postgres backups are configured
when those stores are provisioned.
