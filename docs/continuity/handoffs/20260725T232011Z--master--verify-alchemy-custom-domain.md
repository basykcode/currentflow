# Handoff: Verify the Alchemy API custom domain

- UTC timestamp: 2026-07-25T23:20:11Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `a62e039564304ea55f0100c7251e24095b2d0e6b`
- Task/objective: Verify the completed Render custom-domain and certificate setup and identify the
  next deployment boundary.
- Status: complete

## Starting context

Render, AuraDB, and the provider hostname were already live. The user completed the
`api.current-flow.net` DNS and Render certificate setup and asked what remained.

## Work completed

- Verified public DNS resolves `api.current-flow.net` through the intended Render hostname.
- Verified the custom hostname serves HTTPS successfully.
- Verified liveness, dependency-aware readiness, and metadata return HTTP 200.
- Verified Neo4j reports ready and the API reports one active data source.
- Verified an herb request from the exact `https://current-flow.net` browser origin returns HTTP 200
  with `Access-Control-Allow-Origin: https://current-flow.net`.
- Verified the response contains the explicitly synthetic, provenance-carrying seed records.
- Inspected the JavaScript currently served by `https://current-flow.net/alchemy`; no custom API or
  Render hostname is bundled, so the production frontend remains in demo mode.

## Files or components changed

- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/handoffs/20260725T232011Z--master--verify-alchemy-custom-domain.md`

## Decisions made

None. This completes the DNS/TLS verification criterion of the accepted Render/Aura deployment
decision.

## Verification commands and results

- `Resolve-DnsName api.current-flow.net` — resolved through
  `current-flow-alchemy-api.onrender.com`.
- `Invoke-WebRequest https://api.current-flow.net/api/v1/health/live` — HTTP 200.
- `Invoke-WebRequest https://api.current-flow.net/api/v1/health/ready` — HTTP 200 with Neo4j ready.
- `Invoke-WebRequest https://api.current-flow.net/api/v1/meta` — HTTP 200 with one active source.
- Browser-origin herb request — HTTP 200 with the exact production CORS origin allowed.
- Live Pages asset scan — two JavaScript assets inspected; neither contains the API hostname.

## Known risks and assumptions

- Render Free can cold-start, so the documented frontend timeout remains 90 seconds.
- AuraDB Free inactivity rules remain.
- The public alpha API has no authentication or abuse control and must remain limited to
  non-personal research data.

## Unresolved issues

- Configure the three documented Cloudflare Pages production Vite variables.
- Redeploy `master`.
- Verify the live Alchemy provider reports connected and does not silently fall back to fixtures.

## Uncommitted or unmerged state

This handoff and the canonical project-state update are the only task changes. The older untracked
`20260724T220539Z--master--resume-cross-device-workspace.md` remains untouched.

## Exact next recommended action

Set the three production Vite variables documented in `docs/DEPLOYMENT.md` in Cloudflare Pages and
redeploy `master`.
