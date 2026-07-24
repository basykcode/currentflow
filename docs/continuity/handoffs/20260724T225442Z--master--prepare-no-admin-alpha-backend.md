# Handoff: Prepare the no-admin alpha backend

- UTC timestamp: 2026-07-24T22:54:42Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `4280a16c8aeb55a2e55f0a944fce16f6d167d53f`
- Task/objective: Establish the maximum safe backend deployment preparation possible without
  administrator access, identify whether Cloudflare can host the complete stack, and define the
  minimal user-owned account boundary.
- Status: partial

## Starting context

`master` tracked `origin/master` at `4280a16`. One pre-existing untracked handoff,
`20260724T220539Z--master--resume-cross-device-workspace.md`, was present and was preserved without
modification. The frontend and integrated Alchemy code were published, but no backend host, database,
API DNS record, deployment workflow, or production frontend API configuration existed. This
workstation has no Docker-compatible runtime and the user explicitly prohibited workflows that
request administrator or local-network permissions.

Read-only DNS and HTTPS checks established that Cloudflare is authoritative for `current-flow.net`
and both the apex and `www` frontend return HTTP 200 through Cloudflare. `api.current-flow.net` did
not exist.

## Work completed

- Verified current Cloudflare, Render, and Aura capabilities and free-tier limitations against their
  official documentation.
- Selected an alpha-only Cloudflare Pages → Render Free Docker API → AuraDB Free topology.
- Added a schema-valid Render Blueprint that remotely builds the existing API image, waits for
  GitHub checks, prompts for database secrets, registers `api.current-flow.net`, and uses the
  dependency-aware readiness endpoint.
- Added a provider-neutral production start script that applies checksum-protected migrations,
  conditionally applies the idempotent synthetic seed, and binds to the host-provided port.
- Added the deploy script to the Docker image and made `render.yaml` changes trigger backend CI.
- Replaced the placeholder deployment notes with the exact Aura, Render, Cloudflare DNS, Pages
  environment, smoke-test, free-tier, and no-admin runbook.
- Recorded the accepted alpha hosting decision and the permanent no-admin workstation constraint in
  durable project continuity.
- Reconciled architecture and README claims with the live Cloudflare frontend and prepared hosted
  backend.

## Files or components changed

- `render.yaml`
- `services/alchemy-api/deploy/start.sh`
- `services/alchemy-api/Dockerfile`
- `.github/workflows/alchemy-api.yml`
- `docs/DEPLOYMENT.md`
- `docs/ALCHEMY_BACKEND.md`
- `docs/ARCHITECTURE.md`
- `docs/ALCHEMY_UI_DATA_MODEL.md`
- `README.md`
- `docs/continuity/PROJECT_STATE.md`
- `docs/continuity/decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md`
- `docs/continuity/handoffs/20260724T225442Z--master--prepare-no-admin-alpha-backend.md`

## Decisions made

- [Host the alpha Alchemy API on Render and its graph on AuraDB](../decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md)

## Important rationale

Cloudflare Pages Functions cannot run the implemented FastAPI Docker image. Cloudflare Containers
can run it but require the $5/month Workers Paid plan and have ephemeral disk, so they do not provide
free durable Neo4j hosting. Render can build the Dockerfile remotely without a local daemon, and
AuraDB preserves the implemented Neo4j contract without self-managed storage or firewall work.

The selected free tiers are explicitly alpha-grade: Render sleeps on idle, and AuraDB Free pauses
and eventually deletes a long-paused instance. The public API also has no authentication. These
tradeoffs are acceptable only while data remains synthetic/research-only and traffic is light.

## Verification commands and results

- `Resolve-DnsName current-flow.net -Type NS` — confirmed Cloudflare nameservers
  `gail.ns.cloudflare.com` and `giancarlo.ns.cloudflare.com`.
- `curl.exe -sS -I --max-time 15 https://current-flow.net` and the equivalent `www` request — both
  returned HTTP 200 through Cloudflare.
- `npm.cmd run check` — passed strict Vue/TypeScript checking, zero-warning ESLint, all 62 Vitest
  tests, and the production Vite build under Node 22.18.0.
- `uv run alchemy check` — passed Ruff formatting/lint, strict mypy for 39 files, 26 tests with the
  opt-in real-Neo4j integration test skipped, and the OpenAPI contract check.
- `uv run --with jsonschema --with pyyaml python -` against
  `https://render.com/schema/render.yaml.json` — `render.yaml` passed Render's official Blueprint
  JSON Schema.
- Production API-mode `npm.cmd run build` with the documented three Vite variables — passed, and the
  built assets contained `https://api.current-flow.net`.
- `npx.cmd prettier --write ...` — formatted all supported modified Markdown and YAML files.
- `git diff --check` — passed before this handoff.

## Failed or rejected approaches worth remembering

- Do not install Docker Desktop, WSL, Hyper-V, a Windows service, or a Cloudflare Tunnel on this
  workstation. Besides requiring unavailable administrator permissions, the laptop must not become a
  production origin.
- Do not attempt to store Neo4j on Cloudflare Container disk; Cloudflare documents that disk as
  ephemeral.
- Do not put Aura credentials in Cloudflare Pages variables. Vite variables are public browser
  configuration.
- The PowerShell `npm.ps1` shim is blocked by local execution policy; use `npm.cmd` without changing
  the system policy.

## Known risks and assumptions

- No Render or Aura resource has been created because account creation, provider terms, GitHub
  connection, and secret entry are user-owned external actions.
- The new Docker image has not been built locally because Docker is intentionally unavailable. The
  existing GitHub image build passed before this change; the changed image and POSIX start script
  require the remote CI/build gate after publication.
- AuraDB Free pauses after 72 hours of inactivity and permanently deletes an instance left paused for
  more than 30 days.
- Render Free cold starts can take about a minute; the documented frontend timeout is 90 seconds.
- AuraDB Free uses a managed public TLS endpoint. Credentials remain backend-only, but a private
  network topology requires paid infrastructure.
- CORS is exact but is not authorization. Authentication, abuse controls, backups, and monitoring
  remain production release gates.

## Unresolved issues

- The deployment changes are not committed or pushed; neither action was explicitly authorized.
- The AuraDB Free instance, Render service, `api` CNAME, Render TLS verification, Cloudflare Pages API
  variables, remote migration/seed, and public smoke checks remain pending.
- A reviewed non-synthetic production dataset has not been imported.

## Uncommitted or unmerged state

The checkout remains on `master` tracking `origin/master`. The files listed above are uncommitted.
The older untracked resume handoff remains a separate pre-existing user/agent change and was not
edited. No branch, remote, account, DNS record, or provider resource was changed.

## Exact next recommended action

Create one AuraDB Free instance and one Render account, connect Render to
`basykcode/currentflow`, then enter the Aura URI/username/password and real PubChem contact directly
in Render's Blueprint form. Do not paste those credentials into chat or source.

## Relevant files, commits, issues, or external references

- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../ALCHEMY_BACKEND.md`](../../ALCHEMY_BACKEND.md)
- [`../../../render.yaml`](../../../render.yaml)
- [Render free service limits](https://render.com/docs/free)
- [Render Docker deployment](https://render.com/docs/docker)
- [Neo4j Aura instance lifecycle](https://neo4j.com/docs/aura/managing-instances/instance-actions/)
- [Cloudflare Containers pricing](https://developers.cloudflare.com/containers/pricing/)
- Starting commit: `4280a16c8aeb55a2e55f0a944fce16f6d167d53f`
