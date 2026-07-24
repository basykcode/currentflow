# Project state

## Last reconciled

- UTC date: 2026-07-24
- Branch represented: `master` (complete Alchemy integration publication)
- Commit inspected: `c8f8e04fd77e943c41fd2cac5435b191c8dea730`
- `feat/alchemy-backend` contains the scoped backend foundation at `8a287c3`.
- `feat/alchemy-frontend` contains the scoped research UI and HTTP provider at `fc2a0f9`.
- `feat/alchemy-integration` merges both workstreams and their shared contract alignment at `15e77c0`.
- `master` merges the complete integration at `c8f8e04`; all intended tracked work is committed.

## Project purpose

Current is a situational-awareness and source-grounded research instrument. The alpha establishes the
product shell, deterministic global temporal calculations, and a provenance-first Alchemy knowledge
boundary while keeping personal, diagnostic, prescriptive, and interpretive systems unavailable.

## Product or system principles

- Instrument, not oracle; recommendations preserve agency and avoid certainty, diagnosis, or
  spiritual authority.
- Global, personal, and synthesized signals remain distinguishable.
- Deterministic engines and curated sources are authoritative; future AI is a constrained synthesis
  and language layer.
- Missing or unverified information is labeled rather than invented.
- The visual direction is a calm precision almanac, not a horoscope, wellness, or generic SaaS app.

Full principles: [`../PRODUCT_PRINCIPLES.md`](../PRODUCT_PRINCIPLES.md).

## Architecture summary

The integrated product is a static Vue 3/Vite/TypeScript SPA. Framework-independent contracts live in
`src/domain`; swappable adapters in `src/providers`; shared device-local state in Pinia stores;
focused presentation in `src/components`; and lazy route composition in `src/views`.
`CurrentFlowProvider` is the stable Astrology data seam.

The integrated Alchemy stack adds a separately deployable Python 3.12 FastAPI service under
`services/alchemy-api`. Its official asynchronous Neo4j driver is lifecycle-managed; Neo4j Community
is its only persistent database; external-source access is limited to explicit administration
commands; and `contracts/alchemy-openapi.json` is the frontend seam. See
[`../ARCHITECTURE.md`](../ARCHITECTURE.md).

The Alchemy frontend is isolated under `src/features/alchemy`. An injected provider boundary
supplies immutable frontend domain models; demo mode is deterministic and network-free, while API
mode uses generated OpenAPI types, `openapi-fetch`, and pure transport mappers without falling back
to fixtures. Retrieved knowledge stays route-local and the versioned, device-local formula workbench
is the only Alchemy state in Pinia.

## Current integrated capabilities

- Responsive application shell with desktop and mobile navigation.
- Routes for Astrology, Alchemy, Intelligence, Other Tools, Settings, and not-found handling.
- Functional Astrology view with selected-timezone time, automatic refresh, five-element
  composition, reusable accessible hexagram glyphs, structural relationships, and visible
  provenance.
- `LunarScriptCurrentFlowProvider` supplies exact-boundary year/month GanZhi, sect-2 day GanZhi, and
  two-hour GanZhi through `lunar-javascript` 1.7.7.
- The complete 60 Jia Zi to 64 Da Gua table resolves all four pillars to King Wen hexagrams; the
  2026 Yang Fire Horse golden case resolves to Hexagram 28.
- A cited twelve-window meridian-clock table selects the active organ period from civil time in the
  snapshot timezone.
- Local light/dark/system theme, functional timezone preference, optional location label, and local
  reset.
- The visual system is dark-first and water-themed: deep navy fields, moon-blue text, mist-blue
  Light mode, restrained cinnabar accents, and one-time legacy preference migration that preserves
  timezone/location.
- Interpretive synthesis and execution guidance are explicitly unavailable; no forecast is inferred.
- Disabled, nonconnected shells for authentication, Intelligence, and future tools; Alchemy has
  explicit demo and connected API modes.
- Sixty-two frontend unit tests cover Astrology calculations, Alchemy UI/state, every HTTP provider
  operation, timeout/problem handling, and no-fallback behavior; Cloudflare Pages build preparation
  and local metadata assets remain.

## Current Alchemy capabilities

- A strict FastAPI service with typed knowledge/error envelopes, request IDs, structured local logs,
  validated configuration, liveness/readiness/meta routes, and safe lifecycle handling.
- A migrated Neo4j knowledge graph for distinct identities, formula/preparation variants, source
  claims, conflicts, citations, documents/passages, import runs, and explicit review status.
- Herb, formula, source, document, passage, text-search, neighborhood, constrained-exploration,
  deterministic analysis/comparison, and retrieval-context endpoints.
- Checksum- and rights-enforced synthetic, USDA Duke, PubChem, user-supplied text/JSONL, and SymMap
  review-placeholder adapters. End-user API requests do not call these external sources.
- A versioned, score-free formula analysis engine that preserves inputs and source claims, converts
  only explicitly supported metric units, and reports missing interactions as unknown.
- Synthetic demo fixtures, administration CLI, generated OpenAPI, Compose definition, CI workflow,
  and focused backend/API/integration tests.
- A complete responsive Alchemy shell with Materia Medica, Formula Library, Formula Workbench, Text
  Library, and deliberately disabled Guided Inquiry routes.
- Deterministic synthetic searches, sourced detail, explicit conflicts/incompleteness, relationship
  neighborhoods, versioned analysis/comparison results, and bounded retrieval-context preparation.
- Up to four schema-validated device-local formula drafts with immutable source import, ingredient
  validation/reordering, persistence recovery, and composition export.
- A visible provider/capability boundary that performs no network calls in demo mode and never falls
  back from unavailable API mode.
- A generated, typed `HttpAlchemyProvider` maps every provider method, preserves request IDs and
  problems, combines cancellation with configured timeouts, and reports disconnected/degraded state.
- The backend contract exposes source-backed summary properties, document titles, mentioned
  entities, empty-query text listing, and exact passage-ID retrieval so the browser never invents
  missing provenance.

## Important invariants and constraints

- TypeScript remains strict; avoid undocumented `any`.
- Hexagram lines are stored bottom-to-top and reversed only for display.
- All display data carries status/provenance; no fabricated calculations or hidden network calls.
- Domain calculations remain independent from Vue presentation.
- Preferences are device-local; no geolocation, auth, AI, analytics, or remote database SDK is active
  in the integrated SPA.
- Alchemy knowledge facts require provenance, demo status, conflict state, or explicit unavailability.
- Raw Cypher, APOC, runtime source scraping, external inference, diagnosis, dose recommendations,
  compatibility/safety scores, and personal health data are outside the Alchemy service boundary.
- Neo4j must remain private in deployment; local Compose binds its ports only to loopback.
- The year pillar changes at exact Li Chun, the month at exact solar-term transition, and the sect-2
  day remains on the civil day during 23:00–23:59.
- Organ-clock selection uses civil time in the chosen IANA timezone and makes no apparent-solar-time
  correction.
- Dark is the root/default theme to avoid a pre-mount light flash; explicit Light and System choices
  remain available.
- Node baseline is `22.18.0`; `npm run check` is required before completion.
- Production branch is `master`; Vite base is `/`; static output is `dist`.

## Key accepted decisions

- [Preserve deterministic authority through provider and provenance contracts](decisions/20260723T233411Z--preserve-deterministic-authority-through-provider-and-provenance-contracts.md)
- [Calculate temporal facts with declared source boundaries](decisions/20260723T235840Z--calculate-temporal-facts-with-declared-source-boundaries.md)
- [Adopt a dark-first Daoist water palette](decisions/20260724T001425Z--adopt-a-dark-first-daoist-water-palette.md)
- [Ship the alpha as a static client-side Vue SPA](decisions/20260723T233411Z--ship-alpha-as-static-client-side-vue-spa.md)
- [Establish a provenance-first Alchemy graph service](decisions/20260724T005309Z--establish-provenance-first-alchemy-graph-service.md)
- [Separate the Alchemy frontend domain from transport](decisions/20260724T010602Z--separate-alchemy-domain-from-transport.md)
- [Use dedicated Alchemy branches and CMP publication gates](decisions/20260724T014000Z--use-dedicated-alchemy-branches-and-cmp-publication-gates.md)
- [Align the Alchemy HTTP contract with the frontend domain](decisions/20260724T204127Z--align-alchemy-http-contract-with-the-frontend-domain.md)
- Supporting architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Planned data seams: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)

## Active workstreams

| Branch/worktree            | Objective                          | Status                                                                   | Latest handoff                                                                                                   |
| -------------------------- | ---------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `master`                   | Replace fixtures with live factors | Published to `origin/master` in `9b6cbe1`                                | [Publication handoff](handoffs/20260724T000640Z--master--publish-live-temporal-calculations.md)                  |
| `master`                   | Adopt dark-first water palette     | Published to `origin/master` in `11c5ced`                                | [Publication handoff](handoffs/20260724T001811Z--master--publish-dark-first-water-theme.md)                      |
| `feat/alchemy-backend`     | Alchemy graph backend foundation   | Scoped commit `8a287c3`; published workstream                            | [Backend handoff](handoffs/20260724T005309Z--master--establish-alchemy-backend-foundation.md)                    |
| `feat/alchemy-frontend`    | Alchemy research frontend          | Scoped commit `fc2a0f9`; published workstream                            | [Frontend handoff](handoffs/20260724T010800Z--master--build-alchemy-frontend.md)                                 |
| `feat/alchemy-integration` | Reconcile Alchemy contracts        | Complete integration at `15e77c0`; merged into `master` at `c8f8e04`     | [Cross-device handoff](handoffs/20260724T212022Z--feat-alchemy-integration--prepare-cross-device-publication.md) |
| `master`                   | Publish complete Alchemy stack     | Canonical integrated branch at merge `c8f8e04` plus publication record   | [Publication handoff](handoffs/20260724T212147Z--master--publish-complete-alchemy-and-cross-device-state.md)     |

## Known issues and risks

- Exact solar-term transition results inherit `lunar-javascript`; edge dates need cross-library
  golden fixtures before high-assurance natal or electional use.
- The 60 Jia Zi mapping is implemented from a documented practitioner table; its lineage and
  translations should receive subject-matter review before stronger authority claims.
- Organ-clock selection is civil-time educational context, not apparent-solar-time correction or a
  medical claim.
- The Alchemy Dockerfile and Compose stack could not be built or started because no Docker-compatible
  runtime is installed. The API and real Neo4j integration passed with portable local runtimes.
- No production Alchemy dataset has been imported. USDA Duke passed checksum validation and offline
  dry-run mapping; PubChem is opt-in and cached; SymMap remains blocked pending rights review.
- Alchemy auth, saved research workspaces, remote deployment, embeddings, and inference are inactive.
- Frontend verification ran under the available Node 24.14.0 runtime; the repository pins Node
  22.18.0, so the quality gate should be repeated on the pinned runtime before release.
- Personal BaZi, changing-line divination, interpretive synthesis, and execution recommendations are
  inactive.
- Cloudflare Pages deployment and the production domain are prepared but not confirmed as connected.

## Open questions

- Which independent calendrical implementation should become the cross-check for exact solar-term
  boundaries?
- What is the canonical production URL? `https://current-flow.net` remains a placeholder.
- What privacy, retention, and identity requirements must precede personal context and saved readings?
- Has a Cloudflare Pages project been connected to the GitHub repository? Repository evidence does not
  establish deployment status.
- What authentication, authorization, retention, and deployment topology should precede production
  Alchemy access?
- Which reviewed traditional-source corpus and identity crosswalk should be onboarded first?

## Next priorities

1. On a Docker-capable machine, build and start Neo4j and the Alchemy API through Compose, then rerun
   migration, idempotent seed, readiness, endpoint smoke, and image-build gates.
2. Configure an actual API/Neo4j production host, exact CORS/API origins, TLS, backups, and a
   post-test deployment workflow; the existing GitHub workflow validates but does not deploy.
3. Cross-check Li Chun and monthly solar-term boundaries with an independent maintained calendrical
   implementation and add before/after fixtures.
4. Obtain domain review for USDA mappings, traditional-source identity boundaries, and the 60 Jia Zi
   mapping before stronger authority claims.
5. Define authentication, privacy, retention, and private Neo4j deployment requirements.

Exact next useful action after publication: clone `master` on the replacement computer, rerun the
documented frontend/backend checks, then provision the private Neo4j/API deployment host.

## Documentation map

- Product overview and setup: [`../../README.md`](../../README.md)
- Product principles: [`../PRODUCT_PRINCIPLES.md`](../PRODUCT_PRINCIPLES.md)
- Architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Data integration boundaries: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)
- Alchemy backend operation: [`../ALCHEMY_BACKEND.md`](../ALCHEMY_BACKEND.md)
- Alchemy API/frontend contract: [`../ALCHEMY_API.md`](../ALCHEMY_API.md)
- Alchemy graph schema: [`../ALCHEMY_GRAPH_SCHEMA.md`](../ALCHEMY_GRAPH_SCHEMA.md)
- Alchemy data governance: [`../ALCHEMY_DATA_GOVERNANCE.md`](../ALCHEMY_DATA_GOVERNANCE.md)
- Alchemy safety boundary: [`../ALCHEMY_SAFETY.md`](../ALCHEMY_SAFETY.md)
- Alchemy frontend operation: [`../ALCHEMY_FRONTEND.md`](../ALCHEMY_FRONTEND.md)
- Alchemy frontend integration: [`../ALCHEMY_FRONTEND_INTEGRATION.md`](../ALCHEMY_FRONTEND_INTEGRATION.md)
- Alchemy UI data model: [`../ALCHEMY_UI_DATA_MODEL.md`](../ALCHEMY_UI_DATA_MODEL.md)
- Calculation sources and conventions: [`../CALCULATION_SOURCES.md`](../CALCULATION_SOURCES.md)
- Deployment: [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
- Continuity procedure: [`README.md`](README.md)
- Accepted decisions: [`decisions/`](decisions/)
- Session handoffs: [`handoffs/`](handoffs/)
