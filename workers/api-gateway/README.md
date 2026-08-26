# Current Flow API gateway

This Worker is the transport-only public ingress for `api.current-flow.net/api/v1/*`. It proxies to
the separately configured Render origin, applies the shared public/private route registry, forwards
a secret origin header, preserves origin cache metadata and ETags, and emits bounded JSON request
logs. It contains no domain logic, session state, or database access.

Run `npm run gateway:test` and `npm run gateway:build` from the repository root. The checked
`wrangler.jsonc` intentionally enables only workers.dev; production routes, the canonical
`CURRENT_EDGE_ORIGIN_TOKEN` secret, and its temporary `ORIGIN_TOKEN` compatibility alias are
provider controls. Never add a route or secret value to source.

The deployment sequence and rollback are documented in `docs/EDGE_GATEWAY.md` and
`docs/PRODUCTION_RECOVERY_RUNBOOK.md`.
