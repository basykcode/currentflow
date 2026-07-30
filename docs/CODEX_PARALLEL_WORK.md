# Isolated Codex work for Current Flow

Current Flow uses one Codex chat per linked Git worktree, branch, lease, and runtime namespace. A
branch alone is not isolation: every chat pointed at the same checkout still shares its files,
index, checked-out `HEAD`, build outputs, and untracked data.

The repository's primary checkout is therefore coordination-only. All implementation, review, and
integration work happens in a Codex-managed worktree.

## One-time activation

After this system is integrated into the branch used to start new work:

1. Open the Current Flow project in the Codex desktop app.
2. Review and trust [`.codex/hooks.json`](../.codex/hooks.json) when Codex prompts. In the CLI,
   `/hooks` shows the pending project hook.
3. Keep the primary checkout free of implementation work. It can remain available for human Git
   inspection, but Codex sessions started as **Local** are stopped by the project hook.

The hook and this document must exist on the branch selected as a new worktree's starting point. Use
`master` after the isolation change is integrated; a historical branch that predates the change
cannot enforce it.

## Start every coding chat

1. Create a new **Codex** chat from the Current Flow project.
2. Select **Worktree** under the composer, not Local or a permanent worktree shared by other chats.
3. Select a clean `master` as the starting branch. Do not select the option that carries Local
   unstaged changes into the worktree.
4. Submit the task. On startup, the hook:
   - rejects the primary checkout;
   - rejects a dirty worktree that has no owner;
   - creates `codex/chat-<session-id>` when Codex supplied a detached worktree;
   - records an exclusive chat/worktree/branch lease in the repository's local Git metadata; and
   - assigns a unique Vite, API, Neo4j, and Docker Compose namespace.
5. Install dependencies in that worktree if needed with `npm ci`.
6. Run `npm run workspace:doctor`. Do not edit until it reports `Workspace isolation: OK`.

Never use **Hand off to Local** for an implementation chat. Resume the existing chat so Codex returns
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

For a deliberately permanent worktree, release its lease only after the owning chat is finished and
the worktree is clean:

```powershell
npm run workspace:release -- --confirm
```

This removes only the lease. It never deletes a branch or worktree. Remove registry entries whose
worktrees were already removed by Codex with:

```powershell
node scripts/codex/workspace.mjs prune --confirm
```

## Existing mixed primary checkout

The checkout that existed before this system may still contain several workstreams. Freeze it:

- do not start new work there;
- do not stash, broadly stage, or switch branches to make it look clean;
- inventory ownership by path;
- rescue and verify one workstream at a time into a dedicated worktree/branch; and
- integrate only after every rescued branch has an explicit handoff.

The isolation hook prevents new contamination; it does not guess ownership of changes that were
already mixed together.
