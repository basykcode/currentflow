# Handoff: Correct the Aura database-name assumption

- UTC timestamp: 2026-07-24T23:51:38Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `7f35b2e76d883f39ed512e39194a1ef22bead764`
- Task/objective: Diagnose the first Render deploy failure, correct the Blueprint's Aura database
  configuration, verify the correction, and publish it.
- Status: complete

## Starting context

The first Render Blueprint sync created `current-flow-alchemy-api`, but deployment failed before the
custom domain action. Render logs reported `Neo.ClientError.Database.DatabaseNotFound` because the
service explicitly selected database `neo4j`, which does not exist in the user's new Aura instance.
The initial Blueprint correctly prompted for Aura URI, username, and password but hardcoded
`NEO4J_DATABASE=neo4j`.

## Work completed

- Confirmed from current Neo4j documentation that Aura's downloaded credential file includes a
  separate database name.
- Changed `render.yaml` so `NEO4J_DATABASE` is a required `sync: false` value instead of a hardcoded
  default.
- Updated the deployment runbook with the fifth Blueprint value and the manual Environment-page
  correction required for an already-created Render service.
- Added a dated factual correction to the hosting decision and recorded the invariant in canonical
  project state.
- Re-ran the complete frontend and backend gates plus Render's official Blueprint schema.
- Published the correction and this continuity record together on `master`.

## Files or components changed

- `render.yaml`
- `docs/DEPLOYMENT.md`
- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md`
- `docs/continuity/handoffs/20260724T235138Z--master--correct-aura-database-name.md`

## Decisions made

- No new architecture decision. A dated factual correction was added to the existing
  [Render/Aura hosting decision](../decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md).

## Important rationale

The username and database name are separate connection values. The backend intentionally selects a
database for efficient routing, so omitting or guessing this value is not safe. Aura is authoritative:
operators must use the database name in the credentials file downloaded when the instance was
created.

Render prompts for `sync: false` values only during initial Blueprint creation. Because this service
already exists, publishing the corrected Blueprint does not reliably populate the new variable; the
operator must edit `NEO4J_DATABASE` on the service's Environment page before redeploying.

## Verification commands and results

- `npm.cmd run check` — passed strict Vue/TypeScript checking, zero-warning ESLint, all 62 Vitest
  tests, and the production Vite build.
- `uv run alchemy check` — passed Ruff formatting/lint, strict mypy for 39 source files, 26 tests with
  the opt-in real-Neo4j test skipped, and the OpenAPI contract check.
- Render official JSON Schema validation — passed and additionally asserted that
  `NEO4J_DATABASE` is a `sync: false` prompt.
- `npx.cmd prettier --write ...` — all supported modified YAML and Markdown files were already
  formatted.

## Failed or rejected approaches worth remembering

- Do not set the Aura database name from the username and do not assume `neo4j`; use the exact
  **Database name** field from the downloaded Aura credential file.
- Retrying the existing Render deploy without changing `NEO4J_DATABASE` will repeat the same
  deterministic failure.

## Known risks and assumptions

- The actual Aura database name is credential-adjacent information and was not requested in chat.
- The existing failed Render service still has the old environment value until the user changes it.
- A new deployment must pass migration, seed, readiness, and custom-domain checks before the backend
  is live.

## Unresolved issues

- Set the exact Aura database name in Render and deploy the latest commit.
- Confirm migration, seed, readiness, and the custom-domain action succeed.
- Complete Cloudflare DNS and Pages API-mode configuration after Render is healthy.

## Uncommitted or unmerged state

The correction and this handoff are published on `master`. The older untracked
`20260724T220539Z--master--resume-cross-device-workspace.md` remains untouched.

## Exact next recommended action

In Render open `current-flow-alchemy-api` → **Environment**, edit `NEO4J_DATABASE`, paste the
**Database name** from the Aura credentials file, save, and deploy the latest `master`.

## Relevant files, commits, issues, or external references

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../../render.yaml`](../../../render.yaml)
- [Neo4j Aura instance credentials](https://neo4j.com/docs/aura/getting-started/connect-instance/#_instance_credentials)
- Failed deployment base commit: `81c6d4e00de7717522a6e083a6c513fc69abbe7d`
