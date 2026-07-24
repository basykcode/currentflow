# Handoff: Verify the live Render and Aura backend

- UTC timestamp: 2026-07-24T23:58:43Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `761553dafaecaff911ebfa4ec4623b02077f23b2`
- Task/objective: Verify what Render's live status means, establish which public surfaces work, and
  identify what remains before the Cloudflare Pages frontend uses the hosted API.
- Status: complete

## Starting context

The user corrected `NEO4J_DATABASE` in Render and reported that the service was live. The custom
`api.current-flow.net` action had previously been canceled after the first failed deployment, and the
production Cloudflare Pages connection state was unknown.

## Work completed

- Verified the public Render service responds at
  `https://current-flow-alchemy-api.onrender.com`.
- Verified liveness and dependency-aware readiness both return HTTP 200.
- Verified metadata reports API `v1`, application `0.1.0`, graph schema `alchemy-graph-v1`, and one
  active data source.
- Verified an actual herb query returns three explicitly synthetic records with provenance and
  conflict status.
- Verified all four GitHub checks for the Aura database-name correction completed successfully.
- Verified `api.current-flow.net` does not yet resolve in public DNS.
- Inspected the live Cloudflare Pages JavaScript assets and found neither the custom API domain nor
  Render domain, confirming that the live frontend remains in demo mode.

## Files or components changed

- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/handoffs/20260724T235843Z--master--verify-live-render-backend.md`

## Decisions made

- None.

## Important rationale

Render's **Live** state now has concrete evidence behind it: the container is serving HTTPS, the
FastAPI lifespan connected to Aura, migrations and the synthetic seed succeeded, and the readiness
route can query Neo4j. It does not automatically connect Cloudflare Pages. DNS and frontend build
variables are independent remaining boundaries.

## Verification commands and results

- `curl.exe .../api/v1/health/live` — HTTP 200.
- `curl.exe .../api/v1/health/ready` — HTTP 200 with Neo4j `ready`.
- `curl.exe .../api/v1/meta` — HTTP 200 with one active source and expected feature flags.
- `curl.exe ".../api/v1/herbs?offset=0&limit=5"` — HTTP 200 with three synthetic, sourced records.
- `Resolve-DnsName api.current-flow.net` and HTTPS probe — the hostname does not resolve.
- Recursive inspection of 34 JavaScript assets from `https://current-flow.net/alchemy` — no custom
  or Render API hostname was bundled.
- GitHub check-runs API for `761553d` — Cloudflare Pages build, backend quality, Docker image, and
  real-Neo4j integration all completed successfully.

## Failed or rejected approaches worth remembering

- Do not interpret Render **Live** as meaning the Cloudflare Pages frontend is already connected.
  These are separate deployable boundaries.

## Known risks and assumptions

- The current API URL is Render's provider hostname. The intended stable public contract remains
  `https://api.current-flow.net`.
- The frontend remains in deterministic demo mode until the Pages production build receives the
  documented Vite variables and is redeployed.
- Render Free and AuraDB Free inactivity limitations remain.

## Unresolved issues

- Add or restore `api.current-flow.net` as a Render custom domain.
- Add the DNS-only Cloudflare CNAME, verify Render TLS, and optionally enable Cloudflare proxying.
- Set the three Cloudflare Pages production Vite variables and redeploy `master`.
- Run custom-domain and connected-frontend smoke tests.

## Uncommitted or unmerged state

This verification handoff and canonical state update are the only new task changes. The older
untracked `20260724T220539Z--master--resume-cross-device-workspace.md` remains untouched.

## Exact next recommended action

In Render, confirm `api.current-flow.net` is listed under the service's custom domains; then add a
DNS-only Cloudflare CNAME named `api` targeting
`current-flow-alchemy-api.onrender.com`.

## Relevant files, commits, issues, or external references

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [Render readiness endpoint](https://current-flow-alchemy-api.onrender.com/api/v1/health/ready)
- [Render API documentation](https://current-flow-alchemy-api.onrender.com/api/v1/docs)
- Backend correction commit: `761553dafaecaff911ebfa4ec4623b02077f23b2`
