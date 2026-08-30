# Handoff: Remediate pull request #9 review findings

- Date (UTC): 2026-08-30
- Cloud task branch: `work`
- Selected source branch: `codex/chat-01a02bf0beb1`
- Starting commit: `6a76be5faa36448101cd063f0edd0439d7db86d7`
- Integration status: unmerged; production release not authorized or performed

## Objective and reconstructed state

Resolve only the four open Codex review findings on pull request #9: missing explicit policy
registrations for the bounded exploration and retrieval POST routes, direct-origin load-test token
support, insufficient browser-to-Render timeout margin, and retrieval package ID collisions when
cache-compatible envelope metadata omits a request ID. The task began from the exact selected head
with a clean tree and used the native Node 22.22.2, npm 11.4.2, Python 3.13.13, and uv 0.7.22
toolchain. `npm run codex:doctor` confirmed the isolated Cloud boundary before tracked changes.

## Implemented behavior

- Registered `POST /api/v1/explore/query` and `POST /api/v1/retrieval/context` as private,
  non-cacheable, authenticated-read routes in both the FastAPI and Cloudflare policy registries.
  Their checked OpenAPI operation IDs are now the stable `explore_query` and
  `build_retrieval_context`; existing Pydantic body, list, depth, result, passage, and character
  limits remain authoritative.
- Added focused backend and gateway tests showing both registrations differ from the unknown-route
  fallback, retain private `no-store` policy, and keep stable operation IDs.
- Added optional `ALCHEMY_ORIGIN_TOKEN` handling for explicitly double-opted-in direct Render-origin
  k6 runs. Every workload request receives the token header for that exact target; gateway, local,
  and unrelated remote targets never receive it. The token is neither returned from setup nor
  logged, printed, documented with a value, or added to result tags.
- Raised the tracked production browser timeout from 30 to 35 seconds, retaining a five-second
  transport margin over the API's 30-second application deadline. The exact declaration, test, and
  deployment/integration documentation agree.
- Made retrieval package identity use the API response `X-Request-ID`, with checked envelope
  metadata as a compatibility fallback and an explicit contract failure if both are absent. A
  focused provider test proves consecutive response IDs produce distinct package IDs.
- Regenerated the checked OpenAPI contract. No provider, production, DNS, GitHub-rule, secret, raw
  evidence, dependency, runtime, or project-state change was made.

## Verification

- `npm run codex:doctor` passed in Cloud mode.
- Focused load-policy, gateway, frontend provider, backend policy/deployment, and OpenAPI tests
  passed.
- `npm run check` passed all stages: synchronized toolchain checks, strict TypeScript, lint, 52
  Vitest files / 411 tests, 23 workspace tests, 14 gateway tests, Wrangler dry-run, four load-policy
  tests, both corpus validators, and the 485-module production build. The existing non-failing large
  Astrology chunk warning remains.
- `UV_NO_MANAGED_PYTHON=1 UV_PYTHON_DOWNLOADS=never uv --directory services/alchemy-api run
  --no-managed-python --no-python-downloads alchemy check` passed Ruff format/lint, mypy for 53
  source files, 56 tests, and the OpenAPI check; the one opt-in disposable-Neo4j integration test
  remained intentionally skipped.
- `git diff --check` passed.

An initial incorrectly rooted focused Ruff formatting command reported that
`services/alchemy-api/src` and `services/alchemy-api/tests` did not exist beneath uv's selected
service directory. It made no changes; the corrected `ruff format src tests` command passed, and the
complete Python gate subsequently passed.

## Next action

Publish this task's commit as a protected pull request targeting `codex/chat-01a02bf0beb1`, retain
all required checks, and let the pull request #9 coordinator reconcile the result. Do not merge,
deploy, mutate provider configuration, or resolve review conversations from this task.
