# Current Flow Codex Cloud workflow

Codex Cloud is the default boundary for development that must be available from a phone or any web
browser. It provides disposable, isolated checkouts for concurrent work; GitHub is the durable task
state; protected `master` remains the sole release authority. The local Codex desktop worktree system
remains a fallback for protected evidence and machine-specific work.

```text
Astrology task ─┐
Alchemy task ───┼─> short-lived branches ─> protected pull requests ─> Integration queue
Other task ─────┘                                                        │
                                                                          v
                               Cloudflare frontend + API gateway <─ master ─> Render API
                                                                          │
                                                                          v
                                                                 verified live product
```

Codex Cloud is a development environment, not another production service. Ordinary Cloud tasks
receive no Render, AuraDB, Cloudflare, or production application credentials.

## Canonical environment

Maintain one active environment named **Current Flow Cloud** with:

| Setting              | Value                                               |
| -------------------- | --------------------------------------------------- |
| Repository           | `basykcode/currentflow`                             |
| Image                | `universal`                                         |
| Package version      | Node `22` (currently exact `22.22.2`)               |
| Package version      | Python `3.13` (currently exact `3.13.13`)           |
| Environment variable | `CURRENT_FLOW_CODEX_EXECUTION=cloud`                |
| Setup script         | `bash scripts/codex/cloud-bootstrap.sh setup`       |
| Maintenance script   | `bash scripts/codex/cloud-bootstrap.sh maintenance` |
| Container caching    | enabled after the bootstrap is on default `master`  |
| Secrets              | none for ordinary development                       |

Use **Set package versions** in the environment editor for Node `22` and Python `3.13`. The configured
universal image currently supplies exact Node `22.22.2`, npm `11.4.2`, Python `3.13.13`, and uv
`0.7.22`. Those are the canonical development and production versions. The setup script verifies the
native tools before dependency access and never installs a second Node, npm, Python, or uv runtime.
`.node-version` and `.python-version` remain enforcement evidence, not substitutes for the Cloud
runtime controls. GitHub Actions, Cloudflare builds, and the Render container carry the same exact
declarations. If the Cloud image advances, update every declaration and lockfile together through a
reviewed pull request. Setup must fail rather than improvise a different runtime or silently
reconstruct protected inputs.

Codex creates a cached base by checking out the repository default branch before running setup. Do
not enable the tracked setup command plus caching until `cloud-bootstrap.sh` exists on default
`master`. A pre-merge pilot must keep caching disabled so its selected feature branch is checked out
before setup. After the bootstrap merges, reset the environment cache, enable caching, and run one
fresh pilot. Reset the cache again whenever a Node, npm, Python, uv, image, setup, or maintenance pin
changes.

Keep agent internet access off for ordinary repository tasks. Enable only the smallest necessary
allowlist for a task that explicitly requires current primary-source research; dependency access
during setup is separate. Never use internet access to retrieve proprietary evidence that the Git
checkout intentionally excludes.

If duplicate environments exist, stop creating tasks in the unused entry. Retain it until the active
environment has passed the pilot and no task references the duplicate; deletion is a separate
cleanup action.

## Start work from anywhere

1. Open Codex Cloud in ChatGPT on the web or phone.
2. Select **Current Flow Cloud** and branch `master` explicitly for the task; branch selection is per
   task, not an environment-level base-branch setting.
3. Submit one concrete request. Name its workstream—Astrology, Alchemy, Intelligence, Finance, Other
   Tools, or Miscellaneous—when that helps routing.
4. Let the task run in its isolated checkout. For another independent request, start another Cloud
   task from the same current `master` in parallel.

Workstream names are labels, not permanent branches or mutable shared chats. GitHub branches and pull
requests preserve completed work more reliably than a long-lived environment. A task that depends on
unmerged work must either start from the exact prerequisite branch or wait for its pull request to
merge; it must not rediscover or copy the changes by hand.

## Worker completion contract

Every implementation task:

1. runs `npm run codex:doctor` before tracked changes;
2. inspects current code, continuity, relevant history, and the exact base revision;
3. keeps the change scoped and creates a unique handoff;
4. runs focused tests while iterating and `npm run check` before claiming readiness;
5. commits only task-owned files when authorized; and
6. pushes or opens a pull request only when authorized.

Backend changes additionally run `npm run alchemy:check` or the exact frozen uv equivalent. Container
and disposable Neo4j verification remain in GitHub Actions; a Cloud worker does not need production
Aura credentials.

Feature tasks do not edit `docs/continuity/PROJECT_STATE.md`. They report their exact source head and
verification in their unique handoff.

## Parallel pull requests and integration queue

Independent pull requests may test concurrently. Merges are serialized through the Master /
Integration role so the product has one coherent release line.

A feature pull request is a queue entry. After its exact head is reconciled into an integration pull
request and that integration change reaches `master`, close the absorbed feature pull request with a
link to the integration commit; do not merge it a second time.

The protected `master` path requires an up-to-date pull request, resolved conversations, and these
exact checks:

- `Frontend / frontend-quality`
- `Alchemy API / alchemy-quality`
- `Alchemy API / alchemy-neo4j-integration`
- `Alchemy API / alchemy-container`

The Integration task inspects each exact source commit and handoff, merges or reconciles it into a
fresh branch based on current `master`, resolves semantic conflicts, updates `PROJECT_STATE.md`, runs
the full release gate, and opens the integration pull request. If another change lands first, update
from the new `master` and rerun the affected checks. Never merge two green-but-stale branches as if
their results were composable.

A failing required check blocks the queue. Do not bypass it. The existing administrative bypass is
reserved for an explicitly authorized, fully verified solo-maintainer merge when GitHub cannot
satisfy its own-review requirement; restore the normal rule immediately afterward and record the
event without secrets.

## Build and ship as one product

Merging protected `master` is the release event and therefore requires explicit authorization.
Repository and provider configuration keep the release synchronized:

- the frontend Cloudflare Worker builds the Vue application from `master`;
- `current-flow-api-gateway` builds the gateway root from `master`;
- Render deploys the FastAPI service from `master` after checks pass; and
- AuraDB remains a managed dependency reached only through Render secrets.

After the provider deployments finish, verify the release as a unit:

- apex and `www` frontend load successfully;
- `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/meta` succeed through the public gateway;
- representative Alchemy herb and formula reads satisfy their cache and ETag contract;
- a changed user-facing route receives a focused browser smoke check; and
- direct protected Render application routes remain unavailable without the edge token.

Keep the prior verified provider versions and database credentials available until this smoke pass is
complete. Follow `PRODUCTION_RECOVERY_RUNBOOK.md` for rollback; never delete the former AuraDB as an
incidental release step.

## Evidence and secret boundary

These roots stay out of Codex Cloud and GitHub:

- `data/hexagram-commentary/chunked/`
- `content/yijing/internal/`
- `data/hexagram-transitions/local/`
- `services/alchemy-api/data/raw/`
- `var/alchemy-data/`
- real `.env` files, local credentials, dependencies, builds, caches, and virtual environments

Tracked public drafts, provenance metadata, hashes, rights statuses, and validators remain eligible.
The two rights-approved Prompt Lab source sets already stored in private Cloudflare Workers KV are a
separate password-protected production boundary; they must not be downloaded into a Cloud task.

## Local fallback and rollback

Use the desktop worktree system when a task requires protected local evidence, machine-specific
browser state, or a provider operation that cannot be performed safely from Cloud. Run
`npm run codex:doctor`; the local checkout keeps its lease and isolated runtime behavior.

The migration is reversible: stop starting new Cloud tasks, preserve every Cloud branch or pull
request in GitHub, and continue from the existing local managed worktrees. Do not delete local lanes
or the duplicate Cloud environment until the active environment, parallel pilots, protected pull
request, and a complete release have all been verified.
