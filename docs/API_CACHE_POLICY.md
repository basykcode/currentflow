# API cache policy

The API registry in `current_alchemy.api.policy` and edge registry in
`workers/api-gateway/src/policy.ts` are the two enforcement points. Both default unknown routes to
uncacheable. Adding a new route requires an explicit classification and tests.

| Class                     | Examples                                                              | Response policy                                                   |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `public-cacheable` search | suggestions, text search                                              | `public, max-age=0, s-maxage=60, stale-while-revalidate=300`      |
| `public-cacheable` stable | metadata, herbs, formulas, sources, documents, passages, graph detail | `public, max-age=60, s-maxage=3600, stale-while-revalidate=86400` |
| `public-uncacheable`      | formula analysis/comparison and unmatched public routes               | `no-store`                                                        |
| `private-no-store`        | auth, users, profiles, subscriptions, memories, Intelligence          | `private, no-store`                                               |
| `health`                  | live and ready                                                        | `no-store`                                                        |
| `administrative`          | admin, internal, imports                                              | `private, no-store`                                               |

Any error, non-GET, Authorization, Cookie, or `Set-Cookie` response overrides the route class and is
never publicly cached. Range and explicit no-cache requests bypass the Worker cache. CORS varies
only when an allowlisted `Origin` changes the response.

FastAPI generates a deterministic strong ETag from the final representation bytes. Those bytes are
already projections of versioned graph/source contracts and exclude response-time noise. Public
knowledge envelopes keep compatibility fields `requestId` and `generatedAt` explicitly unavailable;
request correlation comes from the per-request `X-Request-ID` response header, including edge cache
hits. A matching `If-None-Match` returns 304 without a body. Future immutable version-addressed resources may use
`public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` only after their version is part
of the URL or representation contract.

Cloudflare stores origin Cache-Control in an internal cache-only header because Cache API may
rewrite browser TTLs. The header is removed and the exact origin policy restored on HIT.
