# Handoff: Build the Gene Keys Prompt Lab

- UTC timestamp: 2026-08-26T22:34:17Z
- Branch/worktree: `codex/chat-01a02c2ef1c9` / app-managed linked worktree
- Starting commit: `ddb58c291f9c97d2fa66f5e26c986bd02bd39b6a`
- Status: implementation and current-master reconciliation complete; production bindings and
  protected publication pending

## Objective

Build a password-protected Current Flow language-synthesis workbench under Other Tools. The tool must
let an experimenter choose Gene Key 1–64, include either, both, or neither of the two supplied
Richard Rudd sources, edit a large prompt, generate an OLTR plus synthesized commentary, and restore
every saved experiment with its complete settings.

## Work completed

- Extended the canonical Gene Keys registry with all 64 chapter titles taken from the explicit
  chapter headings in the supplied _Gene Keys_ EPUB. No parallel key/title table was introduced.
- Added the `/tools/gene-keys-prompt-lab` lazy route and Other Tools menu entry.
- Built a responsive password gate, key and source controls, prompt composer, draft output surface,
  and a versioned device-local history capped at 200 complete experiments with JSON export.
- Added login, session, logout, and generation routes to the existing Cloudflare API gateway Worker.
  The shared password and an independent HMAC signing secret are server-only bindings; the session
  cookie is HttpOnly, Secure, SameSite=Strict, and expires after 12 hours.
- Added a private Workers KV source boundary and Workers AI generation adapter. The browser sends
  only source IDs and never receives source passages.
- Applied the existing OLTR/commentary rubric as the system contract, retained every result as
  `draft-only`, and added an exact eight-word overlap check with one originality retry.
- Added a direct, credential-driven KV uploader for the ignored 128 source files plus a network-free
  completeness/integrity mode.
- Updated architecture, deployment, rights, crawler, and decision documentation. Canonical
  `PROJECT_STATE.md` was not edited by this feature task.

## Security and rights boundary

- The supplied password, session secret, Cloudflare credentials, namespace identifier, and raw
  source text are absent from Git and the Vite bundle.
- Source chapters remain ignored locally and may be copied only into a private KV namespace by an
  explicit operator command.
- Cloudflare processes the selected source chapter during generation. This private processing use
  does not change source redistribution rights or tracked commentary publication eligibility.
- Experiment history contains settings, prompt, generated prose, engine metadata, and warnings only.
  There is no server-side history database.
- The shared-password design is for an internal workspace, not per-user identity or authorization.

## Verification

- Strict Vue/TypeScript build: passed.
- ESLint with zero warnings: passed.
- Vitest: 30 files, 128 tests passed, including Prompt Lab session, overlap, source-selection,
  generation-response, local history, full restore, canonical title, and navigation coverage.
- Workspace isolation: 11 tests passed.
- Commentary validation: 64 bundles, 379 summaries, 5 unavailable, 0 needs-revision.
- Forest validation: 64 bundles and 384 draft-only transition summaries.
- Prompt Lab source verification: all 128 private chapters passed; combined upload-manifest SHA-256
  `6ff59f9720ee9addcc520bf49f1fd9bfc78651b6dcd473a5943ac2e8c36b8c97`.
- Python compilation: both EPUB preparation scripts passed.
- Vite production build: passed with 369 modules transformed and a lazy Prompt Lab route bundle.
- In-app browser QA: desktop and 390 px mobile gate/composer layouts passed; all 64 options were
  visible, one-source generation produced a draft, the saved entry restored fully, and browser logs
  contained no warnings or errors.
- The literal `npm run check` launcher was unavailable because this desktop runtime contains Node but
  no npm executable. Every command in that script was run directly through the bundled Node runtime
  with passing results.

## Current-master reconciliation

`master` advanced from this task's starting point to `a367578` with the complete Current Flow glance,
pinned Node/npm toolchain, and production Cloudflare gateway. The current production topology no
longer uses Pages Functions. The branch therefore merged `origin/master` and moved the Prompt Lab's
server routes into the existing `current-flow-api-gateway` Worker without changing its Render-bound
`/api/v1/*` behavior.

The reconciled tree passed synchronized toolchain checks, strict type checking, zero-warning lint,
51 Vitest files with 399 tests, 11 workspace tests, all six gateway tests, both corpus validators,
the 128-source dry run, and a 481-module production build.

## Production steps still required

1. Publish the reconciled branch through the protected `master` pull-request flow and confirm all
   required GitHub checks.
2. In the existing `current-flow-api-gateway` Worker, bind Workers AI as `AI`, bind a private KV
   namespace as `GENE_KEYS_SOURCES`, and set encrypted `PROMPT_LAB_PASSWORD` and
   `PROMPT_LAB_SESSION_SECRET` secrets for Production and Preview.
3. Run the authenticated source-publish command from this trusted worktree, then revoke its
   short-lived KV-edit token.
4. Add a Cloudflare rate-limiting rule for the login endpoint, deploy `master`, and smoke-test login,
   all four source-selection modes, generation, and history restoration at the production URL.

## Exact next useful action

Publish the reconciled branch through protected `master`, configure the four Cloudflare
bindings/secrets without exposing them to source or logs, upload the verified 128-chapter set, and
complete production smoke testing.

## Related files

- `src/features/gene-keys-prompt-lab/`
- `server/gene-keys-prompt-lab/`
- `workers/api-gateway/`
- `scripts/gene-keys-prompt-lab/publish-sources.mjs`
- `docs/continuity/decisions/20260826T222903Z--protect-gene-keys-prompt-lab-at-the-edge.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/HEXAGRAM_COMMENTARY_RIGHTS.md`
