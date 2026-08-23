# Decision: Automatically dispatch primary tasks to managed worktree workers

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: development operations and concurrent Codex work

## Context

Current Flow already isolates every implementation task with one linked worktree, branch lease, and
runtime namespace. Its primary-checkout `SessionStart` behavior stopped the task completely and its
operating guide required the user to start again through a manual Worktree composer flow. That made
the user repeat workflow instructions instead of entering the actual request once.

Official Codex documentation describes manual worktree selection and confirms that worktrees support
parallel independent tasks. The current app also exposes a project task-creation capability that can
target an app-managed Git worktree and a named starting branch. The repository can therefore use the
available app capability for dispatch without asking the user to navigate a particular UI.

## Constraints and requirements

- The primary checkout must remain free of project and Git mutations.
- The user enters each actual request once in a brand-new task in the saved Current Flow project.
- Every worker starts from committed `master`, not primary working-tree changes.
- Existing dirty-worktree, lease-owner, and branch-match protections remain fail-closed.
- Concurrent workers retain independent worktrees, branches, leases, ports, containers, and volumes.
- Ordinary work must not depend on a permanent worktree.

## Options considered

1. **Keep the primary hard stop and document a manual Worktree selection** — rejected because it
   makes the user recover from the stop, restate context, and manage repository workflow UI.
2. **Have the repository hook create raw Git worktrees itself** — rejected because the app owns task
   and managed-worktree lifecycle, while the hook owns only repository policy and worker leasing.
3. **Continue primary tasks as read-only coordinators and dispatch through app task creation** —
   accepted because the user asks once, the app creates the worker, and the existing hook still
   validates and leases the resulting worktree.

## Decision

`SessionStart` returns `continue=true` in the primary checkout and injects coordination-only context.
That context forbids project-file, Git, dependency, generated-output, build/test, and runtime
mutations while permitting read-only inspection and app-level task coordination.

Root `AGENTS.md` requires a primary coordinator receiving an implementation request to use the app's
`list_projects` and `create_thread` capabilities to resolve the saved Current Flow project and create
a new task with `environment.type=worktree`, based on the existing `master` branch. It forwards the
complete current user request and necessary repository constraints, then returns the created-task UI
directive. It does not ask the user to restate the request, locate a Worktree control, or create a
permanent worktree.

A task already running in an app-managed linked worktree is the worker and proceeds normally. Its
SessionStart lease, session branch, runtime namespace, doctor gate, and fail-closed ownership checks
remain mandatory.

## Rationale and supporting evidence

App-managed creation preserves task/worktree affinity and can start from committed `master` without
copying primary changes. Keeping worktree claiming in the existing hook preserves the tested local
lease boundary. Separating coordinator dispatch from worker execution also allows multiple user
requests to run concurrently without sharing files, Git indexes, ports, containers, or volumes.

## Consequences and tradeoffs

- A primary Codex task remains active, but only as a read-only coordinator.
- Implementation normally appears as a second, app-managed task without another user-authored prompt.
- Dispatch depends on the app task-creation capability; public documentation may continue to describe
  a manual UI flow without defining this repository-specific automation.
- Read-only requests can be completed in primary without allocating a worktree.
- Existing worker isolation costs, including per-worktree disk and dependency state, remain.

## Implementation or migration implications

- Change primary SessionStart output from a stop decision to coordination-only additional context.
- Make automatic app task creation and its exact worktree/master target mandatory in root policy.
- Update user-facing operating documentation and remove manual composer requirements.
- Retain the shared lease registry, branch assignment, runtime wrappers, and worker failure modes.

## Verification criteria

- Primary SessionStart returns `continue=true`, has no stop reason, and injects explicit read-only
  dispatch context without changing branch or files.
- Root policy specifies app-managed worktree creation from `master`, full-request forwarding, and the
  created-task UI directive.
- A dirty unclaimed linked worktree, a lease conflict, and a lease/branch mismatch still stop startup.
- A clean detached worker still receives a session branch, lease, and isolated runtime slot.
- Focused workspace tests and `npm run check` pass.

## Supersedes

[Isolate every Codex chat by worktree, lease, and runtime](20260730T020000Z--isolate-every-codex-chat-by-worktree-lease-and-runtime.md).
This decision retains that decision's worktree, lease, and runtime isolation while replacing its
primary hard stop and manual task-start flow.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../CODEX_PARALLEL_WORK.md`](../../CODEX_PARALLEL_WORK.md)
- [`../../../AGENTS.md`](../../../AGENTS.md)
- [`../../../scripts/codex/workspace-state.mjs`](../../../scripts/codex/workspace-state.mjs)
- [Official Codex worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees)
