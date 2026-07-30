# Decision: Isolate every Codex chat by worktree, lease, and runtime

- Status: accepted
- Date (UTC): 2026-07-30
- Scope: development operations and concurrent Codex work

## Context

Current Flow repeatedly ran concurrent Codex chats in one primary checkout. The chats used different
branch names but shared the same filesystem, index, checked-out `HEAD`, untracked files, generated
outputs, and fixed Docker Compose namespace. Historical handoffs record branch changes beneath active
work, cross-workstream staging, and unrelated files appearing during commits. The current primary
checkout again contains a dirty feature workstream.

Git branches isolate references and commits; only linked worktrees isolate working files and indexes.
Codex supports one managed worktree per chat, copies selected ignored inputs through
`.worktreeinclude`, and exposes project `SessionStart` hooks.

## Constraints and requirements

- Preserve every pre-existing workstream without guessing file ownership.
- Give each chat one authoritative checkout and branch.
- Reject imported or already-owned dirty state before edits begin.
- Keep protected commentary evidence and credentials local and isolated.
- Prevent Vite, API, Neo4j, Compose container, and volume collisions.
- Do not require a hosted coordination service or commit local session identifiers.
- Keep integration and `PROJECT_STATE.md` reconciliation serialized.

## Options considered

1. **Branches in one checkout** — rejected because branches do not isolate the working directory or
   index and have already failed repeatedly.
2. **Manual worktrees and conventions only** — insufficient because a permanent worktree can still
   be reused by two chats, detached work can remain unowned, and dirty Local changes can be copied
   into a new Codex worktree.
3. **Codex-managed worktrees plus a project lease hook and runtime wrappers** — accepted because it
   combines native chat/worktree affinity with fail-closed repository guardrails.

## Decision

Reserve the primary checkout for human coordination and disallow Codex work there. Start every task
in a Codex-managed worktree from a clean integration branch. A trusted project `SessionStart` hook
claims exactly one chat/worktree/branch tuple in local shared Git metadata, creates a session-derived
branch for detached managed worktrees, and blocks dirty or conflicting claims.

Copy only required ignored configuration and commentary evidence into each managed worktree by
value. Use lease-derived development ports and Compose project names. Serialize integration and
canonical project-state updates in their own worktree.

## Rationale and supporting evidence

The repository's handoffs show that changing branches within a shared checkout did not prevent
another chat from moving `HEAD`, adding files between status and staging, or mixing backend and
frontend work. Git worktrees provide distinct work files and indexes while Git itself prevents one
branch from being checked out by two worktrees. The local lease adds the missing one-chat-per-
worktree rule, and per-lease runtime configuration removes the fixed Compose and port namespace.

## Consequences and tradeoffs

- New chats must choose **Worktree** and trust the project hook once.
- A chat based on a branch that predates this change is not protected.
- Dependencies and uncopied generated data are recreated per worktree, using additional disk space.
- Local evidence listed in `.worktreeinclude` is copied into every managed worktree and does not sync
  afterward.
- Integration is deliberate and serialized instead of occurring through a mutable primary checkout.
- Existing mixed changes still require one-time manual rescue; the hook does not infer ownership.

## Implementation or migration implications

- Track `.codex/hooks.json`, `.worktreeinclude`, workspace scripts/tests, and the operating guide.
- Make Compose project name and host ports overridable while preserving direct-command defaults.
- Add the isolation protocol to `AGENTS.md` and the workspace tests to `npm run check`.
- After integration, freeze the current primary checkout and rescue its existing workstreams
  individually.

## Verification criteria

- A primary-checkout SessionStart returns a stop decision.
- A clean detached linked worktree receives a unique `codex/chat-*` branch and lease.
- An unclaimed dirty worktree and a worktree leased to another chat are rejected.
- The same chat can resume its dirty leased worktree.
- Two leases receive different frontend, API, Neo4j, Compose container, and volume namespaces.
- `npm run check` includes and passes the workspace guardrail tests.

## Supersedes

None. The earlier Alchemy-specific publication gate remains historical context; this decision adds
the repository-wide isolation mechanism it did not define.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../CODEX_PARALLEL_WORK.md`](../../CODEX_PARALLEL_WORK.md)
- [`../../../AGENTS.md`](../../../AGENTS.md)
- [`../../../scripts/codex/workspace.mjs`](../../../scripts/codex/workspace.mjs)
