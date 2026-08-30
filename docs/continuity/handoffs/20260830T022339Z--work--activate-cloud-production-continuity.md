# Handoff: Activate Cloud production continuity

- UTC timestamp: 2026-08-30T02:23:39Z
- Worker branch: `work` (Codex Cloud disposable branch label)
- Exact starting production head: `9984ee122f6717c947960ea96d6eff5b2da7690a`
- Scope: authorized integration/activation documentation only
- Status: complete and ready for a protected documentation pull request

## Reconstructed state

The checkout was clean and selected exact protected `master` source SHA
`9984ee122f6717c947960ea96d6eff5b2da7690a`; Cloud exposed its managed branch as `work`, so no branch
was switched. Pull request [#9](https://github.com/basykcode/currentflow/pull/9) merged as
`bbb28082c974e8be002018f11c91fa52ec8a4a05` and established the production-scale foundation. Cloud
hotfix task
[`task_e_6a9388ddca208326b3d8e1a10829a9ab`](https://chatgpt.com/codex/cloud/tasks/task_e_6a9388ddca208326b3d8e1a10829a9ab)
produced pull request [#11](https://github.com/basykcode/currentflow/pull/11), merged as the starting
SHA, which fixed weak edge `If-None-Match` replay.

Current Flow Cloud is the saved `basykcode/currentflow` environment with its tracked setup and
maintenance commands, container caching On, internet Off, and explicit Cloud execution marker. Its
native versions are exactly Node 22.22.2, npm 11.4.2, Python 3.13.13, and uv 0.7.22; no alternate
runtime or shim was installed.

## Activation evidence

- All four required GitHub checks succeeded: `Frontend / frontend-quality`, `Alchemy API /
alchemy-quality`, `Alchemy API / alchemy-neo4j-integration`, and `Alchemy API / alchemy-container`.
- Render deploy `dep-da9p5pek1f9s73cisuk0` is live at exact commit
  `9984ee122f6717c947960ea96d6eff5b2da7690a`.
- Cloudflare frontend build `7e47c3b2-c26a-4cbd-8f76-88ac29088449` and gateway build
  `7b8f92ae-e019-4385-9ee2-2e58f0d47285` both completed successfully in production.
- Exact live activation was first observed at `2026-08-30T02:19:33.078Z`.
- Frontend `/` and `/alchemy` returned 200. Gateway live, ready, and meta returned 200; readiness
  reported Neo4j available.
- Metadata matched exact SHA `9984ee122f6717c947960ea96d6eff5b2da7690a`, Python 3.13.13, Neo4j
  driver 5.28.2, graph schema v2, pool size 20, and query timeout 15 seconds.
- An eligible public request produced MISS then HIT. Replaying the exact observed weak ETag in
  `If-None-Match` together with `no-cache` returned an empty 304 and BYPASS.
- Authorization and cookie requests returned no-store BYPASS with no ETag. Allowed and denied CORS
  origins passed. Direct Render meta returned 403 `origin_access_denied`.
- Catalog totals were exactly 447 herbs and 200 formulas. The exact representative herb and formula
  response identities and source-bearing detail contracts passed.

No secret, credential, raw environment value, provider token, or protected evidence was captured in
this record.

## Documentation changes

- Reconciled `PROJECT_STATE.md` from the stale open-PR/pre-activation account to the exact merged,
  protected, deployed, and live-verified state.
- Reworked `CODEX_CLOUD.md` into a practical Desktop/phone guide, clarified Cloud versus Remote and
  local-task visibility, documented GitHub as the durable bridge, and recorded the everyday
  parallel-PR, integration, verification, and rollback workflow.
- No application, dependency, configuration, migration, provider, billing, or secret changed.

## Rollback and remaining manual action

- Repository rollback: create a GitHub revert and pass it through a protected pull request.
- Render rollback: select the prior verified deploy at
  `bbb28082c974e8be002018f11c91fa52ec8a4a05`.
- Cloudflare rollback: use version rollback independently for the frontend or gateway as needed.
- The Aura Professional trial billing/activation choice remains manual and is not authorized. Do
  not activate or pay for it, and do not delete the old AuraDB.

## Verification

- `npm run codex:doctor` — passed in Cloud mode before tracked changes.
- `npm run workspace:doctor` — passed in Cloud mode before tracked changes.
- `node --version; npm --version; python3 --version; uv --version` — reported the four exact native
  versions above.
- The exact Python gate, `UV_NO_MANAGED_PYTHON=1 UV_PYTHON_DOWNLOADS=never uv --directory
services/alchemy-api run alchemy check`, passed Ruff format for 71 files, Ruff lint, strict mypy
  for 53 source files, 59 tests with the explicitly gated disposable-Neo4j integration test skipped,
  and OpenAPI consistency.
- Prettier check for all three changed documentation files passed.
- `npm run check` — the first run correctly failed the toolchain documentation assertion because the
  rewritten guide omitted required code formatting around the exact Node and Python patches. The
  guide was corrected; the complete rerun passed the Cloud boundary, synchronized toolchain and 7
  tests, generated types, strict TypeScript and lint, 411 frontend tests, 23 workspace tests, 16
  gateway tests plus Wrangler dry-run, 5 load-policy tests, both corpus validators, and the
  485-module production build. The inherited npm proxy notice, Wrangler proxy notice, and existing
  large Astrology chunk warning were non-failing.
- `git diff --check` — passed after the final documentation edit.
