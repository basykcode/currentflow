# Handoff: Isolate concurrent Codex chats

- UTC timestamp: 2026-07-30T02:22:06Z
- Branch/worktree: `codex/hexagram-forest-transitions` /
  `C:\Users\Futures Staff\Documents\Current Flow` (primary checkout)
- Starting commit: `85954a5059bd870f15c9dd072eabd9e55d3c6fad`
- Task/objective: Build a project-specific system that prevents concurrent Codex chats from sharing
  working state even when each chat uses a different branch.
- Status: partial: isolation implementation is complete and focused verification passes, but it is
  uncommitted/unintegrated and the required repository-wide check is blocked by pre-existing
  transition work.

## Starting context

The branch had no upstream and the primary checkout was already dirty. Pre-existing work included
modified `.gitignore`, `package.json`, and `src/components/hexagrams/HexagramInspector.vue`;
untracked hexagram-transition scripts, data, drafts, components, and feature files; a historical
untracked handoff; and large untracked `tmp/` Alchemy dry-run output.

`git worktree list --porcelain` showed the primary checkout on
`codex/hexagram-forest-transitions` plus one separate permanent worktree on
`feat/advanced-transformation-lab`. Historical handoffs documented several earlier races in the
primary checkout: another chat moved the checked-out branch/commit, created files between inspection
and staging, and mixed backend/frontend work. The fixed Compose project name and host ports would
also collide even between proper worktrees.

## Work completed

- Added a trusted-project `SessionStart` hook that stops Codex in the primary checkout, fails closed
  when it cannot establish isolation, and manages linked worktrees.
- Added an atomic lease registry under local shared Git metadata. A chat exclusively claims one
  worktree/branch/runtime slot; a second chat, a branch mismatch, a protected integration branch, or
  a dirty unclaimed checkout is rejected.
- Added automatic `codex/chat-<session>` branch creation for clean detached Codex-managed worktrees.
- Added lease-specific Vite, API, Neo4j HTTP/Bolt, Compose project, container, and volume namespaces
  plus doctor/status/dev/Alchemy/release/prune commands.
- Added `.worktreeinclude` so ignored environment files and protected hexagram evidence are copied
  by value into managed worktrees instead of shared.
- Made Compose project name and host ports overridable while preserving the prior direct-command
  defaults.
- Added nine pure and disposable-Git integration tests for branch allocation, registry validation,
  primary rejection, dirty-import rejection, resume behavior, and exclusive leases.
- Added durable operating instructions, repository guidance, backend runtime notes, and an accepted
  decision record.
- Added `tmp/` to `.gitignore` so disposable cross-workstream output no longer pollutes status. The
  pre-existing transition-local ignore rule was preserved.

## Files or components changed

- `.codex/hooks.json`, `.worktreeinclude`
- `scripts/codex/`
- `AGENTS.md`, `README.md`, `docs/CODEX_PARALLEL_WORK.md`
- `docs/ALCHEMY_BACKEND.md`, `docs/continuity/README.md`
- `docs/continuity/decisions/20260730T020000Z--isolate-every-codex-chat-by-worktree-lease-and-runtime.md`
- `compose.yaml`, `.env.example`
- `.gitignore` and `package.json` add isolation changes alongside preserved pre-existing transition
  changes
- This handoff

## Decisions made

- [Isolate every Codex chat by worktree, lease, and runtime](../decisions/20260730T020000Z--isolate-every-codex-chat-by-worktree-lease-and-runtime.md)

## Important rationale

A branch only names a commit reference; chats in the same checkout still share working files, the
index, `HEAD`, untracked/generated content, and runtime resources. Codex-managed worktrees provide
the required separate checkouts, while a local shared lease prevents two chats from reusing one
permanent worktree and rejects dirty Local state copied into a new managed worktree. Lease-derived
ports and Compose names close the remaining repository-specific runtime collisions.

The official Codex worktree, `.worktreeinclude`, project-hook, and Local-versus-Worktree behavior
were verified through the current Codex manual before implementation.

## Verification commands and results

- `node --version` / `npm.cmd --version` — matched the pinned Node `v22.18.0`; npm was `10.9.2`.
- `npm.cmd run workspace:test` — passed 9/9 tests, including real Git branch/lease integration in
  disposable repositories.
- Project `commandWindows` hook command, invoked with raw SessionStart JSON — returned the expected
  fail-closed primary-checkout stop decision.
- `npm.cmd run workspace:status` — succeeded and reported no leases in the real repository; testing
  did not mutate real worktrees or the real lease registry.
- `node scripts/codex/workspace.mjs doctor` — rejected the real primary checkout as designed.
- `npm.cmd run lint` — passed with zero warnings.
- `npm.cmd run check` — **failed** at the pre-existing `transitions:validate` stage because
  `content/yijing/generated/transitions` does not exist. Before that failure, strict type-check,
  lint, 20 Vitest files / 81 tests, 9 workspace tests, and commentary validation all passed.
- `npm.cmd run build` — passed separately; Vite transformed 250 modules and produced `dist`.
- Focused `npx.cmd prettier --check ...` — passed for all isolation code and documentation.
- `git diff --check` — passed.
- `$env:NEO4J_PASSWORD='workspace-config-check'; docker compose config --quiet` — could not run
  because Docker is not installed or on `PATH` in this environment. No containers were started.

## Failed or rejected approaches worth remembering

- Branch-per-chat in one checkout is the existing failed design; do not repeat it.
- A conventions-only worktree guide was rejected because it cannot stop two chats from reusing a
  permanent worktree or importing dirty Local changes.
- Handoff to Local and `git stash` were rejected as normal chat-state transfer mechanisms because
  they return work to shared state.
- The project-wide check cannot become green until the separate transition workstream builds
  `content/yijing/generated/transitions`; this isolation task did not fabricate or repair that data.

## Known risks and assumptions

- Project hooks require one-time user trust. A worktree based on a historical branch that predates
  `.codex/hooks.json` is not protected.
- `.worktreeinclude` copies local evidence by value at creation time. This deliberately uses more
  disk and does not synchronize later changes.
- Docker Compose interpolation was not rendered by Docker locally because Docker is unavailable.
  The YAML is formatted and the environment/port mapping is covered by workspace tests, but a
  Docker-equipped integration task should run `docker compose config --quiet`.
- The existing primary checkout remains mixed and dirty. The new hook prevents future Codex starts
  there after integration; it cannot infer ownership of already-mixed files.

## Unresolved issues

- The isolation changes are not committed, merged, or pushed and therefore do not protect chats
  based on `master` yet.
- `npm run check` remains red because the pre-existing transition public bundle is absent.
- Existing dirty primary-checkout workstreams still need deliberate path-by-path rescue.

## Uncommitted or unmerged state

All isolation changes remain uncommitted on `codex/hexagram-forest-transitions`, alongside preserved
transition work and the historical untracked
`docs/continuity/handoffs/20260724T220539Z--master--resume-cross-device-workspace.md`. No branch,
worktree, commit, merge, rebase, push, or real lease was created or changed for the repository.
`docs/continuity/PROJECT_STATE.md` was not changed because this feature work is not integrated.

## Exact next recommended action

Authorize a clean integration worktree to path-stage the isolation-owned files and the isolation
hunks in `.gitignore` and `package.json`, run Docker Compose validation on a Docker-equipped host,
commit the system, and integrate it into `master`. Then trust the project hook and start every new
chat with **Worktree** from clean `master`.

## Relevant files, commits, issues, or external references

- [Operating guide](../../CODEX_PARALLEL_WORK.md)
- [Isolation decision](../decisions/20260730T020000Z--isolate-every-codex-chat-by-worktree-lease-and-runtime.md)
- [Official Codex worktree guide](https://learn.chatgpt.com/docs/environments/git-worktrees.md)
- [Official Codex hooks guide](https://learn.chatgpt.com/docs/hooks.md)
