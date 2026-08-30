# Current Flow Codex Cloud operating guide

Codex Cloud is Current Flow's default from-anywhere development boundary. It creates isolated,
disposable repository checkouts; GitHub branches and pull requests are the durable bridge between
Cloud tasks, Desktop work, review, and production. Protected `master` remains the only release
authority. Cloud is not a production service and ordinary tasks receive no Render, AuraDB,
Cloudflare, or application secrets.

## Saved environment

Use the saved **Current Flow Cloud** environment for `basykcode/currentflow`:

| Setting             | Exact value                                                 |
| ------------------- | ----------------------------------------------------------- |
| Setup command       | `bash scripts/codex/cloud-bootstrap.sh setup`               |
| Maintenance command | `bash scripts/codex/cloud-bootstrap.sh maintenance`         |
| Container caching   | On                                                          |
| Agent internet      | Off                                                         |
| Non-secret variable | `CURRENT_FLOW_CODEX_EXECUTION=cloud`                        |
| Native toolchain    | Node `22.22.2`, npm `11.4.2`, Python `3.13.13`, uv `0.7.22` |

The bootstrap verifies the native tools before dependency access and never installs alternate
runtimes, package managers, or shims. Reset the environment cache after any reviewed change to the
image, setup/maintenance commands, runtime pins, or dependency lockfiles. Keep internet Off unless a
specific task is authorized to use a minimal allowlist; setup dependency access is separate.

## Open Cloud from Desktop or phone

- **Desktop:** use the signed-in in-app browser at <https://chatgpt.com/codex>.
- **Phone:** use a same-account browser at <https://chatgpt.com/codex>. The native ChatGPT app is
  also suitable only when its Code/Codex tab is available to this account.

Do not assume repository-backed Cloud `task_e` tasks will appear in the Desktop app's native
local-task list. Cloud and the local managed-worktree interface are distinct surfaces; GitHub is the
shared durable record.

**Remote is not Cloud.** Remote execution depends on an awake, connected machine. Cloud tasks run in
the saved hosted environment and do not require the development workstation to remain online.

## Start and complete everyday work

1. Open Current Flow Cloud, select current GitHub `master`, and start one task for one independent
   concern. Start separate Cloud tasks in parallel for unrelated concerns.
2. Verify the selected source by exact `HEAD`. A hosted checkout may name its disposable branch
   `work`; do not switch it merely to reproduce the GitHub source-branch name.
3. Run `npm run codex:doctor`, inspect the relevant code, continuity, decisions, handoffs, and
   history, then make only the scoped change.
4. Run focused checks while iterating, the appropriate Python gate for backend work, and
   `npm run check` before readiness. Create the required unique handoff and commit task-owned files.
5. Use **Create PR**. Wait for review and these exact required checks on the final head:
   - `Frontend / frontend-quality`
   - `Alchemy API / alchemy-quality`
   - `Alchemy API / alchemy-neo4j-integration`
   - `Alchemy API / alchemy-container`
6. Integrate one pull request at a time through the protected Master / Integration path. If another
   change lands first, update from current `master` and rerun affected checks; two independently
   green stale heads are not automatically composable.
7. After an authorized merge, wait for Render and both Cloudflare production builds, verify the live
   product and API contracts, and retain rollback options until the smoke pass completes.

Workstream names such as Astrology, Alchemy, Intelligence, Finance, Other Tools, and Miscellaneous
are routing labels, not long-lived shared branches. A dependent task must start from the exact
prerequisite GitHub branch or wait for its pull request to merge.

## Moving work between local and Cloud

An existing local managed-worktree task cannot be live-moved into Cloud. Preserve useful work by
committing it to its GitHub branch and opening or updating its pull request, then start the Cloud task
from that exact branch. Do the reverse the same way when protected evidence or machine-specific
state requires local work. Never copy an uncommitted working tree into another execution boundary.

GitHub branches, commits, pull requests, reviews, checks, and continuity handoffs—not a Cloud task's
lifespan or a local app list—are the durable bridge.

## Integration, production verification, and rollback

Merging protected `master` is a release event and requires explicit authorization. It drives the
Cloudflare frontend, the separately rooted Cloudflare API gateway, and the Render FastAPI service.
AuraDB remains a managed dependency accessed only through Render secrets.

Verify the release as one product:

- frontend `/` and `/alchemy` return successfully;
- gateway `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/meta` succeed;
- readiness reports Neo4j available and metadata matches the exact release/toolchain contract;
- representative herb and formula reads pass, eligible public GETs show MISS then HIT, weak edge
  ETag replay returns an empty 304, and no-cache/auth/cookie traffic remains no-store BYPASS;
- allowed and denied CORS origins behave correctly; and
- direct protected Render application routes return origin denial.

For rollback, use a GitHub revert through a protected pull request, select the prior verified Render
deploy, and use Cloudflare version rollback for the affected frontend or gateway. Follow
[`PRODUCTION_RECOVERY_RUNBOOK.md`](PRODUCTION_RECOVERY_RUNBOOK.md); do not delete a former AuraDB as
part of routine release cleanup.

## Evidence and secret boundary

Never place real `.env` files, credentials, raw commentary, internal Yijing packets, local
transition evidence, Alchemy raw data, or private runtime state in Cloud or GitHub. The tracked
Cloud boundary enforces the repository-specific protected roots. Private Prompt Lab source data in
password-protected Cloudflare KV is a separate production boundary and must not be downloaded into
ordinary Cloud tasks.
