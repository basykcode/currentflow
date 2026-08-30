# Current ~ Flow

Current is a situational-awareness instrument for timing: a calm precision almanac that keeps
global conditions, personal context, and their interface distinct. The current alpha includes a
deterministic global temporal calculation layer while keeping personal and interpretive systems
unconnected.

## Alpha scope

The Astrology route calculates timezone-aware GanZhi pillars, their 60 Jia Zi hexagrams, the
traditional two-hour organ period, and line-derived structural relationships. Alchemy provides a
synthetic source-aware materia medica, formula library, four-slot local workbench, formula
analysis/comparison demonstration, and text-retrieval library. Other Tools includes a complete
64-figure Hexagram Library and the special-message area. Intelligence, authentication, personal
BaZi, interpretive synthesis, and the guided-inquiry model remain deliberately unconnected. Settings
for theme, timezone, and local preferences work on the current device.

Every hexagram shown in Astrology, related relationships, or the library opens the shared inspection
workspace. It exposes verified Chinese identity and pinyin, upper/lower trigrams, compact structural
transformations, and the official Gene Keys Shadow/Gift/Siddhi vocabulary. Its Advanced
Transformation Lab adds provenance-aware symmetry, interior, all-destination, path, sequence, and
structural analysis while keeping unconnected lineage sources visibly unavailable. Six lazy-loaded
commentary lenses provide source-grounded draft OLTRs and summaries with evidence mode, source
disclosure, and explicit unavailable states. They are original synthesis prose, visibly require
human review, and never bundle protected source passages. Selecting a changing line reveals a
linked preview of its relating hexagram plus a concise, draft-only description of that exact
source-to-result route based on the _Jiaoshi Yilin_, with its source locator and review status.

## Local setup

Use Node 22.22.2 and npm 11.4.2 as declared in `config/toolchain.json`. These are the native Codex
Cloud versions and the canonical versions for the pending synchronized CI and production release.

```bash
nvm use
npm install --global npm@11.4.2
node --version && npm --version
npm run dependencies:install
npm run toolchain:check
npm run dev
```

The npm command is a one-time install inside the pinned nvm Node version; do not repeat it in task
bootstrap. Volta users can instead rely on the exact `volta` declaration in `package.json`.

The development server prints the local URL. No service credentials or environment variables are
required for Alchemy demo mode.

For development from any browser or phone, use the configured Current Flow Codex Cloud environment
and start each independent task from explicit `master`. Parallel tasks use short-lived branches and
protected pull requests, then converge through one serialized integration and release path. Local
Codex desktop worktrees remain available for rights-protected evidence and machine-specific work.
Every worker runs `npm run codex:doctor` before editing. Follow
[`docs/CODEX_CLOUD.md`](docs/CODEX_CLOUD.md) and
[`docs/CODEX_PARALLEL_WORK.md`](docs/CODEX_PARALLEL_WORK.md).

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
VITE_ALCHEMY_API_TIMEOUT_MS=35000
```

API mode now uses the checked-in OpenAPI schema and `HttpAlchemyProvider`. Missing or invalid API
configuration is shown as unavailable, and API failures never fall back to demo data. See
[`docs/ALCHEMY_FRONTEND.md`](docs/ALCHEMY_FRONTEND.md) and
[`docs/ALCHEMY_FRONTEND_INTEGRATION.md`](docs/ALCHEMY_FRONTEND_INTEGRATION.md).

## Alchemy backend

The first Alchemy backend foundation lives in `services/alchemy-api` and leaves the Vue frontend in
place. It provides sourced Neo4j retrieval, safe graph exploration, document/passages search, and
versioned deterministic formula analysis. Its release-aware data foundation adds a machine-readable
source/rights register, immutable manifests and checksums, DuckDB/Parquet staging, explicit mapping
assertions, source-record provenance, graph audits, and production-eligible projections. It is
research information, not medical advice; demo records are fictional and visibly use `demo:` IDs.

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
Data-import operations start in
[`docs/ALCHEMY_IMPORT_RUNBOOK.md`](docs/ALCHEMY_IMPORT_RUNBOOK.md); the graph and rights boundaries
are described in
[`docs/ALCHEMY_GRAPH_ARCHITECTURE.md`](docs/ALCHEMY_GRAPH_ARCHITECTURE.md) and
[`docs/ALCHEMY_RIGHTS_AND_LICENSING.md`](docs/ALCHEMY_RIGHTS_AND_LICENSING.md).

## Scripts

- `npm run dev` — start Vite development mode
- `npm run build` — type-check and create `dist`
- `npm run preview` — preview the production bundle
- `npm run type-check` — run strict Vue/TypeScript checks
- `npm run lint` — run ESLint
- `npm run format` — format source and documentation
- `npm run test:unit` — run Vitest unit tests
- `npm run check` — type-check, lint, unit tests, workspace tests, commentary and transition validation, and production build
- `npm run toolchain:check` — verify every exact runtime and package-manager declaration
- `npm run gateway:check` — test and dry-build the strict-TypeScript API gateway
- `npm run load:test` — validate bounded k6 profiles and production-target guards
- `npm run codex:doctor` — verify the active Codex Cloud or local-worktree boundary
- `npm run cloud:boundary` — verify protected evidence and environment files remain out of Git
- `npm run cloud:setup` / `cloud:maintenance` — reproduce the configured Codex Cloud environment
- `npm run workspace:doctor` / `workspace:status` — local-compatible doctor and lease inspection
- `npm run workspace:dev` — start Vite on the current chat's leased port
- `npm run workspace:alchemy -- <action>` — manage this chat's isolated Alchemy stack and data tools
- `npm run transitions:prepare -- --source <epub>` — rebuild local Forest transition evidence
- `npm run transitions:build-public` / `transitions:validate` — build and validate 384 line-change summaries
- `npm run commentary:prepare` — rebuild local normalized evidence, digests, packets, and coverage
- `npm run commentary:generate-drafts` — generate resumable eight-hexagram draft batches
- `npm run commentary:build-public` — build rights-safe public commentary JSON
- `npm run commentary:validate` / `commentary:review` — validate all 384 cells and write review reports
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
src/stores          shared preferences, identity, and transient inspector state
src/views           route-level composition
scripts/codex       Cloud bootstrap/evidence checks plus local worktree isolation
config              canonical toolchain manifest
workers/api-gateway separate Cloudflare API ingress and route policy
load-tests          guarded k6 scale scenarios and policy tests
content/yijing      school and Forest drafts, public bundles, registries, and reports
scripts/transitions Forest matrix preparation, line-summary build, and QA commands
scripts/commentary  evidence preparation, synthesis, public build, and QA commands
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
explicitly unavailable. Hexagram school commentaries are static, source-grounded editorial drafts,
and single-line changes can display static, source-grounded Forest summaries. Neither is a forecast
or personal reading. See
[`docs/HEXAGRAM_COMMENTARY_PIPELINE.md`](docs/HEXAGRAM_COMMENTARY_PIPELINE.md),
[`docs/HEXAGRAM_TRANSITION_COMMENTARY.md`](docs/HEXAGRAM_TRANSITION_COMMENTARY.md),
[`docs/CALCULATION_SOURCES.md`](docs/CALCULATION_SOURCES.md), and
[`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md).

Alchemy demo knowledge uses `demo`, `conflicted`, `incomplete`, and `unavailable` data statuses plus
the `synthetic_fixture` review state. These labels describe provenance and availability, never
clinical appropriateness. Every source claim retains citations or an explicit absence state. See
[`docs/ALCHEMY_UI_DATA_MODEL.md`](docs/ALCHEMY_UI_DATA_MODEL.md).

## Deployment summary

Cloudflare Pages builds `master` with `npm run build` and publishes `dist` at
`https://current-flow.net`. The no-admin alpha backend plan keeps the frontend on Pages, builds the
Alchemy API Docker image remotely on Render, and uses managed AuraDB for Neo4j. The checked-in
`.env.production` selects the public API at `https://api.current-flow.net` for production builds;
local development remains in deterministic demo mode unless explicitly configured otherwise.
Account, secret, DNS, paid-plan, and smoke-test steps are in `docs/DEPLOYMENT.md`. The production
scale boundary, capacity evidence requirements, and recovery path are in
[`docs/PRODUCTION_SCALE_ARCHITECTURE.md`](docs/PRODUCTION_SCALE_ARCHITECTURE.md),
[`docs/CAPACITY_BASELINE.md`](docs/CAPACITY_BASELINE.md), and
[`docs/PRODUCTION_RECOVERY_RUNBOOK.md`](docs/PRODUCTION_RECOVERY_RUNBOOK.md).

If no Git remote exists after the first commit:

```bash
git remote add origin https://github.com/basykcode/currentflow.git
git push -u origin master
```

## Next integration points

Human-review the generated hexagram commentary, repair the quarantined Buddhist records, add
cross-library solar-term boundary fixtures, and introduce a separate personal BaZi contract.
