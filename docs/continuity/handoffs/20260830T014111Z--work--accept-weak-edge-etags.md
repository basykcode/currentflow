# Handoff: Accept weak edge ETags for public conditional requests

- UTC timestamp: 2026-08-30T01:41:11Z
- Branch/worktree: `work` / `/workspace/currentflow` (isolated Codex Cloud worker)
- Starting commit: `bbb28082c974e8be002018f11c91fa52ec8a4a05`
- Task/objective: Correct the production API release contract so Cloudflare-shaped weak ETags
  satisfy public `If-None-Match` preconditions without weakening the deterministic origin ETag.
- Status: complete

## Starting context

The working tree was clean at the exact requested protected-`master` starting SHA. The Cloud worker
checkout used the platform branch label `work`; no branch was switched. `CURRENT_FLOW_CODEX_EXECUTION`
was `cloud`, `npm run workspace:doctor` passed, and the native Node, npm, Python, and uv versions
matched `config/toolchain.json`. The existing middleware compared `If-None-Match` to the generated
strong ETag using exact string equality, so Cloudflare's equivalent `W/` validator missed.

## Work completed

- Added grammar-aware entity-tag list parsing and weak comparison for public GET/HEAD conditional
  evaluation, including wildcard support, while retaining the strong SHA-256 origin validator.
- Added API coverage for actual weak edge input, comma-separated lists, wildcard, nonmatching
  validators, retained strong response ETags, and empty 304 bodies.
- Documented Cloudflare edge weakening and the origin's weak precondition comparison contract.

## Files or components changed

- `services/alchemy-api/src/current_alchemy/app.py`
- `services/alchemy-api/tests/api/test_api.py`
- `docs/API_CACHE_POLICY.md`
- This handoff

## Decisions made

None. This is a narrow standards-correct repair to the accepted cache contract.

## Important rationale

`If-None-Match` uses weak comparison for GET and HEAD. Normalizing only the optional `W/` prefix
during comparison makes an edge-weakened validator equivalent without changing the deterministic
strong ETag produced by the origin. Parsing list members avoids treating a whole comma-separated
field as one opaque string, and invalid syntax does not accidentally satisfy the precondition.

## Verification commands and results

- `npm run workspace:doctor` — passed in Cloud mode before tracked changes.
- `node --version; npm --version; python3 --version; uv --version` — reported Node 22.22.2, npm
  11.4.2, Python 3.13.13, and uv 0.7.22.
- `uv --directory services/alchemy-api run pytest tests/api/test_api.py -k 'public_cache'` — passed,
  2 selected tests.
- `uv --directory services/alchemy-api run alchemy check` — passed Ruff format and lint, strict
  mypy, 59 tests with the explicitly gated disposable-Neo4j test skipped, and OpenAPI contract check.
- `npm run check` — passed the complete repository gate: Cloud boundary, toolchain, types, lint, 411
  frontend tests, 23 workspace tests, 16 gateway tests and dry-run build, 5 load-policy tests,
  commentary/transition validation, and production build.
- `uv --directory services/alchemy-api run pytest services/alchemy-api/tests/api/test_api.py -k
'public_cache'` — rejected the duplicated path after `uv --directory` changed the working
  directory; rerun immediately with the correct service-relative path above.

## Failed or rejected approaches worth remembering

- Exact validator string equality is not valid for GET/HEAD `If-None-Match`; do not strip the weak
  prefix from the emitted origin ETag as a workaround.

## Known risks and assumptions

- No live provider smoke was run because deployment and provider access were explicitly out of
  scope. GitHub Actions and a separately authorized release should verify the public edge path.

## Unresolved issues

None in the task scope.

## Uncommitted or unmerged state

The task-owned application, test, policy documentation, and this handoff are included in the local
task commit. Nothing has been pushed, merged, deployed, or changed at a provider.

## Exact next recommended action

Open the protected hotfix pull request, require all production checks, and only after an authorized
merge verify the observed weak Cloudflare ETag replay returns an empty 304 response.

## Relevant files, commits, issues, or external references

- Starting production revision: `bbb28082c974e8be002018f11c91fa52ec8a4a05`
- `docs/API_CACHE_POLICY.md`
