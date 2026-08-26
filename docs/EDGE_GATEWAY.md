# Cloudflare API gateway

## Boundary

`workers/api-gateway` is a separately deployable strict-TypeScript Worker. It forwards method,
path, query, safe request ID, and request body to the configured Render origin. It strips
hop-by-hop/origin-specific headers, adds security headers, preserves origin Cache-Control and ETags,
and emits structured transport logs. It owns no clinical, Alchemy, astrology, authentication,
session, or Neo4j behavior.

The route registry in `src/policy.ts` is deny-by-default. Only known anonymous GET resources can be
cache candidates. Health, private/admin prefixes, writes, Authorization, Cookie, Range, no-cache,
errors, and `Set-Cookie` bypass the cache. A declared or streamed body over 1 MiB is rejected before
origin dispatch; the origin independently enforces the same declared and chunked body limits.

## Origin protection

The canonical Worker secret is `CURRENT_EDGE_ORIGIN_TOKEN`; the deployed `ORIGIN_TOKEN` name remains
a compatibility alias during rotation. The Worker sends only `X-Current-Flow-Origin-Token` to the
origin. FastAPI accepts the canonical token environment name or the retained
`ALCHEMY_ORIGIN_TOKEN` alias and enforces it only when `ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=1`.

FastAPI can temporarily accept `CURRENT_EDGE_ORIGIN_TOKEN_SECONDARY` (or the retained
`ALCHEMY_ORIGIN_TOKEN_SECONDARY` alias) during a zero-downtime rotation:

1. Add the new value as the Render secondary secret and wait for healthy activation.
2. Store the same new value as the Worker's primary secret and promote that version.
3. Verify workers.dev, the public gateway, and direct-origin 403 behavior.
4. Promote the new value to Render's primary secret while it remains accepted as secondary.
5. Remove the old/secondary value only after the rollback observation window.

## Deployment

```bash
npm run gateway:check
npm run gateway:deploy
```

The checked `wrangler.jsonc` has `workers_dev: true` and no custom-domain route. Cloudflare Git
integration owns the production `master` release. Never point `ORIGIN_BASE_URL` at
`api.current-flow.net`; same-host recursion is rejected at runtime.

Cloudflare Rate Limiting/WAF rules remain dashboard configuration. Use the policy classes exported
by `src/policy.ts`: anonymous public reads, authenticated reads, search, formula analysis, future
Intelligence, and administrative/import operations. Process-local distributed limiting is
forbidden.
