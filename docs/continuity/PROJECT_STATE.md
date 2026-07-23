# Project state

## Last reconciled

- UTC date: 2026-07-23
- Branch represented: `master` (integrated state)
- Commit inspected: `29183c3beaacac928f9731a35e20004c6f17a835`
- Working tree before continuity bootstrap: clean

## Project purpose

Current is a situational-awareness instrument for timing. The alpha establishes the product shell,
domain contracts, visual language, and a working interface without claiming verified traditional
calculations.

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
- Functional Astrology proof of concept with local time, timezone, refresh, five-element composition,
  reusable accessible hexagram glyphs, synthesis sections, and visible provenance.
- `DemoCurrentFlowProvider` supplies explicit, polished fixtures labeled `demo`; no traditional
  calculation is claimed.
- Local light/dark/system theme, timezone preference scaffold, optional location label, and local reset.
- Disabled, nonconnected shells for authentication, Alchemy engines, Intelligence, and future tools.
- Unit coverage for hexagram rendering conventions and demo-provider status; Cloudflare Pages build
  preparation and local metadata assets.

## Important invariants and constraints

- TypeScript remains strict; avoid undocumented `any`.
- Hexagram lines are stored bottom-to-top and reversed only for display.
- All display data carries status/provenance; no fabricated calculations or hidden network calls.
- Domain calculations remain independent from Vue presentation.
- Preferences are device-local; no geolocation, backend, auth, AI, analytics, or database SDK is active.
- Node baseline is `22.18.0`; `npm run check` is required before completion.
- Production branch is `master`; Vite base is `/`; static output is `dist`.

## Key accepted decisions

- [Preserve deterministic authority through provider and provenance contracts](decisions/20260723T233411Z--preserve-deterministic-authority-through-provider-and-provenance-contracts.md)
- [Ship the alpha as a static client-side Vue SPA](decisions/20260723T233411Z--ship-alpha-as-static-client-side-vue-spa.md)
- Supporting architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Planned data seams: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)

## Active workstreams

| Branch/worktree | Objective                            | Status                                        | Latest handoff                                                                         |
| --------------- | ------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `master`        | Bootstrap durable project continuity | Complete; integrated by the continuity commit | [Bootstrap handoff](handoffs/20260723T233411Z--master--bootstrap-continuity-system.md) |

No unmerged feature work is recorded.

## Known issues and risks

- Temporal, organ-clock, relationship, and personal BaZi engines are not implemented or verified.
- All Astrology content is demo data and must not be interpreted as the actual current configuration.
- Auth, AI, Neo4j, herbal/formula logic, saved readings, and remote persistence are inactive.
- Timezone and location preferences do not recalculate the demo snapshot.
- Automated coverage is intentionally narrow; only four unit tests exist.
- Cloudflare Pages deployment and the production domain are prepared but not confirmed as connected.

## Open questions

- What verified sources and calculation rules will govern the deterministic temporal engine?
- What is the canonical production URL? `https://current-flow.net` remains a placeholder.
- What privacy, retention, and identity requirements must precede personal context and saved readings?
- Has a Cloudflare Pages project been connected to the GitHub repository? Repository evidence does not
  establish deployment status.

## Next priorities

1. Define the authoritative sources, inputs, outputs, edge cases, and golden fixtures for a verified
   deterministic temporal provider before implementing calculations.
2. Add contract-level tests for unavailable/computed states and provider substitution.
3. Confirm the canonical domain and deployment state, then update metadata and deployment docs.

Exact next useful action: write an evidence-backed temporal-provider specification with source
citations and golden test cases; do not implement algorithms until that specification is accepted.

## Documentation map

- Product overview and setup: [`../../README.md`](../../README.md)
- Product principles: [`../PRODUCT_PRINCIPLES.md`](../PRODUCT_PRINCIPLES.md)
- Architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Data integration boundaries: [`../DATA_INTEGRATION.md`](../DATA_INTEGRATION.md)
- Deployment: [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
- Continuity procedure: [`README.md`](README.md)
- Accepted decisions: [`decisions/`](decisions/)
- Session handoffs: [`handoffs/`](handoffs/)
