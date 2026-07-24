# Deployment

Current uses three independently deployable boundaries:

```text
current-flow.net (Cloudflare Pages)
        |
        v
api.current-flow.net (Render Docker web service)
        |
        v
AuraDB Free (managed Neo4j over TLS)
```

The frontend and domain DNS are already live through Cloudflare. DreamHost remains the registrar,
but the authoritative nameservers are Cloudflare, so all application DNS changes belong in the
Cloudflare dashboard.

## Why the alpha is not entirely on Cloudflare

Cloudflare Pages remains a good fit for the static Vue application. Pages Functions run in the
Workers runtime and cannot run the existing Python/FastAPI Docker image. Cloudflare Containers can
run the image, but Containers require the Workers Paid plan and their local disk is ephemeral. A
durable Neo4j database would still need a separate managed service.

For the low-traffic alpha, the selected path is:

- Cloudflare Pages Free for the frontend.
- Render Free for the existing Alchemy API Docker image.
- Neo4j AuraDB Free for the graph.

This is an alpha deployment, not a production SLA. See
[Render's free-service limits](https://render.com/docs/free),
[Aura instance lifecycle rules](https://neo4j.com/docs/aura/managing-instances/instance-actions/),
and the accepted
[alpha backend hosting decision](continuity/decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md).

## Account boundary

Two accounts must exist before provisioning can finish. Neither setup needs local administrator
access, Docker Desktop, firewall changes, inbound local networking, or a local server.

### 1. Create the managed graph

1. Sign in or create an account at [Neo4j Aura](https://console.neo4j.io/).
2. Create one **AuraDB Free** instance. Choose a US East region when available so it is near the
   Render Virginia service.
3. Download or copy the generated connection credentials immediately. The password is not
   recoverable.
4. Keep these values out of the repository and chat:
   - connection URI, normally beginning with `neo4j+s://`
   - username
   - password
   - database name exactly as shown in the credentials file; do not assume it is `neo4j` or reuse
     the username

Only one Free instance is available per Aura account. Do not expose its credentials to the browser
or put them in Cloudflare Pages variables.

### 2. Create the API service

1. Sign in or create an account at [Render](https://dashboard.render.com/).
2. Connect the GitHub account that can read `basykcode/currentflow`.
3. Choose **New → Blueprint**, select the repository, and use the root `render.yaml`.
4. Render prompts for the five values marked `sync: false`:

   | Render variable      | Value to enter                                |
   | -------------------- | --------------------------------------------- |
   | `NEO4J_URI`          | Aura connection URI                           |
   | `NEO4J_USERNAME`     | Aura username                                 |
   | `NEO4J_PASSWORD`     | Aura password                                 |
   | `NEO4J_DATABASE`     | Aura database name from the credentials file  |
   | `PUBCHEM_USER_AGENT` | `CurrentAlchemy/0.1 (a real project contact)` |

5. Apply the Blueprint.

Render builds the Docker image remotely from `services/alchemy-api/Dockerfile`. The production start
script applies checksum-protected migrations, optionally applies the idempotent synthetic seed, and
only then starts Uvicorn on Render's assigned port. The Blueprint deploys only after GitHub checks
pass and uses `/api/v1/health/ready` for dependency-aware health checks.

The first useful values to copy from Render are the service URL, such as
`https://current-flow-alchemy-api.onrender.com`, and the successful deploy event. Do not copy secret
environment values out of Render.

If the Blueprint already created the web service before `NEO4J_DATABASE` was added as a prompted
value, open the service's **Environment** page, replace the existing `NEO4J_DATABASE=neo4j` value with
the database name from the Aura credentials file, save, and deploy the latest commit. Render only
prompts for new `sync: false` values during initial Blueprint creation.

## API custom domain

The Blueprint registers `api.current-flow.net` with the Render service. After the service has a live
`onrender.com` URL:

1. In Cloudflare, open **current-flow.net → SSL/TLS → Overview** and confirm mode **Full**.
2. In **DNS → Records**, add:

   | Type    | Name  | Target                                    | Proxy status |
   | ------- | ----- | ----------------------------------------- | ------------ |
   | `CNAME` | `api` | the actual Render `onrender.com` hostname | DNS only     |

3. In Render's **Settings → Custom Domains**, verify `api.current-flow.net` and wait for its TLS
   certificate to become valid.
4. Confirm `https://api.current-flow.net/api/v1/health/ready` returns HTTP 200.
5. Optionally switch the Cloudflare record from **DNS only** to **Proxied** after Render's certificate
   is valid.

Do not change the existing apex or `www` records. Render specifically requires DNS-only mode during
domain verification; proxying can be enabled afterward.

## Connect the Cloudflare Pages frontend

In the Cloudflare Pages project's **Settings → Environment variables**, set these production build
variables:

```dotenv
VITE_ALCHEMY_DATA_MODE=api
VITE_ALCHEMY_API_BASE_URL=https://api.current-flow.net
VITE_ALCHEMY_REQUEST_TIMEOUT_MS=90000
```

Then trigger a new production deployment of `master`. Vite variables are public browser
configuration, so only the API URL and timeout belong there. The 90-second timeout accommodates a
free Render cold start; paid or always-on hosting can lower it later.

## Production smoke check

Run these from any ordinary terminal. They make outbound HTTPS requests only:

```powershell
curl.exe --fail-with-body https://api.current-flow.net/api/v1/health/live
curl.exe --fail-with-body https://api.current-flow.net/api/v1/health/ready
curl.exe --fail-with-body https://api.current-flow.net/api/v1/meta
curl.exe --fail-with-body "https://api.current-flow.net/api/v1/herbs?offset=0&limit=5"
```

Then open `https://current-flow.net/alchemy` and confirm the provider status is connected and the
synthetic records are visibly labeled as demo data. A missing or unavailable API must remain visible;
the frontend must not silently fall back to fixtures.

## Free-tier operating limits

- Render spins a Free web service down after 15 idle minutes. The first request after that can take
  about a minute. Its filesystem is ephemeral, which is acceptable because Neo4j owns all persistent
  state.
- AuraDB Free pauses after 72 hours without activity. A Free instance left paused for more than 30
  days is permanently deleted. Resume it in Aura before use and export a snapshot before any
  extended idle period.
- The startup seed is explicit synthetic data (`ALCHEMY_SEED_DEMO=1`). Set it to `0` after reviewed
  source data has been imported if demo records should no longer be refreshed at boot.
- The API has exact production CORS origins but no end-user authentication. CORS is not
  authorization. Keep the alpha limited to non-personal, research-only data and add authentication,
  abuse controls, backups, and paid uptime before treating it as a production service.

## No-admin workstation rule

This workstation does not have administrator credentials. Deployment and maintenance must therefore
prefer provider dashboards, GitHub CI, and remote image builds.

Do not:

- install or start Docker Desktop here;
- request Windows firewall, inbound-network, local-network, driver, Hyper-V, or WSL changes;
- use a Cloudflare Tunnel from this laptop as a production origin;
- run a local listener as part of remote deployment;
- store provider secrets in source, continuity files, Vite variables, or chat.

User-scoped Node 22.18.0 and `uv` are already available. In Windows PowerShell, use `npm.cmd` rather
than `npm` if script execution policy blocks the `npm.ps1` shim.

## Existing Cloudflare Pages settings

- Git provider: GitHub
- Repository: `basykcode/currentflow`
- Production branch: `master`
- Framework preset: Vue (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Node version: `22.18.0`

Vite uses `/` as its base. There is deliberately no top-level `404.html`, redirect file, Worker,
Function, or Wrangler configuration; Cloudflare Pages supplies SPA fallback when no top-level
`404.html` exists.
