# Separate Render liveness from dependency readiness

## Context

- UTC date: 2026-08-30
- Cloud task branch: `work`
- Exact selected source and starting HEAD: `codex/chat-01a02bf0beb1` at
  `6a76be5faa36448101cd063f0edd0439d7db86d7`
- Status: implementation complete and committed for a pull request targeting the selected source;
  unmerged and not deployed.
- Incident: while Aura was unavailable, dependency-aware readiness returned `503` and Render used
  that route as its platform probe, restarting the only otherwise healthy API process and causing
  direct-origin and gateway `502` responses.

## Changes

- Changed the Render Blueprint platform health path from `/api/v1/health/ready` to the
  dependency-independent `/api/v1/health/live` route.
- Kept `/api/v1/health/ready` unchanged as the Neo4j-aware operator signal, including its bounded
  `503` behavior when the dependency is unavailable.
- Updated deployment contract and API tests to lock the liveness probe, reject readiness as the
  Render probe, and prove `Cache-Control: no-store` on successful and failed health responses.
- Updated deployment and recovery documentation with the liveness/readiness distinction and the
  Aura-outage recovery sequence.

## Verification

- Native runtimes verified before edits: Node `22.22.2`, npm `11.4.2`, Python `3.13.13`, uv
  `0.7.22`.
- `npm run codex:doctor` — passed in Cloud mode at the exact starting HEAD.
- `UV_NO_MANAGED_PYTHON=1 UV_PYTHON_DOWNLOADS=never uv --directory services/alchemy-api run pytest tests/unit/test_production_deploy.py tests/api/test_api.py`
  — passed, 17 tests.
- `UV_NO_MANAGED_PYTHON=1 UV_PYTHON_DOWNLOADS=never uv --directory services/alchemy-api run alchemy check`
  — passed Ruff formatting and lint, strict mypy across 53 source files, 52 tests with the one
  opt-in Neo4j integration test skipped, and OpenAPI consistency.
- `npm run check` — passed the Cloud evidence boundary, toolchain checks, strict TypeScript and
  lint, 410 frontend unit tests, 23 workspace tests, 12 gateway tests and dry-run build, bounded load
  tests, commentary and transition validation, and the production build. The existing non-failing
  large Astrology chunk warning remains.
- `git diff --check` — passed.

## Operational boundary

- No Render, Aura, Cloudflare, DNS, secrets, production deployment, `master`, or
  `docs/continuity/PROJECT_STATE.md` state was changed.
- Aura had already been resumed outside this task. No live provider verification was attempted from
  the credential-free Cloud worker.

## Next action

Review and merge the pull request through the authorized integration/release process. After the
resulting authorized Render deployment, confirm the provider health path is `/api/v1/health/live`,
then verify liveness and dependency readiness separately through both the direct protected origin
and Cloudflare gateway without inducing an Aura outage.
