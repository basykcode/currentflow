# Isolated Codex work for Current Flow

Current Flow uses one Codex chat per linked Git worktree, branch, lease, and runtime namespace. A
branch alone is not isolation: every chat pointed at the same checkout still shares its files,
index, checked-out `HEAD`, build outputs, and untracked data.

The repository's primary checkout is therefore a read-only coordinator. It may inspect project
state and create or coordinate app tasks, but every project mutation happens in an app-managed
worktree worker.

## One-time activation

After this system is integrated into the branch used to start new work:

1. Open the Current Flow project in the Codex desktop app.
2. Review and trust [`.codex/hooks.json`](../.codex/hooks.json) when Codex prompts. In the CLI,
   `/hooks` shows the pending project hook.
3. Keep the primary checkout free of implementation work. A Codex task opened there continues as a
   coordination-only task so it can automatically dispatch implementation requests without touching
   the primary project or Git state.

The hook and this document must exist on the branch selected as a new worktree's starting point. Use
`master` after the isolation change is integrated; a historical branch that predates the change
cannot enforce it.

## Default flow: ask once, then automatic worker dispatch

1. Create a brand-new Codex task in the saved Current Flow project and submit only the actual work
   request. Do not add worktree boilerplate.
2. If the app opens the task in the primary checkout, `SessionStart` continues it with mandatory
   coordination-only context. The coordinator may perform read-only inspection, but it cannot change
   project files, Git state, dependencies, generated output, or project runtimes.
3. For an implementation request, the coordinator resolves the saved Current Flow Git project with
   the app's `list_projects` capability and creates a separate task with the app's `create_thread`
   capability. The target is `environment.type=worktree`, with `startingState.type=branch` and
   `branchName=master`; it never imports the primary working tree.
4. The coordinator forwards the user's complete current request and the necessary repository
   constraints to that worker. It never asks the user to restate or copy the request, never directs
   the user to a composer control, and returns the created-task UI directive so the worker is
   directly available in the app.
5. On worker startup, the hook:
   - rejects a dirty worktree that has no owner;
   - creates `codex/chat-<session-id>` when the app supplied a clean detached worktree;
   - rejects an existing lease owned by another task and a branch that no longer matches its lease;
   - records an exclusive task/worktree/branch lease in the repository's local Git metadata; and
   - assigns a unique Vite, API, Neo4j, and Docker Compose namespace.
6. The worker installs dependencies if needed with `npm ci`, then runs
   `npm run workspace:doctor`. It does not edit until the command reports
   `Workspace isolation: OK`.

If a brand-new task already opens in its own app-managed linked worktree, it is already the worker;
the primary-coordinator dispatch step is skipped. Ordinary tasks never require Create Permanent
Worktree. Multiple requests can run concurrently because each dispatched worker receives its own
managed worktree, branch lease, and runtime namespace.

Never hand an implementation task to the primary checkout. Resume the existing task so Codex returns
to its associated worktree.

## Runtime commands

Use the wrappers instead of the shared defaults:

```powershell
npm run workspace:doctor
npm run workspace:dev
npm run workspace:alchemy -- up
npm run workspace:alchemy -- ps
npm run workspace:alchemy -- migrate
npm run workspace:alchemy -- seed
npm run workspace:alchemy -- logs
npm run workspace:alchemy -- down
```

`workspace:dev` uses the chat's leased Vite port and points the frontend at that chat's API port.
`workspace:alchemy` overrides the Compose project name and host ports, so containers, volumes, API,
and Neo4j instances from different chats do not collide. Its `migrate`, `seed`, `check`, and
`openapi` actions also point local backend tools at the leased Neo4j port. Direct `npm run dev`,
direct `docker compose`, and direct `npm run alchemy:*` retain their old defaults for nonparallel
human use but are not valid in concurrent Codex work.

Inspect all leases from any checkout:

```powershell
npm run workspace:status
```

The lease registry lives under the shared local `.git/codex/` metadata. It is never committed and
contains no source evidence or credentials.

## Local-only files

[`.worktreeinclude`](../.worktreeinclude) tells the Codex desktop app to copy the ignored `.env` and
local hexagram evidence directories into each managed worktree. These are snapshots copied by value:
one chat cannot mutate another chat's copy, and changes do not synchronize back.

`node_modules`, build output, caches, `tmp/`, and Alchemy data are intentionally not copied. Each
worktree installs or creates its own disposable runtime state.

## Finish a chat

1. Run the required verification and create the chat's unique continuity handoff.
2. Commit and push only when the user explicitly authorizes those operations.
3. Keep integration in a separate worktree and branch. Reconcile
   `docs/continuity/PROJECT_STATE.md` only in that integration task.
4. Archive the Codex chat after its branch is safely published or otherwise preserved. Codex manages
   cleanup and snapshots for its managed worktrees.

Permanent worktrees are not part of the ordinary task flow. For a deliberately permanent worktree,
release its lease only after the owning task is finished and the worktree is clean:

```powershell
npm run workspace:release -- --confirm
```

This removes only the lease. It never deletes a branch or worktree. Remove registry entries whose
worktrees were already removed by Codex with:

```powershell
node scripts/codex/workspace.mjs prune --confirm
```

## Existing mixed primary checkout

The checkout that existed before this system may still contain several workstreams. Freeze its
project state while allowing read-only coordination:

- do not perform project mutations there;
- do not stash, broadly stage, or switch branches to make it look clean;
- inventory ownership by path;
- rescue and verify one workstream at a time into a dedicated worktree/branch; and
- integrate only after every rescued branch has an explicit handoff.

The isolation hook prevents new contamination; it does not guess ownership of changes that were
already mixed together.
