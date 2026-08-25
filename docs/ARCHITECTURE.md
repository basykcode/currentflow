# Architecture

Current is a client-side Vue 3 application organized around explicit domain boundaries.

## Layers

- `src/domain`: framework-independent contracts for astrology snapshots, authentication, and settings.
- `src/providers`: swappable adapters that satisfy domain interfaces. The alpha selects
  `LunarScriptCurrentFlowProvider` in one place and retains the demo adapter only as a testable
  fixture.
- `src/stores`: Pinia state reserved for cross-route preferences, the future identity scaffold, and
  transient app-level UI selection such as the open hexagram inspector.
- `src/components`: focused presentation grouped by product area or shared role.
- `src/views`: route composition and page-level data loading.
- `src/app/router.ts`: lazy route definitions.
- `src/assets/styles`: global tokens and baseline behavior.

The Astrology view requests a `CurrentFlowSnapshot` from a provider. It does not calculate calendrical facts or embed fixture data. Components render status and provenance supplied by the domain object.

The snapshot carries temporal facts, Organ Hour, a `GuidanceBundle`, deterministic structural
relationships, and provider provenance as separate fields. Every Temporal Hexagram carries a full
canonical `HexagramReference`—including tone-marked pinyin and curated Gene Key spectrum—plus its
explicit `六十甲子配卦` mapping version; Fu Xi binary and XKDG Luo Pan positions
are normalized only at a typed domain boundary. The pure Temporal Semantic Resolver
under `src/domain/guidance/semantic-resolver` composes only eligible Current operational profiles;
an operative day outside its initial 13-profile registry remains explicitly unavailable. Its output
passes through the Guidance Output Layer, which owns controlled OLTR rendering, intention and
execution selection, validity, versions, and cross-output validation. Neither layer reads
commentary or calls a model. See
[`TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md`](TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md) and
[`GUIDANCE_OUTPUT_ARCHITECTURE.md`](GUIDANCE_OUTPUT_ARCHITECTURE.md).

The top of the Astrology route is composed by `CurrentFlowGlance`: a presentation-only projection
of that snapshot into compact temporal-card densities, the `Internal State` presentation of Organ
Hour, and the bundle OLTR or unavailable state. The canonical glyph, organ illustration, and
app-level inspector remain shared.
A pure Ganzhi identity helper selects one of 60 local animal-element illustrations for a separate
presentation row immediately below each stem-branch label and immediately above each temporal
glyph; this presentation does not participate in the calendar or hexagram calculation. Compact
stem-branch labels omit the redundant polarity word while the domain identity retains it. Exact
pillar bounds, engine and mapping labels, status, and provider notes move into an adjacent
`CalculationProvenanceDetails` disclosure; the glance does not discard or recalculate them. See
[`CURRENT_FLOW_GLANCE_LAYOUT.md`](CURRENT_FLOW_GLANCE_LAYOUT.md) and
[`ZODIAC_ART_ASSETS.md`](ZODIAC_ART_ASSETS.md).

The same glance projection renders the current 15-minute Chu / Zheng / Ke subdivision supplied by
the provider's pure Organ Clock domain helper. Historical interval identity and civil bounds are
kept separate from the eight-phase cultivation cue, which is labeled as a Current Flow product
formalization and carries its own source status.

All five glance cards share one inner-geometry contract: equal responsive padding, a fixed heading
row, a flexible middle visual row, and bottom-anchored identity text. Temporal glyph bars remain
percentage-based so the compact, featured, and regular figures scale with identical color, spacing,
and proportional weight.

## Runtime behavior

The default demo build makes no runtime network calls. Theme, timezone preference, and an optional
location label are device-local. The active Astrology provider projects an instant into the selected
timezone, delegates GanZhi calculation to `lunar-javascript`, then applies pure domain lookups and
transformations. A production build can independently select the documented Alchemy HTTP provider;
the Astrology view remains unaware of either integration.

Route components are lazy-loaded. `App.vue` owns only the application frame and transition boundary; feature behavior remains in route views and focused components.

## Hexagram reference boundary

The complete hexagram catalog remains framework-independent under `src/domain/astrology`. Each
verified entry combines its King Wen number, received Chinese name, tone-marked pinyin, display
title, bottom-to-top line structure, upper/lower trigram identities, and an official Gene Keys
three-band vocabulary reference. Static reference data is labeled `curated`; transformations are
labeled `computed`; undefined advanced rules and commentary content are `unavailable`.

Pure functions under `src/domain/yijing/transformations` calculate intrinsic relationships,
symmetry families, interior structures, moving-line destinations and paths, textual relations, and
structural anatomy. Every result resolves through the existing catalog and carries operation
provenance plus interpretation availability. A per-inspector engine memoizes the bounded result sets;
presentation components never recalculate or reinterpret them.

The same app-level Hexagram Inspector dialog contains a compact Base Hexagram screen and the Advanced
Transformation Lab. Its transient Pinia store owns a typed modal-screen stack, transformation chain,
visited targets, moving lines, filters, and arrival context so Back restores the prior screen
exactly. Closing clears the stack and no state is persisted. Classical lineage modules are closed
interfaces that remain `source-needed` until complete reviewed tables are connected. See
[`YIJING_TRANSFORMATION_LAB.md`](YIJING_TRANSFORMATION_LAB.md).

The line-change commentary boundary keeps protected evidence separate from the SPA.
`scripts/transitions` verifies and indexes the complete Forest of Changes matrix, keeps verses and
notes under `content/yijing/internal/transitions`, and builds only original draft paraphrases into
`content/yijing/generated/transitions`. The typed
`src/features/hexagram-transitions/repository.ts` lazy-loads one six-line bundle and
`HexagramTransitionInsight.vue` renders the selected route directly beneath its computed
transformation. The deterministic line result remains owned by the astrology domain; Forest prose
never participates in the calculation.

## Hexagram commentary evidence and runtime boundaries

Commentary source preparation is isolated from the runtime under `data/hexagram-commentary`. A
standalone script imports or extracts passages into one local UTF-8 file per source and King Wen
number. The full `chunked/` tree is Git-ignored because the supplied and inherited commercial texts
do not have an accepted redistribution basis.

Trackable metadata remains beside the ignored corpus: `manifest.json` identifies every source and
extraction method, `chunk-index.jsonl` binds each passage to its source ID, King Wen number, SHA-256,
rights status, and ingestion eligibility, and `audit.json` records coverage and quarantines. The SPA
does not import any of these files.

The synthesis pipeline under `scripts/commentary` validates the tracked school/source registries,
creates Git-ignored normalized chunks, per-source digests, and per-school packets, then joins
tracked original-prose drafts to those packets. Only
`content/yijing/generated/hexagrams/*.json` crosses into the SPA. Those files contain compact
attribution and sentence-to-chunk support, never source passages.

The runtime boundary is `src/features/hexagram-commentary/repository.ts`: it lazy-loads one public
bundle by King Wen number, validates it, caches it, and returns typed unavailable state on failure.
`HexagramCommentaryPanel.vue` owns presentation, tab keyboard behavior, remembered school, evidence
and source disclosure, and responsive states. It makes no network calls.

## Special-message privacy boundary

Special-message routes remain part of the static Vue deployment and make no runtime network calls.
The navigation exposes only message initials; selecting a message opens an immersive route outside
the ordinary application header.

Message copy is stored as AES-256-GCM ciphertext rather than plaintext source. The browser derives
the decryption key from the visitor-supplied password with PBKDF2-SHA-256 and decrypts only after a
successful authenticated-cipher operation. The password, decrypted copy, and derived key are not
persisted. Search crawlers are asked not to index the route, but `robots.txt` is not an access
control.

This boundary protects the copy from casual source inspection without introducing a server. It
still permits offline password guessing by anyone who obtains the bundle, so sensitive content or a
stronger threat model requires server-side authentication and authorization.

## Alchemy frontend boundary

Alchemy is a vertically scoped feature under `src/features/alchemy`. Its frontend domain models do
not depend on OpenAPI transport types. An `AlchemyProvider` is installed at application startup and
injected into the shell and route views; ordinary components do not import an active singleton.

The shell shares provider status and capabilities. Search results, material/formula detail, passages,
and retrieval packages remain route-local async resources with stale-request cancellation. Pinia is
reserved for the one-to-four formula workbench because drafts cross the formula-library/workbench
route boundary and persist under a versioned device-local key.

Demo mode binds to deterministic local fixtures and makes no network calls. API mode binds to a typed
`HttpAlchemyProvider` generated from the backend-owned OpenAPI contract. Pure mappers under
`src/features/alchemy/api` translate transport records into the richer frontend domain, preserving
missing data, conflicts, citations, request IDs, cancellation, and timeouts. Invalid configuration
and API failures remain visible and never silently substitute fixtures.

## Alchemy service boundary

Alchemy introduces a separate FastAPI service under `services/alchemy-api`; it does not convert the
Vue application into a server-rendered app or move frontend code. Neo4j is the service's only
persistent store: local Compose and CI use the pinned Community image, while the hosted alpha uses
managed AuraDB through the same driver and repository contract. The backend separates domain models
and deterministic analysis, application ports/services, a centralized Neo4j repository, offline
ingestion adapters, and API transport.

The checked-in OpenAPI contract is the frontend integration seam. The browser never receives Neo4j
credentials or arbitrary Cypher access, and external source or future local-model calls do not occur
inside ordinary knowledge requests. See [`ALCHEMY_BACKEND.md`](ALCHEMY_BACKEND.md).
