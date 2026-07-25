# Architecture

Current is a client-side Vue 3 application organized around explicit domain boundaries.

## Layers

- `src/domain`: framework-independent contracts for astrology snapshots, authentication, and settings.
- `src/providers`: swappable adapters that satisfy domain interfaces. The alpha selects
  `LunarScriptCurrentFlowProvider` in one place and retains the demo adapter only as a testable
  fixture.
- `src/stores`: Pinia state reserved for cross-route preferences and the future identity scaffold.
- `src/components`: focused presentation grouped by product area or shared role.
- `src/views`: route composition and page-level data loading.
- `src/app/router.ts`: lazy route definitions.
- `src/assets/styles`: global tokens and baseline behavior.

The Astrology view requests a `CurrentFlowSnapshot` from a provider. It does not calculate calendrical facts or embed fixture data. Components render status and provenance supplied by the domain object.

## Runtime behavior

The default demo build makes no runtime network calls. Theme, timezone preference, and an optional
location label are device-local. The active Astrology provider projects an instant into the selected
timezone, delegates GanZhi calculation to `lunar-javascript`, then applies pure domain lookups and
transformations. A production build can independently select the documented Alchemy HTTP provider;
the Astrology view remains unaware of either integration.

Route components are lazy-loaded. `App.vue` owns only the application frame and transition boundary; feature behavior remains in route views and focused components.

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
