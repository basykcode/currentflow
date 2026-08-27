# Decision: Balance the temporal sandwich and guidance pair

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: Astrology home information architecture and responsive card geometry

## Context

The first principal-grid revision moved Year and Month into a secondary disclosure and arranged
Organ, Hour/Day, and Guidance as three desktop columns. Jun clarified that Year and Month must
remain in the primary composition and that the instrument has two distinct balanced rows.

## Decision

The principal instrument uses:

1. A temporal sandwich: Year on the left, Hour above Day in the center, and Month on the right.
   Year and Month use equal outer widths and stretch to the exact combined height of the Hour/Day
   stack.
2. An active/guidance pair: Organ System occupies the left 50% and the complete Intention over
   Execution stack occupies the right 50%. The two outer columns have equal heights, and Intention
   and Execution use equal-height rows.

Year and Month retain their compact card density and earlier stacked zodiac-then-glyph
presentation. Hour and Day retain the more compact horizontal zodiac/GanZhi and glyph presentation.
Narrow mobile widths stack both rows naturally rather than reducing touch targets or clipping text.

## Rationale

This composition preserves all four temporal scales in the immediate instrument and makes their
relationship visually legible: broader Year and Month conditions surround the vertically ordered
immediate Hour and Day. The separate equal 50/50 row gives Organ and validated Guidance equivalent
structural weight without changing their domain authority.

## Consequences and tradeoffs

- Year and Month no longer require a disclosure action and continue to open the shared inspector.
- The complete instrument intentionally scrolls on shorter desktop and mobile viewports; equality
  and readable content take priority over compressing every card into one screen.
- The compact `TemporalContextDetails` component introduced by the superseded revision is removed.
- Guidance remains a projection of domain-supplied output and still renders fewer than three items
  when fewer validate.

## Verification criteria

- Year and Month have equal widths and heights, and both equal the complete center-stack height.
- Organ and Guidance have equal 50% widths and equal outer heights.
- Intention and Execution remain vertically stacked with equal panel heights at desktop and tablet
  widths.
- Mobile has no horizontal overflow and preserves natural scrolling.
- Existing card/inspector interactions and Guidance available/unavailable tests remain green.

## Supersedes

[Adopt a principal desktop glance instrument](20260827T191623Z--adopt-principal-desktop-glance-instrument.md)
only where it placed Year/Month in secondary depth and used Organ / Hour+Day / Guidance as three
columns. Its OLTR placement, horizontal Hour/Day presentation, focused component boundary, and
Guidance projection remain accepted.

## Related files and documents

- [`../../CURRENT_FLOW_GLANCE_LAYOUT.md`](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../../src/components/astrology/PrincipalGlanceGrid.vue`](../../../src/components/astrology/PrincipalGlanceGrid.vue)
