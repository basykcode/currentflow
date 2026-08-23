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

## Hexagram commentary rules

- Keep raw and normalized commentary evidence local-only; never import it into the SPA or commit it.
- Use the canonical school IDs and identity registries; do not create parallel hexagram or Gene Key tables.
- Every synthesis sentence must map to eligible source chunks and remain quotation-free.
- Treat automated commentary as `draft-only`; `qa-passed` is not human editorial approval.
- Use explicit unavailable records when evidence is missing or quarantined; never infer replacement text.
- Run `npm run commentary:validate` after changing commentary data, loaders, or rendering.

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

- The primary checkout (where `.git` is a directory) is a strictly read-only coordinator. Codex may
  inspect it and use app-level task-management tools, but must not create, edit, delete, move,
  install, build, test, generate, or otherwise mutate project files, Git state, or project runtimes
  there.
- When the current user request requires implementation or any other project mutation and the task
  is in the primary checkout, dispatch it automatically. Use the Codex app's `list_projects`
  capability to resolve the saved Current Flow Git project, then use its `create_thread` capability with
  `target.type=project`, `environment.type=worktree`, and `startingState.type=branch` with
  `branchName=master`. Never use the primary working tree as the starting state.
- Forward the user's full current request to the created task, together with the necessary Current
  Flow context: this is an automatically dispatched worker based on clean `master`, it must obey
  this `AGENTS.md`, claim its SessionStart lease, and run `npm run workspace:doctor` before tracked
  changes. Do not ask the user to restate, copy, or paste the request. Do not tell them to find a
  Worktree composer control, and do not require Create Permanent Worktree for ordinary tasks.
- After task creation succeeds, return the app's created-task UI directive using the actual result:
  `::created-thread{threadId="..."}` when a ready task returns `threadId`, or
  `::created-thread{clientThreadId="..."}` while managed-worktree setup returns `clientThreadId`.
  Do not invent either identifier.
- A task already running in its own leased, app-managed linked worktree is the worker. It proceeds
  normally and must not dispatch another worker merely because the request involves implementation.
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
