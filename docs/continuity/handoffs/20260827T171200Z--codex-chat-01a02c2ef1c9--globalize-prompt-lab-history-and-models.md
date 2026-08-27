# Handoff: Globalize Prompt Lab history and model choices

- UTC timestamp: 2026-08-27T17:12:00Z
- Branch/worktree: `codex/chat-01a02c2ef1c9` / app-managed linked worktree
- Starting production commit: `859fac9`
- Status: implementation complete and verified; OpenAI secret and protected publication pending

## Objective

Replace device-only Prompt Lab history with one global archive, add shared collaborator names with a
remembered browser selection, attribute every experiment, add Llama/OpenAI model selection, and
publish the result to production `master`.

## Work completed

- Added a private Workers KV state boundary under `state/v1/` with independent keys for every
  generated experiment and every added collaborator.
- Added built-in Ben Kind and Anthony Love identities plus a password-authorized shared-user route.
- Added a complete authenticated workspace route that returns global users and history from any
  browser.
- Reduced browser-local storage to the chosen user and model IDs; added shared history refresh,
  attribution/model display, JSON export, and full settings restoration.
- Added model choices for the existing Cloudflare Llama model and OpenAI GPT-5.6 Sol, Terra, and Luna.
  OpenAI calls use the Responses API, strict structured output, `store: false`, and the same
  source-overlap/editorial controls as Workers AI.
- Bound `PROMPT_LAB_STATE` to the existing private Gene Keys namespace under a disjoint key prefix,
  avoiding a new public service or storage product.
- Updated architecture, deployment, rights, and decision documentation.

## Verification

- Synchronized toolchain declarations: passed.
- Strict Vue/TypeScript project build: passed.
- ESLint with zero warnings: passed.
- Vitest: 51 files and 403 tests passed.
- Workspace isolation: 11 tests passed.
- API gateway: 6 tests passed.
- Commentary validation: 64 bundles, 379 summaries, 5 unavailable, 0 needs-revision.
- Forest validation: 64 bundles and 384 draft-only transitions passed.
- Vite production build: 481 modules transformed.
- Literal `npm run check` could not launch because the desktop runtime has no `npm` binary. Every
  constituent command was run through the bundled `pnpm`/Node runtime and passed.

## Pending production step

The deployed Worker has no existing `OPENAI_API_KEY` secret, and no OpenAI credential exists in the
repository or local environment. Add the project's OpenAI API key as an encrypted
`OPENAI_API_KEY` secret on `current-flow-api-gateway`; do not place the value in Git, chat, logs, or
continuity files. Then publish this branch through the protected pull-request flow and smoke-test one
Llama and one OpenAI generation plus cross-browser history restoration.
