# Decision: Make mobile Current Flow a first-viewport instrument panel

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: Astrology presentation architecture and responsive product behavior

## Context

The Astrology route placed a large duplicate title, technical pillar reports, and vertically stacked
cards before its essential reading. On a phone, users had to scroll before they could see the full
temporal signature, active organ period, Hour hexagram, and One Line to Remember.

## Constraints and requirements

- Preserve `CurrentFlowProvider`, every existing calculation, and the app-level inspector.
- Make Day the featured temporal scale while preserving Year, Month, Hour, and Organ Hour.
- Keep exact bounds and source provenance accessible without putting debug reports in glance cards.
- Fit the default reading at 375 × 667 without clipping or disabling natural scrolling.
- Preserve safe areas, accessible targets, focus, large-text growth, light/dark themes, and desktop.

## Decision

Treat the top of the Astrology route as a dedicated `CurrentFlowGlance` instrument panel. On mobile,
it targets the dynamic viewport remaining below the app header and renders a 1:2:1 Year/Day/Month
row, a 1:1 Organ/Hour row, and a slim full-width OLTR band. Existing card components own typed
glance density variants and continue to consume the canonical snapshot.

Move full temporal and provider metadata into an immediately adjacent `Calculated From` disclosure.
The disclosure is the Organ Hour card's accessible detail destination; hexagram cards continue to
open the shared inspector.

## Rationale

The hierarchy communicates the current moment before methodology while preserving transparency one
interaction away. CSS Grid and a small height-aware variable system satisfy multiple phone sizes
without device-specific positioning or runtime measurement. Keeping density in existing cards
avoids a second calculation or interaction path.

## Consequences and tradeoffs

- The complete default mobile reading fits in the first viewport at the accepted test sizes.
- Technical metadata is no longer continuously visible on each card, but remains grouped and more
  readable in one disclosure.
- Mobile cards use deliberately compact typography and artwork; desktop uses the same hierarchy at a
  more spacious scale.
- Unusually long OLTR text and enlarged user text may extend beyond one viewport by design.

## Verification criteria

- Mobile DOM order and exact grid proportions match the documented contract.
- OLTR is fully visible at 375 × 667, 390 × 844, 393 × 852, and 430 × 932.
- There is no horizontal overflow or clipped card content.
- Card activation, inspector focus restoration, Organ Hour details, themes, reduced motion, and
  complete repository checks pass.

## Supersedes

None.

## Superseded by

None.

## Related files

- [`../../CURRENT_FLOW_GLANCE_LAYOUT.md`](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [`../../../src/components/astrology/CurrentFlowGlance.vue`](../../../src/components/astrology/CurrentFlowGlance.vue)
- [`../../../src/views/AstrologyView.vue`](../../../src/views/AstrologyView.vue)
