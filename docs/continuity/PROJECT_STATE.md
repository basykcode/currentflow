# Project state

## Last reconciled

- UTC date: 2026-07-26
- Branch represented: `master` with uncommitted hexagram inspection/library work
- Commit inspected: `fb668fbd43782512ca202bb57e05b92beb8af143`
- `feat/alchemy-backend` contains the scoped backend foundation at `8a287c3`.
- `feat/alchemy-frontend` contains the scoped research UI and HTTP provider at `fc2a0f9`.
- `feat/alchemy-integration` merges both workstreams and their shared contract alignment at `15e77c0`.
- `master` merges the complete integration at `c8f8e04`, publishes the alpha hosting configuration
  at `81c6d4e`, and connects the production frontend to the live API at `3a44820`.

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

The framework-independent hexagram reference boundary now owns the complete identity catalog,
trigrams, Gene Keys keyword mapping, three library orderings, and pure structural transformations.
A transient Pinia store holds the inspected King Wen number, while one app-level modal supplies the
shared interaction for Astrology and the `/tools/hexagrams` library route.

The integrated Alchemy stack adds a separately deployable Python 3.12 FastAPI service under
`services/alchemy-api`. Its official asynchronous Neo4j driver is lifecycle-managed; Neo4j is its
only persistent database; external-source access is limited to explicit administration commands;
and `contracts/alchemy-openapi.json` is the frontend seam. Local Compose/CI use the pinned Community
image. The live alpha topology keeps the frontend on Cloudflare Pages, remotely builds the API
Docker image on Render, and connects it to managed AuraDB. See
[`../ARCHITECTURE.md`](../ARCHITECTURE.md).

The Alchemy frontend is isolated under `src/features/alchemy`. An injected provider boundary
supplies immutable frontend domain models; demo mode is deterministic and network-free, while API
mode uses generated OpenAPI types, `openapi-fetch`, and pure transport mappers without falling back
to fixtures. Retrieved knowledge stays route-local and the versioned, device-local formula workbench
is the only Alchemy state in Pinia.

## Current integrated capabilities

- Responsive application shell with desktop and mobile navigation.
- Routes for Astrology, Alchemy, Intelligence, Settings, a complete Hexagram Library, an encrypted
  VH special message, and not-found handling; Other Tools is a two-level navigation menu.
- Functional Astrology view with selected-timezone time, automatic refresh, five-element
  composition, reusable accessible hexagram glyphs, structural relationships, and visible
  provenance.
- `LunarScriptCurrentFlowProvider` supplies exact-boundary year/month GanZhi, sect-2 day GanZhi, and
  two-hour GanZhi through `lunar-javascript` 1.7.7.
- The complete 60 Jia Zi to 64 Da Gua table resolves all four pillars to King Wen hexagrams; the
  2026 Yang Fire Horse golden case resolves to Hexagram 28.
- Every visible Astrology or related-relationship hexagram opens a shared responsive inspector with
  Chinese characters, tone-marked pinyin, an English display title, labeled upper/lower trigrams,
  four fixed relationships, six selectable single-line changes, and visible source status.
- The Other Tools Hexagram Library renders all 64 verified figures and can order them by King Wen,
  bottom-up Fu Xi binary value, or an Early Heaven trigram matrix.
- The inspector shows the official Shadow/Gift/Siddhi vocabulary for all 64 corresponding Gene Keys
  with direct source links; it makes no runtime request.
- Daoism, Confucianism, Buddhism, Psychology, Human Design, and Gene Keys commentary views plus
  Absolute Shadow are present but explicitly unavailable until reviewed content or rules arrive.
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
- A responsive VH special-message experience uses the supplied four-frame fixed background, a
  password-derived AES-GCM decryption boundary, scalable message text, and visibly unavailable
  music controls until the track is supplied.
- Seventy-four frontend unit tests cover Astrology calculations, the complete hexagram catalog and
  transforms, inspector/library interactions, Alchemy UI/state, every HTTP provider operation,
  timeout/problem handling, no-fallback behavior, special-message decryption, and two-level tools
  navigation; Cloudflare Pages build preparation and local metadata assets remain.

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
- A Render Blueprint and provider-neutral production start script apply migrations before serving,
  optionally seed visibly synthetic data, use exact CORS origins, and expose dependency-aware health.
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
- Production Cloudflare Pages builds select the HTTP provider through checked-in public
  configuration, use `https://api.current-flow.net`, and allow 90 seconds for a Render cold start.
- The backend contract exposes source-backed summary properties, document titles, mentioned
  entities, empty-query text listing, and exact passage-ID retrieval so the browser never invents
  missing provenance.

## Important invariants and constraints

- TypeScript remains strict; avoid undocumented `any`.
- Hexagram lines are stored bottom-to-top and reversed only for display.
- Hexagram identity and Gene Keys keywords are curated references; structural transforms are
  computed; commentary and undefined advanced transforms remain unavailable.
- All display data carries status/provenance; no fabricated calculations or hidden network calls.
- Domain calculations remain independent from Vue presentation.
- Preferences are device-local; no geolocation, auth, AI, analytics, or remote database SDK is active
  in the integrated SPA.
- Special-message plaintext and passwords remain absent from source and browser storage.
  Browser-side encrypted messages resist casual source inspection but do not replace server-side
  authorization for stronger confidentiality requirements.
- Alchemy knowledge facts require provenance, demo status, conflict state, or explicit unavailability.
- Raw Cypher, APOC, runtime source scraping, external inference, diagnosis, dose recommendations,
  compatibility/safety scores, and personal health data are outside the Alchemy service boundary.
- Self-hosted Neo4j must remain private; local Compose binds its ports only to loopback. AuraDB
  credentials and its managed TLS endpoint are backend-only and never enter frontend configuration.
- This workstation has no administrator credentials. Work must not require Docker Desktop, firewall
  or inbound/local-network permission changes, system installs, local tunnels, or a local production
  listener; prefer provider dashboards, GitHub CI, remote builds, and user-scoped tools.
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
- [Host the alpha Alchemy API on Render and its graph on AuraDB](decisions/20260724T224853Z--host-alpha-alchemy-on-render-and-aura.md)
- [Protect static special messages with browser-side encryption](decisions/20260725T215859Z--protect-static-special-messages-with-browser-side-encryption.md)
- [Establish a provenance-first hexagram reference workspace](decisions/20260726T194513Z--establish-provenance-first-hexagram-reference-workspace.md)
- Supporting architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Planned data seams: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)

## Active workstreams

| Branch/worktree            | Objective                          | Status                                                                 | Latest handoff                                                                                                   |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `master`                   | Replace fixtures with live factors | Published to `origin/master` in `9b6cbe1`                              | [Publication handoff](handoffs/20260724T000640Z--master--publish-live-temporal-calculations.md)                  |
| `master`                   | Adopt dark-first water palette     | Published to `origin/master` in `11c5ced`                              | [Publication handoff](handoffs/20260724T001811Z--master--publish-dark-first-water-theme.md)                      |
| `feat/alchemy-backend`     | Alchemy graph backend foundation   | Scoped commit `8a287c3`; published workstream                          | [Backend handoff](handoffs/20260724T005309Z--master--establish-alchemy-backend-foundation.md)                    |
| `feat/alchemy-frontend`    | Alchemy research frontend          | Scoped commit `fc2a0f9`; published workstream                          | [Frontend handoff](handoffs/20260724T010800Z--master--build-alchemy-frontend.md)                                 |
| `feat/alchemy-integration` | Reconcile Alchemy contracts        | Complete integration at `15e77c0`; merged into `master` at `c8f8e04`   | [Cross-device handoff](handoffs/20260724T212022Z--feat-alchemy-integration--prepare-cross-device-publication.md) |
| `master`                   | Publish complete Alchemy stack     | Canonical integrated branch at merge `c8f8e04` plus publication record | [Publication handoff](handoffs/20260724T212147Z--master--publish-complete-alchemy-and-cross-device-state.md)     |
| `master`                   | Connect production Alchemy stack   | API-mode Pages release is live at `3a44820`                            | [Connected frontend handoff](handoffs/20260725T233921Z--master--connect-production-alchemy-frontend.md)          |
| `master`                   | Publish VH special message         | Feature `5fa474f` is live on Cloudflare                                | [Publication handoff](handoffs/20260725T220503Z--master--publish-vh-special-message.md)                          |
| `master`                   | Build hexagram inspection/library  | Complete and verified; uncommitted local work                          | [Development handoff](handoffs/20260726T194848Z--master--build-hexagram-inspection-library.md)                  |

## Known issues and risks

- Exact solar-term transition results inherit `lunar-javascript`; edge dates need cross-library
  golden fixtures before high-assurance natal or electional use.
- The 60 Jia Zi mapping is implemented from a documented practitioner table; its lineage and
  translations should receive subject-matter review before stronger authority claims.
- Organ-clock selection is civil-time educational context, not apparent-solar-time correction or a
  medical claim.
- The complete Compose stack has not been started locally because this computer has no
  Docker-compatible runtime and must not request administrator or network permissions to add one.
  GitHub's `Alchemy API` workflow succeeded for publication commit `04f0a66`, including backend
  quality, a disposable real-Neo4j integration test, and the API image build; remote
  migration/readiness smoke remains outstanding.
- No production Alchemy dataset has been imported. USDA Duke passed checksum validation and offline
  dry-run mapping; PubChem is opt-in and cached; SymMap remains blocked pending rights review.
- Alchemy auth, saved research workspaces, embeddings, and inference are inactive. The Render API is
  publicly live, Aura readiness succeeds, migrations and synthetic seed data are present, and all
  publication checks pass. `api.current-flow.net` now resolves, serves a valid certificate, reports
  dependency readiness, and permits the exact production browser origin. The live Cloudflare Pages
  bundle selects API mode with the custom API hostname and no fixture fallback.
- Render Free sleeps after idle and can cold-start for about a minute. AuraDB Free pauses after 72
  inactive hours and deletes an instance left paused for more than 30 days. The selected topology is
  an alpha host, not a production SLA.
- Aura-generated database names are not necessarily `neo4j`. Render must receive the exact
  `NEO4J_DATABASE` value from Aura's downloaded credentials; it is distinct from the username.
- Personal BaZi, changing-line divination, interpretive synthesis, and execution recommendations are
  inactive.
- Cloudflare Pages responds successfully at `https://current-flow.net` and
  `https://www.current-flow.net`; Cloudflare nameservers are authoritative for the domain.
- The VH page intentionally contains encrypted Lorem Ipsum and no music asset yet. Its music controls
  remain visibly unavailable until the licensed track is supplied.

## Open questions

- Which independent calendrical implementation should become the cross-check for exact solar-term
  boundaries?
- What privacy, retention, and identity requirements must precede personal context and saved readings?
- What authentication, authorization, retention, and deployment topology should precede production
  Alchemy access?
- Which reviewed traditional-source corpus and identity crosswalk should be onboarded first?

## Next priorities

1. Replace the encrypted VH placeholder copy and add the licensed looping track when the user
   supplies both.
2. Cross-check Li Chun and monthly solar-term boundaries with an independent maintained calendrical
   implementation and add before/after fixtures.
3. Obtain domain review for USDA mappings, traditional-source identity boundaries, and the 60 Jia Zi
   mapping before stronger authority claims.
4. Import the first rights-approved, reviewed Alchemy source corpus, then retire the synthetic seed
   only after its replacement data is verified.
5. Define authentication, privacy, retention, and private Neo4j deployment requirements.

Exact next useful action: obtain domain review for the first rights-approved Alchemy source corpus
before importing it into Aura and disabling the synthetic startup seed.

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
