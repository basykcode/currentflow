# Project state

## Last reconciled

- UTC date: 2026-07-24
- Branch represented: `master` (integrated state)
- Commit inspected: `11c5ced9ea3199b96e36a6a356dee305563d9e79`
- Working tree before live-calculation work: clean
- Current working tree contains a separate uncommitted `services/alchemy-api` scaffold and related
  `.gitignore` edits that were not part of the live-calculation publication.

## Project purpose

Current is a situational-awareness instrument for timing. The alpha establishes the product shell,
domain contracts, visual language, and deterministic global temporal calculations while keeping
personal and interpretive systems unavailable.

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

Current is a static Vue 3/Vite/TypeScript SPA. Framework-independent contracts live in `src/domain`;
swappable adapters in `src/providers`; shared device-local state in Pinia stores; focused presentation
in `src/components`; and lazy route composition in `src/views`. `CurrentFlowProvider` is the stable
Astrology data seam. See [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

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
- Disabled, nonconnected shells for authentication, Alchemy engines, Intelligence, and future tools.
- Thirty-five unit tests cover line rendering, source-table completeness, timezone projection, the
  Fire Horse snapshot, every organ-clock hour, and provider status; Cloudflare Pages build
  preparation and local metadata assets remain.

## Important invariants and constraints

- TypeScript remains strict; avoid undocumented `any`.
- Hexagram lines are stored bottom-to-top and reversed only for display.
- All display data carries status/provenance; no fabricated calculations or hidden network calls.
- Domain calculations remain independent from Vue presentation.
- Preferences are device-local; no geolocation, backend, auth, AI, analytics, or database SDK is active.
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
- Supporting architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Planned data seams: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)

## Active workstreams

| Branch/worktree | Objective                          | Status                                                | Latest handoff                                                                                  |
| --------------- | ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `master`        | Replace fixtures with live factors | Published to `origin/master` in `9b6cbe1`             | [Publication handoff](handoffs/20260724T000640Z--master--publish-live-temporal-calculations.md) |
| `master`        | Adopt dark-first water palette     | Published to `origin/master` in `11c5ced`             | [Publication handoff](handoffs/20260724T001811Z--master--publish-dark-first-water-theme.md)     |
| `master`        | Concurrent Alchemy API scaffold    | Uncommitted separate work; excluded from this publish | No handoff observed                                                                             |

## Known issues and risks

- Exact solar-term transition results inherit `lunar-javascript`; edge dates need cross-library
  golden fixtures before high-assurance natal or electional use.
- The 60 Jia Zi mapping is implemented from a documented practitioner table; its lineage and
  translations should receive subject-matter review before stronger authority claims.
- Organ-clock selection is civil-time educational context, not apparent-solar-time correction or a
  medical claim.
- Auth, AI, Neo4j, herbal/formula logic, saved readings, and remote persistence are inactive.
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

## Next priorities

1. Cross-check Li Chun and monthly solar-term boundary instants with an independent maintained
   calendrical implementation and add before/after fixtures.
2. Obtain subject-matter review of the 60 Jia Zi mapping and selected English names.
3. Define the separate personal BaZi contract before any personal/global synthesis.
4. Confirm the canonical domain and deployment state, then update metadata and deployment docs.

Exact next useful action: add a Li Chun boundary fixture without disturbing the separate uncommitted
Alchemy API scaffold.

## Documentation map

- Product overview and setup: [`../../README.md`](../../README.md)
- Product principles: [`../PRODUCT_PRINCIPLES.md`](../PRODUCT_PRINCIPLES.md)
- Architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Data integration boundaries: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)
- Calculation sources and conventions: [`../CALCULATION_SOURCES.md`](../CALCULATION_SOURCES.md)
- Deployment: [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
- Continuity procedure: [`README.md`](README.md)
- Accepted decisions: [`decisions/`](decisions/)
- Session handoffs: [`handoffs/`](handoffs/)
