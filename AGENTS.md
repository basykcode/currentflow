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

## Production foundation rules

- `config/toolchain.json` is the canonical toolchain manifest. Automation uses `npm ci`; direct
  dependency and runtime changes require synchronized exact pins and reviewed lockfiles.
- `master` is the production branch. Keep frontend, backend, container, Render, and Cloudflare
  release configuration aligned to it.
- Migrations, foundation reconciliation, ingestion, and projection rebuilds never run in ordinary
  web startup. API processes remain disposable and stateless.
- Every API route has an explicit public/private/health/admin cache class. Private, authenticated,
  cookie-bearing, and error responses are never edge-cached.
- Neo4j queries use stable operation names, parameters, deterministic ordering, timeouts, and
  bounded result counts. Review the aggregate connection budget before adding workers or instances.
- Load-test and capacity claims name the dataset, commit, topology, workload, and observed provider
  metrics. DAU alone is not evidence of capacity.

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

## Chū–Zhèng–Kè temporal rules

- Derive Chū, Zhèng, and Kè only from the authoritative normalized Shíchen coordinate; never mix
  local-civil, local-mean-solar, apparent-solar, or raw browser time fields.
- Macro Hour modifies maturity, not Organ/Branch/pillar/Hour Hexagram identity or supported effort.
- Micro Hour is observational in v1 and never enters guidance evidence, identity, or validity.
- Refresh guidance at Macro and Shíchen boundaries, not every Kè.
- Keep the timeline free of percentages, countdowns, elapsed/remaining minutes, and seconds; respect
  reduced motion without removing textual or structural state.

## Current Flow glance rules

- Mobile home communicates the complete Current at a glance; Day remains the featured temporal
  hexagram in the Year / Day / Month hierarchy.
- Compact cards project existing snapshot data and never own calculation, mapping, timezone, or
  organ-clock logic.
- Keep exact bounds, engine versions, and technical provenance in an accessible details surface,
  not inside first-glance cards.
- Use dynamic viewport units and safe-area insets for the mobile instrument panel. Never clip
  content, disable global scrolling, or reduce accessible targets to fake first-viewport fit.
- Preserve natural scrolling for large text, visible focus, reduced motion, and both themes.

## Celestial Current instrument rules

- Consume one authoritative Global Conditions snapshot; never calculate or imitate astronomy in Vue.
- Show Chinese informational labels as characters, tone-marked Pinyin, and English. Dense ring symbols
  may remain Chinese-only only when the active state is decoded beside the ring.
- Keep percentages, degrees, countdowns, and numerical progress out of the celestial instrument
  values. The central clock may show anchored `HH:mm:ss` with its reviewed four-second cadence.
- Reuse `CurrentTaijiMark`, `MoonPhaseGlyph`, and shared ring geometry; do not create parallel symbols.
- Keep rings static, separate marker position from Taiji self-rotation, respect reduced motion, and
  preserve the accessible first-viewport glance layout.

## Guidance output rules

- Keep `src/domain/guidance` downstream of resolved semantic input; never infer guidance directly
  from raw dates, GanZhi, organ periods, hexagram numbers, Vue state, or freeform model output.
- OLTR, Intention, and Execution must consume the same versioned `GuidanceSynthesis` and pass their
  validators plus `validateGuidanceBundle()` before display.
- Use only the controlled intention lexicon and low-risk action library. Preserve qualitative effort,
  categorical evidence weight, explicit provenance, safety exclusions, and deterministic fallbacks.
- Changing intention may reselect Execution only. It must not change the temporal field, Primary
  Current, OLTR, evidence, versions, or validity window.
- Keep classical identity/commentary separate from `semantic-resolver` operational profiles. Current
  vectors are product formalizations, never claims that the received Yi Jing assigns an action.
- Require an eligible day profile; preserve partial lesser-scale coverage, missing profile numbers,
  and conflicts rather than deriving replacements from titles, commentaries, or a model.
- Treat `spec-reviewed` as product-specification review, not human editorial approval. Never add a
  reviewer identity that did not perform the review.
- Demo semantics remain visibly demo-labeled Current formalizations.

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

### Codex execution and isolation

The project supports two explicit worker boundaries. Run `npm run codex:doctor` before tracked
changes in either boundary. The `SessionStart` hook selects the boundary and must not be disabled or
bypassed.

#### Local Codex desktop

- The primary checkout (where `.git` is a directory) is a strictly read-only coordinator. Codex may
  inspect it and use app-level task-management tools, but must not create, edit, delete, move,
  install, build, test, generate, or otherwise mutate project files, Git state, or project runtimes
  there.
- When an implementation request starts in the primary checkout, dispatch it automatically. Resolve
  the saved Current Flow Git project with the app's `list_projects` capability, then use
  `create_thread` with `target.type=project`, `environment.type=worktree`, and
  `startingState.type=branch`, `branchName=master`. Never use the primary working tree as starting
  state.
- Forward the user's complete request and repository constraints. Do not ask the user to restate it,
  send them to a Worktree control, or require a permanent worktree. Return the actual created-task UI
  directive after dispatch.
- A task already running in its own leased app-managed linked worktree is the worker. One task owns
  one linked worktree, branch, lease, and runtime namespace. Never reuse or switch its worktree.
- Local workers use `npm run workspace:dev` and `npm run workspace:alchemy -- <action>` for isolated
  ports, containers, volumes, migrations, and seed operations. `npm run workspace:doctor` remains a
  compatible local alias for the universal doctor.

#### Codex Cloud

- The configured Cloud environment must set the non-secret variable
  `CURRENT_FLOW_CODEX_EXECUTION=cloud`. Missing mode retains the fail-safe local behavior; any unknown
  value stops startup.
- A recognized Cloud task is already an isolated worker. It must not dispatch to desktop, consult or
  create the local lease registry, switch branches, or import a local working-tree snapshot.
- Start ordinary Cloud tasks from the latest GitHub `master`. Use one scoped task, one short-lived
  `codex/*` branch, and one protected pull request. Multiple Cloud tasks may work concurrently in
  Astrology, Alchemy, Intelligence, Finance, Other Tools, or Miscellaneous workstreams.
- Treat those workstream names as routing labels, not long-lived mutable branches. Dependent work
  either starts from an explicitly named prerequisite branch or waits for that pull request to merge.
- Never place `.env` files, credentials, raw commentary, internal Yijing packets, local transition
  evidence, Alchemy raw data, or private runtime state in Codex Cloud or GitHub. The checked Cloud
  boundary is mandatory. The separately approved password-protected Cloudflare KV Prompt Lab is a
  production data boundary, not permission to expose its sources to Codex Cloud.
- Cloud workers use repository checks and GitHub Actions for shared service verification. They do not
  require Aura, Render, Cloudflare, or production credentials for ordinary implementation.

#### Convergence and release

- Do not use `git stash` as task state or broad staging. Each task owns only its isolated checkout,
  branch, unique handoff, and scoped changes.
- Protected `master` is the sole release authority. A dedicated Master / Integration task serializes
  reconciliation, updates stale branches from `master`, resolves conflicts without dropping either
  workstream, and confirms required checks before an authorized merge.
- Feature tasks never edit `docs/continuity/PROJECT_STATE.md`. Only an explicitly authorized
  integration task reconciles that shared summary and production activation state.
- A merge to `master`, production deployment, provider configuration change, or bypass of branch
  protections requires explicit authorization for that action. A request to implement or open a pull
  request does not imply publication.

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
