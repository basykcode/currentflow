# Handoff: Build and activate the production-scale foundation

- UTC timestamp: 2026-08-26T18:01:53Z
- Branch/worktree: `codex/chat-01a02bf0beb1` /
  `/Users/benkind/.codex/worktrees/46f7/Current Flow Main`
- Starting commit: `746ae3b0dc5540f5c2762c5fb2217e24d6259e1f`
- Task/objective: Reconcile the production-scale repository foundation, connect the replacement
  AuraDB Professional instance to Render, introduce and prove a Cloudflare API gateway, protect
  `master`, deploy, and verify the live Current Flow path without exposing secrets or deleting the
  former database.
- Status: in progress; repository implementation and local release gates pass, but billing, secret,
  GitHub-setting, push, deployment, gateway-route, and live verification actions are not yet applied

## Starting context

- The isolated integration worktree was clean at `746ae3b`, and local `master` plus `origin/master`
  matched that commit. The configured remote used the required `github-basykcode` SSH alias.
- `npm run workspace:doctor` passed for session `01a02bf0beb1`, lease slot 2, before tracked changes.
- GitHub's default branch was `main`. `master` was 72 commits ahead and zero behind; `main` was an
  ancestor with no unique commits.
- Render's exact `current-flow-alchemy-api` service was Blueprint-managed from `master` in Virginia,
  exposed through `api.current-flow.net`, and still used the Free 0.1 CPU / 512 MB instance. It was
  crash-looping because the configured former Aura hostname no longer resolved. Public and direct
  liveness probes timed out.
- The Render account/workspace subscription and web-service compute plan were separate. Standard
  at $25/month, 1 CPU, and 2 GB RAM was selected in the service UI but not saved.
- The replacement Aura instance was running as AuraDB Professional with 2 GB memory, 1 CPU, and
  4 GB storage in AWS `us-east-1`. A secret-safe direct driver check returned `RETURN 1` and an empty
  node count before any production value changed.
- Cloudflare Workers Paid was active. The existing `currentflow` Worker served the frontend on apex
  and `www`; it was not an API gateway. The API DNS record was a DNS-only CNAME to the Render origin.
- No provider setting, secret, deployment, DNS record, GitHub setting, commit, or push had changed.
- A source coordination task briefly produced an unverified production-foundation draft in this
  worktree. It stopped on request, reported every file and limitation, and left the draft intact.
  This integration task reviewed, corrected, extended, and verified that work rather than silently
  overwriting it.

## Work completed so far

- Locked Node 24.19.0, npm 11.17.0, Python 3.12.14, uv 0.11.32, Neo4j Community
  5.26.28, Neo4j Python driver 5.28.2, TypeScript 5.8.3, Vite 7.3.6, and Wrangler 4.126.0 through a
  checked manifest and synchronized declarations. Vite 7.0.4 from the earlier plan was rejected
  because the current npm advisory set identified known vulnerabilities; 7.3.6 is the audited exact
  replacement.
- Standardized JavaScript installs on npm, regenerated `package-lock.json`, removed the competing
  pnpm lock, and reached zero findings in the npm audit used during lock reconciliation.
- Added independent frontend CI, strengthened backend CI, and added grouped Dependabot coverage.
- Changed Render's source Blueprint to Standard, one web worker, a 30-second graceful shutdown,
  pre-deploy/start separation, 1 MiB request bound, and explicit Neo4j pool and timeout values.
- Moved migrations and approved foundation reconciliation to `deploy/predeploy.sh`; ordinary web
  startup now only launches the disposable Uvicorn process. Production demo seeding is refused.
- Added structured request and Neo4j timing/outcome telemetry without bodies, credentials, Cypher,
  or parameters; public/private/no-store cache policy and ETags; bounded declared and chunked bodies;
  optional origin-token protection; and dependency-independent liveness with readiness retained.
- Added the workers.dev-only `current-flow-api-gateway` source, focused tests, explicit public cache
  rules, CORS normalization, health/auth/cookie/range/no-cache bypass, origin-token forwarding, and
  bounded errors. Its checked source cannot claim a production route.
- Added the read-only bounded load-smoke harness, production runbook, scaling/rollback thresholds,
  architecture/deployment updates, and the accepted production topology decision.

## Files or components changed

- Toolchain and dependency policy: `.nvmrc`, `.node-version`, `.npmrc`, `package.json`,
  `package-lock.json`, removed `pnpm-lock.yaml`, `config/toolchain.json`,
  `scripts/toolchain/verify.mjs`, TypeScript/ESLint configuration.
- CI: `.github/workflows/frontend.yml`, `.github/workflows/alchemy-api.yml`,
  `.github/dependabot.yml`.
- Render/FastAPI/Neo4j: `render.yaml` and the service configuration, lifecycle, logging, repository,
  middleware, deploy scripts, locks, tests, example environment, and load harness.
- Cloudflare: `workers/api-gateway` source, tests, and workers.dev-only configuration.
- Documentation: architecture, deployment, backend, production operations, the superseded alpha
  decision, and the new production topology decision.

## Decisions made

- [Adopt a production Render, AuraDB, and Cloudflare gateway topology](../decisions/20260826T175411Z--adopt-production-render-aura-cloudflare-topology.md)

## Verification commands and results so far

- `npm run workspace:doctor` under the configured pinned Node runtime — passed before tracked edits.
- Secret-safe Neo4j driver connectivity query against the replacement Aura instance — passed with
  `RETURN 1`; the new graph initially contained zero nodes.
- `npm audit` after exact lock reconciliation — zero known vulnerabilities.
- `npm run gateway:test` — passed, 5/5 gateway tests.
- Focused backend middleware and deployment tests — passed, 14/14 tests.
- `npm run check` under Node 24.19.0/npm 11.17.0 — passed: toolchain check, strict type-check, lint,
  48 Vitest files / 393 tests, 11 workspace tests, 5 gateway tests, commentary and transition
  validators, and a 469-module Vite 7.3.6 production build.
- `uv run alchemy check` under Python 3.12.14/uv 0.11.32 — passed: Ruff format/lint, strict mypy,
  44 backend tests passed, the disposable integration test skipped by its explicit environment
  gate, and the OpenAPI contract matched.
- Prettier check for all task-owned JavaScript, JSON, YAML, Markdown, and Worker files plus
  `git diff --check` — passed. The unrelated repository-wide formatting backlog remains outside this
  task and was not rewritten.

## Failed or rejected approaches worth remembering

- A Render workspace/team upgrade did not upgrade the web service instance. Standard must be saved
  on the service's Compute Plan page.
- The earlier Vite 7.0.4 pin produced current audit findings and was replaced with audited 7.3.6.
- `@tsconfig/node24` requires TypeScript library support newer than the locked TypeScript 5.8.3.
  Runtime remains Node 24, while configuration scripts retain the compatible `@tsconfig/node22`
  preset and the browser build explicitly includes only the required ES2022 Array library.
- uv 0.11.32 predates automatic discovery of the newly released Python 3.12.14 build. Verification
  used a separately provisioned 3.12.14 interpreter while keeping uv itself at the production pin.

## Known risks and assumptions

- No live platform mutation has occurred yet. The Standard charge, credential transmission,
  GitHub ruleset, push, deployment, and DNS/gateway changes remain future external side effects.
- The first production pre-deploy will migrate and populate an empty Aura graph. A failed pre-deploy
  should leave the existing live service in place, but the current live service is already unhealthy.
- The Worker must be proven on workers.dev before any API route or proxy change.
- The former Aura database and credential set must not be deleted.

## Unresolved issues

- Obtain action-time user confirmation for the $25/month Standard service selection, secret entry,
  and GitHub ruleset permissions change.
- Commit and push the verified foundation, observe real CI check names, apply default-branch/ruleset
  settings, complete the Aura cutover, deploy/test the gateway, route production safely, and perform
  full live verification.
- Reconcile `PROJECT_STATE.md` and finalize this execution log with exact commits, deployment IDs,
  before/after states, and rollbacks.

## Uncommitted or unmerged state

All work described above remains uncommitted on `codex/chat-01a02bf0beb1`; no push has occurred.

## Exact next recommended action

After explicit confirmation, save Render Standard and transmit only the four replacement Aura
values to Render, then commit/push the verified repository foundation and observe the controlled
deployment before advancing to the gateway route.

## Relevant files, commits, issues, or external references

- Starting release `746ae3b0dc5540f5c2762c5fb2217e24d6259e1f`
- [Production operations](../../PRODUCTION_OPERATIONS.md)
- [Deployment guide](../../DEPLOYMENT.md)
- [Canonical project state](../PROJECT_STATE.md)
