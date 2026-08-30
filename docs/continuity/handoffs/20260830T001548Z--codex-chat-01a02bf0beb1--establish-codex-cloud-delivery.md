# Handoff: Establish Codex Cloud delivery and native toolchain

- UTC date: 2026-08-30
- Branch: `codex/chat-01a02bf0beb1`
- Integration base: GitHub `master` at `abe5dd22a20aeba9cee0edf658a55c97ecf40eaa`
- Verified pre-handoff head: `f7658dfef47e8a4f9b4303ef93cbfc6474749ba1`
- Pull request: [#9 — Establish production-scale Codex Cloud delivery](https://github.com/basykcode/currentflow/pull/9)
- Production release: not authorized or performed

## Objective and reconstructed state

Make Current Flow development available through Codex Cloud from a browser or phone, allow multiple
isolated tasks to run concurrently, and converge them through protected GitHub pull requests and one
serialized integration/release line. Preserve local app-managed worktrees for protected evidence and
provider operations. Eliminate repeated runtime mismatch work by using the exact software versions
already native to the configured Codex Cloud environment across development, CI, builds, and
production wherever supported.

The branch reconciles the retained production-hardening commits `66f2419`, `14eea13`, and `54adc7d`
with current GitHub `master` through merge `33e56a5`. It then adds the Cloud workflow and toolchain
work in `c1f8520`, `2b09a95`, `b2f2709`, and `f7658df`. Unrelated integrated product work from
`abe5dd2` was preserved.

## Result

- Configured one active, secret-free Codex environment named **Current Flow Cloud** for
  `basykcode/currentflow`, using the universal image, Node `22`, Python `3.13`,
  `CURRENT_FLOW_CODEX_EXECUTION=cloud`, and
  `bash scripts/codex/cloud-bootstrap.sh setup`.
- Verified the hosted image actually supplies exact Node `22.22.2`, npm `11.4.2`, Python `3.13.13`,
  and uv `0.7.22`. Setup checks these values and fails on drift; it never installs or replaces a
  language runtime or package manager.
- Synchronized those exact versions through the canonical manifest, version files, package metadata,
  TypeScript Node configuration, lockfiles, GitHub Actions, the Render container, API metadata, and
  documentation. Project libraries not supplied by Codex remain exact, reviewed, lockfile-controlled
  choices.
- Added a native-npm-compatible supply-chain boundary. `.npmrc` disables lifecycle scripts;
  `npm run dependencies:install` validates the exact Node/npm invocation and lockfile lifecycle set,
  performs `npm ci --ignore-scripts`, then rebuilds only reviewed esbuild, workerd, and optional
  fsevents versions that are actually installed.
- Prevented uv from downloading or managing another Python in Cloud. Both sync and execution use the
  existing `python3` with `--no-managed-python --no-python-downloads`.
- Added the Cloud evidence boundary, Cloud/local SessionStart modes, synchronized CI, dependency
  policy, API gateway and load-test foundations, runbooks, and the from-anywhere integration workflow.
- Confirmed that hosted tasks may expose their disposable working branch as `work` even when started
  from a named GitHub source branch. Exact starting `HEAD`, not the internal branch label, is the
  source identity check.
- Opened protected pull request #9 into `master`. The pull request was automatically mergeable at
  creation and correctly waited for the four required GitHub checks and one approving review.

## Execution and verification log

No credential or raw environment value was printed, committed, or added to Cloud.

1. The leased local integration worktree reported branch `codex/chat-01a02bf0beb1`, session
   `01a02bf0beb1`, slot 2, and `Workspace isolation: OK`. Origin was verified before every push as
   `git@github-basykcode:basykcode/currentflow.git`.
2. Exact local Node `22.22.2` / npm `11.4.2`:
   - `npm run dependencies:install` passed: 451 packages installed, 452 audited, zero vulnerabilities;
     only the exact reviewed install-script packages were rebuilt.
   - `npm run check` passed: toolchain boundary and 7 toolchain tests, strict type-check and lint,
     52 Vitest files / 410 tests, 23 workspace tests, 12 gateway tests and Wrangler dry-run, 3 bounded
     load-policy tests, 64/379/5 commentary validation, 64/384 transition validation, and a 485-module
     production build. The existing large Astrology chunk warning remains non-failing.
   - The same complete gate passed with `CURRENT_FLOW_CODEX_EXECUTION=cloud` inherited, proving that
     local-boundary unit tests no longer depend on ambient execution mode.
3. Exact local Python `3.13.13` / uv `0.7.22`, with Python management and downloads disabled:
   - Ruff format checked 71 files; Ruff lint passed.
   - mypy passed 53 source files.
   - pytest passed 52 tests and intentionally skipped the one opt-in disposable-Neo4j integration
     test.
   - The OpenAPI contract was current.
4. Hosted Alchemy pilot
   [`task_e_6a93728852d08326932163ef16aeda14`](https://chatgpt.com/codex/cloud/tasks/task_e_6a93728852d08326932163ef16aeda14)
   checked exact commit `b2f2709`, reported all four native versions exactly, passed Ruff, mypy,
   52 tests plus the intentional Neo4j skip, and OpenAPI, and left the checkout clean. It used no
   production credential or service.
5. The first hosted full pilot
   [`task_e_6a937261e73c832695bb0ace831a02ca`](https://chatgpt.com/codex/cloud/tasks/task_e_6a937261e73c832695bb0ace831a02ca)
   correctly exposed four workspace-test failures: local SessionStart scenarios inherited the host's
   Cloud mode. The product suite still reached 410/410 passing tests. Commit `f7658df` made every local
   scenario inject local mode explicitly while preserving separate default, Cloud, and invalid-mode
   coverage.
6. Final hosted full pilot
   [`task_e_6a9374a7ab7c832680bdd77689d49377`](https://chatgpt.com/codex/cloud/tasks/task_e_6a9374a7ab7c832680bdd77689d49377)
   checked exact `f7658df` and passed all 12 top-level stages: 7 toolchain tests, 410 application tests,
   23 workspace tests, 12 gateway tests, 3 load-policy tests, both corpus validators, Wrangler dry-run,
   and the 485-module production build. Its final checkout was clean.
7. Hosted npm emitted a non-failing warning for the platform-inherited `http-proxy` configuration.
   It did not change the exact npm version or any exit status and was not worked around by changing
   runtime or package-manager policy.

At handoff creation, pull request #9 had started the required `frontend-quality`, `alchemy-quality`,
`alchemy-neo4j-integration`, and `alchemy-container` checks. GitHub remains the authoritative record
for their result on the final handoff-inclusive head.

## Provider and production state

- No Render, AuraDB, Cloudflare routing, DNS, GitHub ruleset, or production secret was changed in
  this Cloud migration step.
- Existing live production remains on GitHub `master` at `abe5dd2` and its previously verified
  provider deployments.
- Current Flow Cloud agent internet access is off, contains no secrets, and keeps post-setup caching
  off. Caching must remain off until the tracked bootstrap reaches default `master`.
- The unused duplicate Cloud environment was retained; deleting it is a separate destructive cleanup
  action.
- No local lane, worktree, or backup branch was deleted. The existing local worktree system remains
  an immediate fallback.

## Remaining activation and rollback

1. Keep all four required GitHub checks green on the final pull-request head and resolve any review
   finding without bypassing protection.
2. Obtain explicit authorization before merging pull request #9. That merge is the production release
   event and may start Render and Cloudflare builds.
3. After the merge, reset the Current Flow Cloud environment cache, configure the tracked maintenance
   command if the caching UI exposes it, enable caching, and run a fresh `master` pilot.
4. During release activation, make Cloudflare skip its automatic dependency install and run exact npm
   `11.4.2` through the documented audited installer. Verify Render builds the exact Python/uv image.
5. Verify the deployed frontend, public gateway health/readiness/meta routes, representative Alchemy
   reads, cache/ETag/bypass behavior, direct-origin protection, and provider metadata before declaring
   the release live.

Before merge, rollback is simply to close pull request #9 and stop selecting Current Flow Cloud; all
local lanes and live production remain intact. After an authorized merge, use the documented provider
rollback procedure and preserve the former AuraDB and credentials until the complete live smoke pass.
