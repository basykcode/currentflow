# Current ~ Flow

Current is a situational-awareness instrument for timing: a calm precision almanac that keeps
global conditions, personal context, and their interface distinct. The current alpha includes a
deterministic global temporal calculation layer while keeping personal and interpretive systems
unconnected.

## Alpha scope

The Astrology route calculates timezone-aware GanZhi pillars, their 60 Jia Zi hexagrams, the
traditional two-hour organ period, and line-derived structural relationships. Alchemy provides a
synthetic source-aware materia medica, formula library, four-slot local workbench, formula
analysis/comparison demonstration, and text-retrieval library. Intelligence, Other Tools,
authentication, personal BaZi, interpretive synthesis, the Alchemy HTTP client, and guided-inquiry
model remain deliberately unconnected. Settings for theme, timezone, and local preferences work on
the current device.

## Local setup

Use Node 22.18.0 and npm.

```bash
nvm use
npm install
npm run dev
```

The development server prints the local URL. No service credentials or environment variables are
required for Alchemy demo mode.

## Alchemy frontend

Alchemy routes include:

- `/alchemy/materia-medica` and directly addressable material records;
- `/alchemy/formulas` and directly addressable formula records;
- `/alchemy/workbench` for one to four device-local drafts;
- `/alchemy/texts` for passage search and bounded retrieval packages;
- `/alchemy/inquiry` for a nonfunctional private-model workflow preview.

The default `VITE_ALCHEMY_DATA_MODE=demo` performs no network calls and visibly identifies every
fixture as synthetic. Copy `.env.example` to `.env.local` only when you want to make the mode
explicit.

Connected API mode uses:

```dotenv
VITE_ALCHEMY_DATA_MODE=api
VITE_ALCHEMY_API_BASE_URL=http://localhost:8000
VITE_ALCHEMY_REQUEST_TIMEOUT_MS=10000
```

API mode now uses the checked-in OpenAPI schema and `HttpAlchemyProvider`. Missing or invalid API
configuration is shown as unavailable, and API failures never fall back to demo data. See
[`docs/ALCHEMY_FRONTEND.md`](docs/ALCHEMY_FRONTEND.md) and
[`docs/ALCHEMY_FRONTEND_INTEGRATION.md`](docs/ALCHEMY_FRONTEND_INTEGRATION.md).

## Alchemy backend

The first Alchemy backend foundation lives in `services/alchemy-api` and leaves the Vue frontend in
place. It provides sourced Neo4j retrieval, safe graph exploration, document/passages search, and
versioned deterministic formula analysis. It is research information, not medical advice; demo
records are fictional and visibly use `demo:` IDs.

Install Docker Desktop and `uv`, then:

```powershell
Copy-Item services/alchemy-api/.env.example .env
# Replace NEO4J_PASSWORD and the PubChem contact placeholder in .env.
npm run alchemy:up
npm run alchemy:migrate
npm run alchemy:seed
```

The API is at `http://localhost:8000`, OpenAPI UI at
`http://localhost:8000/api/v1/docs`, and local Neo4j Browser at `http://localhost:7474`.
Operational and safety details are in [`docs/ALCHEMY_BACKEND.md`](docs/ALCHEMY_BACKEND.md).

## Scripts

- `npm run dev` — start Vite development mode
- `npm run build` — type-check and create `dist`
- `npm run preview` — preview the production bundle
- `npm run type-check` — run strict Vue/TypeScript checks
- `npm run lint` — run ESLint
- `npm run format` — format source and documentation
- `npm run test:unit` — run Vitest unit tests
- `npm run check` — type-check, lint, unit test, and production build
- `npm run alchemy:up` / `alchemy:down` — start or stop local Neo4j and API
- `npm run alchemy:migrate` / `alchemy:seed` — apply graph migrations and seed fictional demo data
- `npm run alchemy:check` — run backend formatting, lint, typing, tests, and contract checks
- `npm run alchemy:openapi` — export `contracts/alchemy-openapi.json`
- `npm run alchemy:types` — generate frontend types after installing the OpenAPI tooling

## Repository structure

```text
src/app             routing
src/assets/styles   tokens and global CSS
src/components      focused UI by feature
src/domain          framework-independent contracts
src/features        vertically scoped product features, including Alchemy
src/providers       swappable data adapters
src/stores          shared preferences and identity state
src/views           route-level composition
docs                product, architecture, integration, and deployment notes
public              local metadata assets
```

## Project continuity

Durable project memory lives in [`docs/continuity/PROJECT_STATE.md`](docs/continuity/PROJECT_STATE.md).
Read the [continuity guide](docs/continuity/README.md) before substantial work; decisions and
session handoffs preserve rationale and operational history without relying on chat transcripts.

## Current data status

Astrology's global temporal facts are calculated locally. `lunar-javascript` supplies the four
GanZhi pillars, a versioned 60 Jia Zi to 64 Da Gua table supplies their hexagrams, and a cited
two-hour table supplies the organ period. Interpretive forecasts and activity recommendations remain
explicitly unavailable. See [`docs/CALCULATION_SOURCES.md`](docs/CALCULATION_SOURCES.md) and
[`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md).

Alchemy demo knowledge uses `demo`, `conflicted`, `incomplete`, and `unavailable` data statuses plus
the `synthetic_fixture` review state. These labels describe provenance and availability, never
clinical appropriateness. Every source claim retains citations or an explicit absence state. See
[`docs/ALCHEMY_UI_DATA_MODEL.md`](docs/ALCHEMY_UI_DATA_MODEL.md).

## Deployment summary

Cloudflare Pages builds `master` with `npm run build` and publishes `dist` at
`https://current-flow.net`. The no-admin alpha backend plan keeps the frontend on Pages, builds the
Alchemy API Docker image remotely on Render, and uses managed AuraDB for Neo4j. Account, secret, DNS,
free-tier, and smoke-test steps are in `docs/DEPLOYMENT.md`.

If no Git remote exists after the first commit:

```bash
git remote add origin https://github.com/basykcode/currentflow.git
git push -u origin master
```

## Next integration points

Add cross-library solar-term boundary fixtures, introduce a separate personal BaZi contract, and
connect constrained synthesis only after authoritative inputs and provenance are available.
