# Decision: Adopt a segmented four-second clock dissolve

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Current Flow Home clock timing, motion, responsive layout, and accessibility

## Context

The prior Celestial Current staging task reduced the Home clock to minute precision to match that
specification's original no-seconds boundary. Jun subsequently clarified the intended product clock:
hours, minutes, and seconds remain visible; seconds advance on a restrained four-second cadence; and
each value dissolves into place without destabilizing the separators.

## Decision

Render `HH:mm:ss` as three independently keyed sections. Keep both colon characters outside those
keys and color them with the existing blue `--jade` token.

Target wall-clock seconds at four-second boundaries. Begin each value change 1.5 seconds before its
target boundary so the dissolve lands at the represented instant. At minute or hour boundaries,
only the sections whose values change join the same transition. The clock remains non-live for
assistive technology, resynchronizes after visibility or delayed-timer recovery, and disables the
dissolve under reduced-motion preference.

## Alternatives rejected

- Dissolve the entire time string: makes unchanged hours/minutes and the colon anchors flicker on
  every second update.
- Update seconds every second: adds urgency and motion contrary to the Current Flow cadence.
- Keep minute-only precision: contradicts the clarified product requirement.
- Animate the colons: removes the fixed anchors that make independent section changes legible.

## Consequences

The clock is wider than its minute-only predecessor. `CelestialCurrentHeader` therefore applies a
smaller clock size within its mobile three-column composition; the ordinary Home header retains the
larger clock. All required responsive widths remain overlap-free. Unit tests assert timing,
section/colon identity, hour rollover, delayed resynchronization, and accessible structure.

## Verification criteria

The full repository check, live four-second transition inspection, console inspection, and the
375×667 through wide-desktop celestial viewport matrix must pass. A normal second update must create
two visual layers only in the seconds section while the hours, minutes, and colon nodes remain
identical.
