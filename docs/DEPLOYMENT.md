# Deployment

Current uses four independently deployable production boundaries:

```text
current-flow.net (Cloudflare frontend Worker)
        |
        v
api.current-flow.net (Cloudflare API gateway Worker)
        |
        v
current-flow-alchemy-api.onrender.com (Render Standard Docker web service)
        |
        v
AuraDB Professional (managed Neo4j over TLS)
```

The frontend and domain DNS are already live through Cloudflare. DreamHost remains the registrar,
but the authoritative nameservers are Cloudflare, so all application DNS changes belong in the
Cloudflare dashboard.

## Why the backend is not entirely on Cloudflare

Cloudflare Workers remains a good fit for the static Vue application. The Workers runtime cannot run
the existing Python/FastAPI Docker image. Cloudflare Containers can
run the image, but Containers require the Workers Paid plan and their local disk is ephemeral. A
durable Neo4j database would still need a separate managed service.

The production path is:

- Cloudflare Workers Paid for the static frontend and the separate API gateway.
- Render Standard in Virginia for the existing Alchemy API Docker image.
- Neo4j AuraDB Professional in AWS `us-east-1` for the graph.

See the accepted
[production topology decision](continuity/decisions/20260826T175411Z--adopt-production-render-aura-cloudflare-topology.md)
and the [production operations runbook](PRODUCTION_OPERATIONS.md).

## Account boundary

Two accounts must exist before provisioning can finish. Neither setup needs local administrator
access, Docker Desktop, firewall changes, inbound local networking, or a local server.

### 1. Create the managed graph

1. Sign in or create an account at [Neo4j Aura](https://console.neo4j.io/).
2. Create one **AuraDB Professional** instance in AWS US East so it is near the Render Virginia
   service.
3. Download or copy the generated connection credentials immediately. The password is not
   recoverable.
4. Keep these values out of the repository and chat:
   - connection URI, normally beginning with `neo4j+s://`
   - username
   - password
   - database name exactly as shown in the credentials file; do not assume it is `neo4j` or reuse
     the username

Do not expose Aura credentials to the browser or put them in any Cloudflare frontend or Worker
plain-text variable. The gateway needs only its independently generated origin token.

### 2. Create the API service

1. Sign in or create an account at [Render](https://dashboard.render.com/).
2. Connect the GitHub account that can read `basykcode/currentflow`.
3. Choose **New → Blueprint**, select the repository, and use the root `render.yaml`.
4. Render prompts for the five values marked `sync: false`:

   | Render variable      | Value to enter                                              |
   | -------------------- | ----------------------------------------------------------- |
   | `NEO4J_URI`          | Aura connection URI                                         |
   | `NEO4J_USERNAME`     | Aura username                                               |
   | `NEO4J_PASSWORD`     | Aura password                                               |
   | `NEO4J_DATABASE`     | Aura database name from the credentials file                |
   | `PUBCHEM_USER_AGENT` | project contact identifier already approved for the service |

5. Apply the Blueprint.

Render builds the Docker image remotely from `services/alchemy-api/Dockerfile`. The Standard
service runs `deploy/predeploy.sh` before activation to apply checksum-protected migrations and
reconcile the approved foundation. `deploy/start.sh` is process-only and starts one Uvicorn worker
on Render's assigned port with a graceful-shutdown window. The Blueprint deploys only after GitHub
checks pass and uses `/api/v1/health/ready` for dependency-aware health checks.

The first useful values to copy from Render are the service URL, such as
`https://current-flow-alchemy-api.onrender.com`, and the successful deploy event. Do not copy secret
environment values out of Render.

If the Blueprint already created the web service before `NEO4J_DATABASE` was added as a prompted
value, open the service's **Environment** page, replace the existing `NEO4J_DATABASE=neo4j` value with
the database name from the Aura credentials file, save, and deploy the latest commit. Render only
prompts for new `sync: false` values during initial Blueprint creation.

## API gateway and custom domain

The gateway route and protected origin are active. The following order is the reproducible initial
cutover procedure; do not repeat DNS changes merely because they appear in this runbook. For later
zero-downtime token rotation, use the secondary-token sequence in `EDGE_GATEWAY.md`.

The Blueprint registers `api.current-flow.net` with the Render service. After the service has a live
`onrender.com` URL:

1. In Cloudflare, open **current-flow.net → SSL/TLS → Overview** and confirm mode **Full**.
2. In **DNS → Records**, preserve or add:

   | Type    | Name  | Target                                    | Proxy status |
   | ------- | ----- | ----------------------------------------- | ------------ |
   | `CNAME` | `api` | the actual Render `onrender.com` hostname | DNS only     |

3. In Render's **Settings → Custom Domains**, verify `api.current-flow.net` and wait for its TLS
   certificate to become valid.
4. Confirm `https://api.current-flow.net/api/v1/health/ready` returns HTTP 200.
5. Deploy `workers/api-gateway` to its workers.dev hostname. Add the canonical
   `CURRENT_EDGE_ORIGIN_TOKEN` with Wrangler's secret store; the existing `ORIGIN_TOKEN` remains a
   compatibility alias during rotation. Never place either value in `wrangler.jsonc`.
6. Verify the workers.dev proxy and cache-bypass matrix in `PRODUCTION_OPERATIONS.md`.
7. Add the path-scoped `api.current-flow.net/*` Worker route and change only the existing API
   record's proxy state when required. Keep its Render CNAME target recorded and unchanged so the
   cutover is reversible.
8. After the gateway route is healthy, set the matching canonical token (or retained
   `ALCHEMY_ORIGIN_TOKEN` alias) and `ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=1` in Render. Verify
   direct-origin application routes are rejected while provider health checks and gateway traffic
   remain healthy.

Do not change the existing apex or `www` records. Render specifically requires DNS-only mode during
domain verification. Do not route the production hostname through the Worker until workers.dev
proxy, CORS, health, origin-token, cache, and bypass tests pass.

## Connect the Cloudflare Pages frontend

The repository tracks these non-secret production build values in `.env.production`:

```dotenv
VITE_ALCHEMY_DATA_MODE=api
VITE_ALCHEMY_API_BASE_URL=https://api.current-flow.net
VITE_ALCHEMY_REQUEST_TIMEOUT_MS=30000
```

Pushing `master` therefore gives Cloudflare Pages the connected API configuration without requiring
dashboard variables. Vite values are public browser configuration, so only the data mode, public API
URL, and timeout belong in this file. Render Standard is always on, so ordinary interactive reads use
a bounded 30-second deadline; imports and projection rebuilds remain offline work.

Cloudflare production environment variables may override these values when an operational
change must be made without a source release. Never place Aura or Render credentials in either
location.

## Production smoke check

Run these from any ordinary terminal. They make outbound HTTPS requests only:

```powershell
curl.exe --fail-with-body https://api.current-flow.net/api/v1/health/live
curl.exe --fail-with-body https://api.current-flow.net/api/v1/health/ready
curl.exe --fail-with-body https://api.current-flow.net/api/v1/meta
curl.exe --fail-with-body "https://api.current-flow.net/api/v1/herbs?offset=0&limit=5"
```

Then open `https://current-flow.net/alchemy` and confirm the provider status is connected and
production source records render with their provenance. A missing or unavailable API must remain
visible; the frontend must not silently fall back to fixtures.

## Production operating limits

- Render Standard is always on, but its filesystem remains ephemeral. Neo4j is the only persistent
  store, and all migrations or foundation changes belong in pre-deploy.
- AuraDB Professional owns database availability and backups. Do not delete the former or current
  Aura instance as part of a credential cutover.
- `ALCHEMY_SEED_DEMO` is `0` in production. The pre-deploy script refuses a production demo seed.
- CORS is not authorization. The origin token limits direct-origin access but is not end-user
  authentication. Keep the service limited to public, non-personal, research-only data until an
  independently reviewed identity and authorization boundary exists.
- Scaling and rollback thresholds are maintained in `PRODUCTION_OPERATIONS.md`.

## No-admin workstation rule

This workstation does not have administrator credentials. Deployment and maintenance must therefore
prefer provider dashboards, GitHub CI, and remote image builds.

Do not:

- install or start Docker Desktop here;
- request Windows firewall, inbound-network, local-network, driver, Hyper-V, or WSL changes;
- use a Cloudflare Tunnel from this laptop as a production origin;
- run a local listener as part of remote deployment;
- store provider secrets in source, continuity files, Vite variables, or chat.

Use the exact repository toolchain versions in `config/toolchain.json`. In Windows PowerShell, use
`npm.cmd` rather than `npm` if script execution policy blocks the `npm.ps1` shim.

## Existing Cloudflare frontend settings

- Git provider: GitHub
- Repository: `basykcode/currentflow`
- Production branch: `master`
- Framework preset: Vue (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Node version: `24.19.0`

Vite uses `/` as its base. The existing `currentflow` Worker owns apex and `www`. The separate
`current-flow-api-gateway` Worker owns only the API gateway and must not replace the frontend Worker.
