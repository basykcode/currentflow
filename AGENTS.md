# Current engineering rules

- Keep TypeScript in strict mode; do not use `any` unless unavoidable and documented.
- Never fabricate traditional calculations or source data.
- Keep domain calculations independent from presentation.
- Every displayed datum carries a provenance or availability status.
- Keep components focused; avoid giant `App.vue` or route components.
- Make no hidden network calls and store no secrets in source.
- Run `npm run check` before claiming completion.
- Update documentation when architecture or integration boundaries change.
- Preserve accessibility, responsive behavior, and the product principles in `docs/PRODUCT_PRINCIPLES.md`.

## Yijing transformation rules

- Store and calculate hexagram lines bottom-to-top; resolve every target through the canonical
  registry under `src/domain/astrology`.
- Keep transformation definitions, pure calculations, provenance, and presentation separate. Mark
  Current compositions as Current formalizations and results without reviewed interpretation as
  structural-only.
- Source-gate lineage tables and directed Yilin transitions. Never infer missing mappings, attach
  transition text to a static endpoint, or bundle raw commentary evidence into the SPA.
- Use the shared transformation result card and typed modal-navigation stack for every target.
  Self-mappings must not create history loops, and close must reset transient Lab state.
- Verify exact Hexagram 5 vectors, all 63 destinations, path pagination, source-table failures, and
  same-dialog Back restoration when changing this workbench.

## Project continuity protocol

This protocol is mandatory for every substantial Codex task. The repository is the durable project
record; chat history and local memory are supplemental.

### Start of work

1. Inspect the current branch, HEAD, upstream, and working-tree status; record pre-existing changes.
2. Read applicable `AGENTS.md` files, `docs/continuity/PROJECT_STATE.md`, relevant accepted decisions,
   the newest relevant branch/workstream handoff, and linked project documents.
3. Inspect task-relevant Git history and reconcile the documentation with code, configuration, tests,
   and migrations before acting. Do not assume a newer handoff overrides contradictory evidence.
4. Identify the objective, constraints, branch context, and verification requirements. For substantial
   work, briefly state the reconstructed context before editing.

Authority, from intent to implementation:

- The user's current explicit instruction controls the current task.
- Accepted decisions describe intended direction unless explicitly superseded.
- Code, configuration, migrations, and tests describe implemented behavior.
- `PROJECT_STATE.md` is a concise summary and may be stale.
- Handoffs are historical reports; legacy chat transcripts are background evidence only.
- Investigate and record conflicts instead of silently choosing a convenient source.

### During work

- Keep changes scoped and preserve unrelated user or agent changes.
- Add a decision record for consequential, difficult-to-reverse choices involving architecture, data
  or storage, public contracts, security or privacy, dependencies, deployment, product behavior,
  significant UX conventions, performance, or reliability. Do not record trivial details.
- Record rejected or failed approaches only when doing so prevents costly repetition.
- Update documentation with the behavior it describes. Never store secrets, credentials, personal
  data, confidential values, or raw environment values in continuity files.

### Parallel work

- Use independent branches or worktrees for independent tasks.
- Create a unique handoff per task; never append to, edit, or delete another task's handoff.
- Use `YYYYMMDDTHHMMSSZ--<sanitized-branch>--<task-slug>.md` for handoffs and
  `YYYYMMDDTHHMMSSZ--<decision-slug>.md` for decisions.
- Subagents return findings to the parent. The parent consolidates shared state; subagents must not
  concurrently rewrite `PROJECT_STATE.md` without exclusive ownership.
- Feature-branch work remains labeled unmerged in its handoff. Integration work reconciles it into
  canonical project state.
- Never push, merge, rebase, switch branches, delete branches, or delete worktrees without explicit
  authorization in the current task.

### Codex chat isolation

- The primary checkout (where `.git` is a directory) is coordination-only. Do not make tracked or
  untracked project changes there. Start implementation chats with the Codex desktop app's
  **Worktree** option from a clean integration branch.
- One chat owns one linked worktree and one branch. Never reuse a worktree for another active chat,
  hand implementation work back to Local, or switch the worktree's branch.
- The project `SessionStart` hook is an isolation boundary. Do not disable or bypass it. It assigns
  detached Codex worktrees a `codex/chat-<session>` branch, rejects dirty unclaimed worktrees, and
  rejects worktrees leased to another chat.
- Run `npm run workspace:doctor` before tracked changes. Use `npm run workspace:dev` and
  `npm run workspace:alchemy -- <action>` so concurrent chats receive isolated ports, containers,
  volumes, migrations, and seed operations.
- Do not use `git stash` as chat state and do not use broad staging. A feature chat owns only its
  branch, worktree, unique handoff, and task-scoped files.
- Feature chats do not edit `docs/continuity/PROJECT_STATE.md`; only an explicitly authorized
  integration task reconciles that shared summary.

### Completion

A handoff is required when a session changes tracked files, makes a material decision, completes or
partially completes development work, discovers a significant problem, or leaves work unfinished.

Before completion:

1. Run appropriate tests, lint, type checks, builds, or other verification and record exact commands
   and truthful results.
2. Create the unique handoff and any warranted decision records.
3. Update `PROJECT_STATE.md` only when summarized facts genuinely changed.
4. Do not claim completion when required verification failed or was not run.
5. Inspect the final diff and working-tree status.
6. Include continuity files with related code when committing is authorized.
7. Report unresolved work and the exact next useful action.
