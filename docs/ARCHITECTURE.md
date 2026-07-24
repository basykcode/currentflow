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

The alpha makes no runtime network calls. Theme, timezone preference, and an optional location label
are device-local. The active provider projects an instant into the selected timezone, delegates
GanZhi calculation to `lunar-javascript`, then applies pure domain lookups and transformations. The
view remains unaware of those calculation details.

Route components are lazy-loaded. `App.vue` owns only the application frame and transition boundary; feature behavior remains in route views and focused components.
