# Decision: Gate Celestial Current on authoritative astronomy

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Home celestial instruments, astronomical integration, provenance, and unavailable behavior

## Context

The Celestial Current specification requires continuous lunar elongation and solar longitude from
an existing Global Conditions Engine. Repository, dependency, ref, and history inspection found no
such engine or equivalent astronomical fields. The active calendar provider owns Four Pillars,
solar-term month boundaries, and Shíchen state, but not the requested ephemeris values.

## Decision

Do not infer astronomical values from Chinese lunar date, categorical phase, browser month,
Gregorian month, or current Solar Term. Do not add an astronomy dependency until its methodology,
accuracy, licensing, event boundaries, and ownership are reviewed.

Stage the safe domain and presentation layer behind a typed `GlobalConditionsSnapshot` seam. Keep
the production `CurrentFlowGlance` unchanged until one authoritative adapter can populate that seam.
Development fixtures must remain explicitly non-production and reachable only through a
development route. Missing production data must render unavailable, never fixture-backed.

## Alternatives rejected

- Derive lunar phase from Chinese lunar day: conflates calendar classification with astronomical
  elongation and cannot supply continuous illumination or event precision.
- Approximate solar longitude from date or Solar Term label: fabricates continuous precision and can
  disagree at time-zone and event boundaries.
- Add an unreviewed second library: silently selects an ephemeris, time scale, license, and accuracy
  contract.
- Put fixture values on production Home: misrepresents demonstration data as calculated conditions.

## Consequences

Presenters, geometry, SVG instruments, accessibility, details, unavailable states, tests, and the
development gallery can proceed safely. The requested visible Home integration, live cadence,
selected-time source refresh, and production detail population remain blocked pending the source
decision in `docs/CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md`.

## Verification criteria

The staged layer must type-check, use no remote assets or new dependencies, reject inconsistent
Seasonal classifications, render unavailable without astronomy, remain absent from production
navigation, and pass the full repository gate. Production integration additionally requires
source golden fixtures, boundary/cadence tests, and the documented viewport matrix.
