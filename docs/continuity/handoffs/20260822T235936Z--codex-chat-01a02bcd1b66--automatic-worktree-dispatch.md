# Handoff: Implement automatic worktree-worker dispatch

- UTC timestamp: 2026-08-22T23:59:36Z
- Branch/worktree: `codex/chat-01a02bcd1b66` /
  `/Users/benkind/.codex/worktrees/01d1/Current Flow Main`
- Starting commit: `b5426ca3e46a4af56237fc350b14cdb7bd9c02c6`
- Task/objective: Make every primary-checkout Current Flow implementation request automatically
  dispatch once to an app-managed worktree task based on clean `master`, while retaining strict
  worker isolation.
- Status: complete; feature commit authorized

## Starting context

The app supplied a clean detached linked worktree at `b5426ca`, which was also local and remote
`master`. There were no pre-existing tracked or untracked changes. The saved `basykcode/currentflow`
origin already used the required `github-basykcode` SSH alias.

The repository still implemented the superseded manual flow: primary SessionStart returned
`continue=false`; root policy and the operating guide required the user to select a Worktree control;
and tests asserted the primary hard stop. Worker branch, lease, contamination, and isolated-runtime
protections were already present.

The delegated worktree initially lacked a lease, so the first doctor attempt failed closed. The
repository's own SessionStart handler claimed the task as `codex/chat-01a02bcd1b66`, assigned runtime
slot 1, and the required pre-edit doctor then passed. No project file changed before that pass.

## Work completed

- Changed primary SessionStart evaluation from `block-primary` to `coordinate-primary` and return
  `continue=true` without a stop reason.
- Added a 661-character primary coordination context that forbids project, Git, dependency,
  build/test, generated-output, and runtime mutations while allowing read-only inspection and app
  task coordination.
- Made root policy require `list_projects` plus `create_thread` targeting the saved Current Flow
  project with `environment.type=worktree`, `startingState.type=branch`, and `branchName=master`.
- Required full-current-request forwarding, no user restatement or composer navigation, no ordinary
  permanent worktree, and the correct ready or pending created-task UI directive.
- Preserved normal behavior for tasks already running as leased app-managed worktree workers.
- Updated hook metadata, workspace command guidance, README, operating documentation, and continuity
  guidance for the automatic default flow.
- Added the accepted automatic-dispatch decision and marked the previous hard-stop/manual-flow
  decision superseded while explicitly retaining its worker lease and runtime isolation.
- Updated tests to verify primary continuation without branch, status, or lease-registry mutation;
  retained dirty-unclaimed and lease-conflict coverage; and added hook-level branch-mismatch coverage.
- Left `docs/continuity/PROJECT_STATE.md` unchanged, as required for this feature task.

## Files or components changed

- `.codex/hooks.json`
- `AGENTS.md`, `README.md`, `docs/CODEX_PARALLEL_WORK.md`
- `scripts/codex/workspace-core.mjs`, `scripts/codex/workspace-state.mjs`,
  `scripts/codex/workspace.mjs`, and workspace tests
- `docs/continuity/README.md`
- The superseded 2026-07-30 isolation decision and the new 2026-08-22 automatic-dispatch decision
- This handoff

## Decisions made

- Accepted
  [automatic primary-task dispatch](../decisions/20260822T235412Z--automatically-dispatch-primary-tasks-to-managed-worktrees.md),
  which supersedes the prior primary hard stop and manual start flow while retaining one-worker/
  one-worktree/one-lease/runtime isolation.

## Important rationale

Official Codex documentation confirms worktree isolation and documents a manual UI path. The current
app's available `create_thread` contract can directly target a managed worktree and named branch, so
repository policy uses that operational capability rather than asking the user to locate a control
that may not match the current interface. The hook remains responsible for local ownership and
contamination checks after the app creates the worker.

## Verification commands and results

- `npm run workspace:doctor` — passed before tracked changes on
  `codex/chat-01a02bcd1b66`, runtime slot 1, after the repository handler recovered the missing lease.
- `npm run workspace:test` — passed 11/11 focused workspace tests, including primary coordination,
  dirty-unclaimed rejection, lease conflict, and branch mismatch.
- `npm run check` — passed on Node 22.18.0 with npm 11.5.2: strict type-check, ESLint with zero
  warnings, 27 Vitest files / 122 application tests, 11 workspace tests, commentary and transition
  validation, and the production build.
- Focused Prettier write/check of all changed code, JSON, and Markdown — passed with no formatting
  changes required.

## Failed or rejected approaches worth remembering

- The first `npm run workspace:doctor` could not start because this app shell did not expose npm on
  its default path. A user-scoped Node 22.18.0/npm 11.5.2 runtime provided the project-pinned
  verification environment without a system install.
- The next doctor invocation correctly rejected the delegated worktree because the app task had no
  lease. Running the repository's existing SessionStart handler with the actual task ID repaired the
  expected lease; weakening or bypassing the lease check was rejected.
- Raw Git worktree creation from the repository hook was rejected because the app owns managed-task
  and worktree lifecycle; the repository hook owns policy, leasing, and fail-closed validation.

## Known risks and assumptions

- Project hooks must be trusted for SessionStart context to load. Root `AGENTS.md` independently
  carries the same mandatory coordinator behavior.
- The primary mutation prohibition is enforced by SessionStart context, root project policy, and
  workspace-command guards; it does not remount the primary filesystem read-only at the OS level.
- Automatic dispatch requires the Codex app's available project task-creation capability. Public
  documentation may continue to describe manual worktree selection separately.

## Unresolved issues

None within the requested feature scope. Canonical `PROJECT_STATE.md` reconciliation remains an
integration-task responsibility.

## Uncommitted or unmerged state

The scoped task changes and this handoff are prepared for the authorized feature commit on
`codex/chat-01a02bcd1b66`. The branch remains unmerged and unpushed. No branch switch, rebase, merge,
push, worktree deletion, or lease release was performed after the SessionStart claim.

## Exact next recommended action

Report the resulting feature commit to the coordinating task so it can integrate the commit into
`master` and reconcile `docs/continuity/PROJECT_STATE.md` without reusing this worker worktree.

## Relevant files, commits, issues, or external references

- Starting commit `b5426ca3e46a4af56237fc350b14cdb7bd9c02c6`
- [Automatic-dispatch operating guide](../../CODEX_PARALLEL_WORK.md)
- [Automatic-dispatch decision](../decisions/20260822T235412Z--automatically-dispatch-primary-tasks-to-managed-worktrees.md)
- [Official Codex worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees)
