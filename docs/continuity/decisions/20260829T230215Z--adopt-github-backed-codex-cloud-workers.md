# Decision: Adopt GitHub-backed Codex Cloud workers

- Status: accepted
- Date (UTC): 2026-08-29
- Scope: development execution, parallel work, integration, and release coordination

## Context

Current Flow's local worktree lease system prevents concurrent desktop tasks from sharing files,
branches, runtimes, or protected evidence. It remains safe but binds every worker to one workstation
and makes eleven persistent local tasks expensive to operate from elsewhere. Codex Cloud is now
available for the repository, but its normal Git checkout was previously classified as the local
read-only primary checkout and could not pass the mandatory workspace doctor.

The owner wants to begin work from a phone or web browser, run multiple independent development
threads simultaneously, and still merge, build, and ship one coherent product. Raw commentary,
internal Yijing packets, transition evidence, Alchemy raw data, and real environment files must not
enter GitHub or Codex Cloud.

## Options considered

1. **Remote-control the existing workstation** — rejected as the default because execution still
   depends on the local machine being online and does not remove worktree, capacity, or connectivity
   limits.
2. **Move the eleven local task histories into persistent Cloud lanes** — not supported as a literal
   transfer and operationally weak because long-lived mutable branches drift from `master` and from
   one another.
3. **Use disposable Cloud workers with GitHub as durable state** — accepted. Independent tasks begin
   from current `master`, use short-lived branches and protected pull requests, and converge through
   a serialized integration queue.

## Decision

Maintain one canonical **Current Flow Cloud** environment for `basykcode/currentflow`. It pins Node
24.19.0 and Python 3.13.14 through the environment's package-version controls, sets the non-secret
`CURRENT_FLOW_CODEX_EXECUTION=cloud` marker, runs the tracked setup and maintenance scripts, enables
post-setup caching after the bootstrap reaches default `master`, and holds no ordinary production
secret.

The startup hook distinguishes Cloud explicitly rather than inferring it from `.git` shape. A Cloud
task is already an isolated worker and never dispatches to desktop or uses the local lease registry.
The marker cannot override a checkout whose Git directory contains the Current Flow local lease
registry. Missing mode retains the fail-safe local behavior; an unknown value stops startup.

Treat Astrology, Alchemy, Intelligence, Finance, Other Tools, and Miscellaneous as task-routing
labels, not permanent branches. Run independent tasks concurrently from explicit GitHub `master`.
Each task owns one short-lived `codex/*` branch, one scoped change, one handoff, and—when authorized—
one protected pull request. Dependent tasks name an exact prerequisite branch or wait for its merge.

Protected `master` remains the sole release authority. A dedicated Master / Integration task
serializes reconciliation, owns `PROJECT_STATE.md`, reruns the full release gate, and merges only with
explicit authorization. The `master` merge then drives the existing Cloudflare frontend, Cloudflare
API gateway, and Render release path as one product; live smoke verification is part of release
completion.

The local desktop coordinator, app-managed worktrees, branch leases, isolated runtimes, and
`.worktreeinclude` remain the fallback for protected evidence and machine-specific work.

## Evidence and security boundary

Cloud setup fails if a protected evidence root or real environment file is tracked, and Cloud doctor
also fails if one exists untracked in the checkout. Cloud workers receive no AuraDB, Render,
Cloudflare, or production application credentials for ordinary development. GitHub Actions and the
providers retain those boundaries.

The previously accepted Prompt Lab storage of two rights-approved source sets in private,
password-protected Cloudflare KV remains a distinct production exception. It does not authorize
downloading those sources into Codex Cloud.

## Consequences and tradeoffs

- Work can begin from the web or phone without leaving the development workstation online.
- Many independent tasks can execute and test concurrently, while only integration and release are
  serialized.
- GitHub branches, pull requests, checks, and handoffs—not task longevity—become durable work state.
- Local tasks remain necessary for source preparation and other protected local-input workflows.
- A stale pull request must update from `master` and rerun checks after another merge.
- Merging `master` remains consequential because it activates the production deployment path.

## Verification criteria

- Explicit Cloud mode starts as `CLOUD-WORKER`, creates no lease, and changes no branch.
- Missing mode preserves local primary coordination and linked-worktree lease behavior.
- Unknown execution mode fails closed.
- The Cloud boundary rejects protected roots and private environment files in Git or the Cloud
  checkout.
- Setup and maintenance install the exact locked toolchain and dependencies and pass Cloud doctor.
- Cached setup begins only after the tracked bootstrap exists on default `master`; pin changes reset
  the cache.
- Two independent pilot tasks can start from the same `master`, produce separate results, and leave
  the repository and production unchanged.
- A protected pull request reports all four required production checks before merge eligibility.
- An authorized `master` merge deploys through the existing provider path and passes live smoke
  verification as one release.

## Supersedes

None. This decision makes Cloud the default from-anywhere worker boundary while retaining the local
desktop behavior defined below.

## Related records and files

- [Automatically dispatch primary tasks to managed worktree workers](20260822T235412Z--automatically-dispatch-primary-tasks-to-managed-worktrees.md)
- [Adopt a production Render, AuraDB, and Cloudflare gateway topology](20260826T175411Z--adopt-production-render-aura-cloudflare-topology.md)
- [`../../CODEX_CLOUD.md`](../../CODEX_CLOUD.md)
- [`../../CODEX_PARALLEL_WORK.md`](../../CODEX_PARALLEL_WORK.md)
- [`../../../AGENTS.md`](../../../AGENTS.md)
- [`../../../scripts/codex/cloud-bootstrap.sh`](../../../scripts/codex/cloud-bootstrap.sh)
- [`../../../scripts/codex/cloud-boundary.mjs`](../../../scripts/codex/cloud-boundary.mjs)
- [Adopt an installable Python 3.13.14 production runtime](20260829T231911Z--adopt-installable-python-31314-runtime.md)
