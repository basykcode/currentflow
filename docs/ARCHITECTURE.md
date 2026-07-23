# Architecture

Current is a client-side Vue 3 application organized around explicit domain boundaries.

## Layers

- `src/domain`: framework-independent contracts for astrology snapshots, authentication, and settings.
- `src/providers`: swappable adapters that satisfy domain interfaces. The alpha selects `DemoCurrentFlowProvider` in one place.
- `src/stores`: Pinia state reserved for cross-route preferences and the future identity scaffold.
- `src/components`: focused presentation grouped by product area or shared role.
- `src/views`: route composition and page-level data loading.
- `src/app/router.ts`: lazy route definitions.
- `src/assets/styles`: global tokens and baseline behavior.

The Astrology view requests a `CurrentFlowSnapshot` from a provider. It does not calculate calendrical facts or embed fixture data. Components render status and provenance supplied by the domain object.

## Runtime behavior

The alpha makes no network calls. Theme, timezone preference, and an optional location label are device-local. The demo provider is asynchronous so it can later be replaced by a deterministic local engine or API adapter without changing the view contract.

Route components are lazy-loaded. `App.vue` owns only the application frame and transition boundary; feature behavior remains in route views and focused components.
