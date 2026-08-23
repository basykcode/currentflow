# Project continuity

This directory is the durable project memory for humans and agents. It records verified state,
important decisions, and concise operational history. Raw chat history is not the canonical project
record, and secrets, credentials, personal data, private keys, tokens, or raw environment values must
never be stored here.

## Files and roles

- [`PROJECT_STATE.md`](PROJECT_STATE.md) is the short, regularly reconciled snapshot of the integrated
  project. It may lag the code and must be checked against the repository.
- [`decisions/`](decisions/) holds one consequential decision per immutable record: context, options,
  rationale, consequences, and verification criteria.
- [`handoffs/`](handoffs/) holds one concise operational report per task or session. Handoffs are
  historical evidence, not permanent rules.
- [`templates/`](templates/) defines the required fields for new decisions and handoffs.

## Source authority

The current user's explicit instruction controls the current task. Accepted decisions describe
intended direction unless superseded. Code, configuration, migrations, and tests describe implemented
behavior. Project state is a summary; handoffs and legacy transcripts are supporting evidence. When
sources disagree, investigate and record the conflict.

## Start a substantial task

1. Inspect branch, HEAD, upstream, and working-tree status.
2. Read applicable `AGENTS.md`, project state, relevant accepted decisions, the newest relevant
   handoff, and documents linked from project state.
3. Inspect relevant Git history and reconcile all claims with the repository.
4. Establish objective, constraints, branch/worktree context, and verification requirements before
   editing.

## Finish a substantial task

1. Run and record appropriate verification.
2. Add a unique handoff and any warranted decisions.
3. Update project state only when the integrated summary genuinely changed.
4. Inspect the diff and status; report unresolved work and the exact next action.

## Naming and parallel work

- Handoff: `YYYYMMDDTHHMMSSZ--<sanitized-branch>--<task-slug>.md`
- Decision: `YYYYMMDDTHHMMSSZ--<decision-slug>.md`

Independent tasks use independent branches or worktrees and independent handoff files. Parallel
workers never append to a shared log or concurrently rewrite project state without exclusive
ownership. Feature work remains labeled unmerged until integration reconciles it.

For Codex, a branch is not sufficient: every active worker uses its own linked worktree and lease.
Follow [`../CODEX_PARALLEL_WORK.md`](../CODEX_PARALLEL_WORK.md); a task in the read-only primary
checkout automatically dispatches implementation requests to app-managed worktree workers.

## Superseding decisions

Do not rewrite accepted rationale. Create a new decision record, mark the old record `superseded`,
link each record to the other, and update project state if the intended direction changes. Factual
corrections must be explicit and dated.
