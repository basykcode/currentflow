# Decision: Preserve literal glance ratios at every width

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: Astrology home responsive geometry

## Context

The temporal-sandwich revision still used an approximate desktop center track
(`minmax(18rem, 1.36fr)`) and collapsed both principal rows to one column below 680 CSS pixels. In
the actual narrow in-app view, that made Year, Hour, Day, Month, Organ, Intention, and Execution
appear as a long single-card sequence. Jun specified literal percentages, not a desktop-only layout.

## Decision

Preserve these grid ratios at every viewport width:

- temporal row: Year `1fr` | Hour/Day center stack `2fr` | Month `1fr`, equivalent to
  25% / 50% / 25% before gaps;
- active row: Organ System `1fr` | Intention/Execution stack `1fr`, equivalent to 50% / 50% before
  the gap.

Remove the narrow-screen stacking breakpoint. All tracks retain `minmax(0, …)` so their contents
may wrap and increase row height without causing horizontal document overflow. Stable
`data-column-ratio` attributes make the intended contract explicit in focused tests and live
inspection.

## Consequences and tradeoffs

- The same compositional relationships remain visible on desktop, tablet, and mobile.
- Narrow Year and Month cards wrap more aggressively, and the 50% Guidance column makes the second
  row taller on small screens. This is intentional; literal geometry and complete content take
  priority over a shorter page.
- Touch targets, semantic order, complete text, and natural vertical scrolling remain intact.

## Verification criteria

- At a narrow in-app viewport, Year and Month have identical widths and the Hour/Day center stack is
  exactly twice either width, excluding equal grid gaps.
- Organ and Guidance have identical widths and heights.
- Intention and Execution remain vertically stacked at equal heights.
- No tested viewport has horizontal document overflow.
- Focused and full repository checks pass.

## Supersedes

[Balance the temporal sandwich and guidance pair](20260827T194311Z--balance-temporal-sandwich-and-guidance-pair.md)
only where it allowed the rows to stack at narrow mobile widths. Its two-row identities, vertical
Hour/Day and Intention/Execution stacks, and equal-height requirements remain accepted.

## Related files and documents

- [`../../CURRENT_FLOW_GLANCE_LAYOUT.md`](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../../src/components/astrology/PrincipalGlanceGrid.vue`](../../../src/components/astrology/PrincipalGlanceGrid.vue)
