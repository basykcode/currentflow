# Handoff: Connect the production Alchemy frontend

- UTC timestamp: 2026-07-25T23:39:21Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `a62e039564304ea55f0100c7251e24095b2d0e6b`
- Task/objective: Move the live Cloudflare Pages frontend out of fixture-provider mode and connect it
  to the completed Render API and AuraDB setup without opening the Cloudflare dashboard.
- Status: complete

## Starting context

The local `master` branch matched `origin/master`. The prior task had already verified Aura,
Render, the custom API hostname, TLS, readiness, seeded data, and production CORS, but its
`PROJECT_STATE.md` update and custom-domain handoff were still uncommitted after the ChatGPT crash.
The older untracked cross-device-resume handoff also predated this task and remained untouched.

The live Pages bundle did not contain the custom API or Render hostname and still selected the
deterministic demo provider.

## Work completed

- Reverified that the custom API reports ready with Neo4j ready, one active data source, three
  synthetic herb records, and the exact production browser origin allowed by CORS.
- Added checked-in, non-secret Vite production configuration that selects API mode, uses
  `https://api.current-flow.net`, and allows 90 seconds for a Render Free cold start.
- Kept local development in explicit network-free demo mode and kept Aura/Render credentials out of
  the frontend build.
- Updated deployment and project documentation to make the repository the default source for public
  production configuration while retaining Cloudflare environment variables as optional overrides.
- Published feature commit `3a44820118be79a8feb0ab51106a2fc3e011fadb` to `origin/master`.
- Monitored `Workers Builds: currentflow` to successful completion.
- Verified the live Pages asset changed to `index-BACekfP1.js` and contains API mode, the custom API
  URL, and the 90-second timeout with no Neo4j connection or credential markers.

## Files or components changed

- `.env.production`
- `README.md`
- `docs/DEPLOYMENT.md`
- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/handoffs/20260725T233921Z--master--connect-production-alchemy-frontend.md`

## Decisions made

None. Checking in these three public Vite values implements the accepted Render/Aura hosting
decision and avoids a dashboard-only release dependency; it does not expose backend secrets or
change the integration architecture.

## Important rationale

Vite production values are shipped to every browser and are not secrets. Keeping the public mode,
hostname, and timeout in `.env.production` makes a normal `master` build reproducible and removes
the need to access Cloudflare Pages for this release. Cloudflare production variables may still
override the defaults for an operational change.

## Verification commands and results

- `npm.cmd run check` with Node 22.18.0 — passed strict Vue/TypeScript checking, zero-warning ESLint,
  all 66 Vitest tests, and the production Vite build.
- Production `dist` inspection — confirmed the bundle selects `"api"`, includes
  `https://api.current-flow.net`, compiles the timeout to `9e4`, and contains no Neo4j URI or
  credential variable markers.
- `git push origin master` — published feature commit `3a44820`.
- GitHub check-run inspection — `Workers Builds: currentflow` completed with `success`.
- Direct HTTPS smoke requests — readiness reported the API and Neo4j ready, metadata reported one
  active source, the herb endpoint reported three records, and CORS allowed
  `https://current-flow.net`.
- Cache-busted live asset inspection — `https://current-flow.net/alchemy` served a bundle with the
  connected production configuration and no backend credential markers.

## Failed or rejected approaches worth remembering

- PowerShell `Invoke-WebRequest` threw a local null-reference error before making the initial smoke
  request. `curl.exe` completed the same read-only HTTPS verification successfully.
- Cloudflare dashboard access was unnecessary and deliberately not attempted.

## Known risks and assumptions

- The provider is now connected to the remote graph, but the currently seeded knowledge records are
  still explicitly synthetic demo data and remain labeled as such.
- Render Free can cold-start, and AuraDB Free can pause or be deleted after the documented inactivity
  periods.
- The public alpha API still has no authentication or abuse control and must remain limited to
  non-personal research data.

## Unresolved issues

- No reviewed production Alchemy corpus has been imported yet.
- Authentication, abuse controls, monitoring, backups, and paid uptime remain future
  production-grade gates.

## Uncommitted or unmerged state

At handoff creation, feature commit `3a44820` was published. This handoff, the prior custom-domain
handoff, and the reconciled project-state update awaited the final documentation commit. The older
untracked `20260724T220539Z--master--resume-cross-device-workspace.md` remained untouched.

## Exact next recommended action

Obtain domain review for the first rights-approved Alchemy source corpus before importing it into
Aura and disabling the synthetic startup seed.

## Relevant files, commits, issues, or external references

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../PROJECT_STATE.md`](../PROJECT_STATE.md)
- [`20260725T232011Z--master--verify-alchemy-custom-domain.md`](20260725T232011Z--master--verify-alchemy-custom-domain.md)
- [Host the alpha Alchemy API on Render and its graph on AuraDB](../decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md)
- Production feature commit: `3a44820118be79a8feb0ab51106a2fc3e011fadb`
