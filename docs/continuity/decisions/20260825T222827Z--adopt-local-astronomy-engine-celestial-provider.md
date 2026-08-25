# Decision: Adopt the local Astronomy Engine celestial provider

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Celestial Current physical astronomy, traditional-calendar integration, production Home,
  runtime cadence, and deployment boundary

## Context

The staged Lunar and Solar Home instruments deliberately lacked a production source for continuous
Moon and Sun data. The prior gate rejected lunar-day phase guesses, Gregorian-month season guesses,
Vue astronomy, and an unreviewed remote service. The product now requires real local conditions,
selected-time synchronization, independent failure behavior, and no runtime astronomy network call.

## Decision

Pin `astronomy-engine` 2.1.19 (MIT) and isolate it behind the pure
`AstronomyEngineCelestialProvider`. Use it for Moon elongation/illumination/events and Sun
true-ecliptic-of-date longitude/Solar Term event searches. Keep the repository's existing
`lunar-javascript` 1.7.7 adapter as the sole traditional Chinese calendar authority on an explicit
`Asia/Shanghai` basis.

Combine those results in `LocalDeterministicCelestialCurrentProvider`; pass its typed source records
through the already reviewed presenters; and activate `CelestialCurrentHeader` in production
`CurrentFlowGlance`. Assign status `computed` until independent golden ephemeris fixtures are
accepted. Keep physical astronomy, calendar classification, Current semantic labels, and Current
visual mappings visibly distinct in methodology/details.

## Alternatives rejected

- A remote astronomy API: adds availability, privacy, credential, and hidden-network-call concerns.
- Deriving phase from lunar date or season/Branch from Gregorian month: fabricates astronomical
  precision and collapses separate authorities.
- Adding a second Chinese-calendar package named in the implementation brief: duplicates an
  authority already supplied by `lunar-javascript` and risks silently divergent calendar behavior.
- Keeping the production gate: no longer warranted once the reviewed local provider compiles and
  fails closed; independent fixture review controls status, not visibility.

## Consequences

The lazy Astrology route gains the local ephemeris bundle. There is no server/Worker copy and no
runtime astronomy request. Moon, Sun, and calendar failures are isolated; selected mode bypasses
caches and freezes one authoritative instant; live mode refreshes at bounded hour/day or exact event
boundaries. Narrow Jie timestamp differences between the physical and calendar libraries remain
explicit warnings and do not rewrite the Four Pillars authority.

## Verification criteria

The full repository check, production Vite build, browser-platform bundle probe, production Home
tests, real browser console inspection, responsive overlap checks, both themes, details behavior,
reduced-motion coverage, and historical gate resolution must pass.
