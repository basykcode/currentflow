# Decision: Balance five-card inner geometry

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Astrology glance labels, card alignment, and hexagram line weight

## Context

The two equal-height signature rows correctly align card exteriors, but Year and Month have less
content than Day. Their flex columns therefore left unused space after the bottom spectrum text.
The Organ Hour identity was left-aligned while its visual and quarter block were centered, weakening
the five-card composition. Hexagram bars also needed slightly more presence without reintroducing
the nonlinear fixed-pixel sizing that had made Day appear inconsistent.

## Decision

- Present the Organ Clock glance card as `Internal State`. Center that heading and the complete organ
  identity: English name, Chinese name, and two-hour range. Retain `Organ Hour` as the underlying
  domain and provenance term.
- Give every glance card the same four-sided responsive padding and grid contract: heading first,
  flexible visual stage in the middle, identity rows after it, and bottom-most text last.
- Wrap each temporal animal and glyph in one flexible `temporal-visuals` stage. Equal-row expansion
  occurs only there; the Gene Key spectrum remains anchored to the bottom content edge.
- Keep the Internal State time range as the last Organ Card row. Its flexible illustration and
  quarter stage absorbs remaining height.
- Increase hexagram line height from 30% to 36% of its proportional line row. Keep all geometry
  percentage-based so Year/Month, Day, and Hour retain linear scaling.

## Consequences

- Shorter card content no longer creates a blank tail below its final datum.
- The visible gap from border to heading equals the gap from final text to border at every responsive
  padding value.
- Internal State reads as one centered instrument rather than a left-label/right-image composite.
- Glyph bars are stronger while retaining identical color, spacing, and weight ratios.

## Related files

- [`../../CURRENT_FLOW_GLANCE_LAYOUT.md`](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [`../../../src/components/astrology/HexagramCard.vue`](../../../src/components/astrology/HexagramCard.vue)
- [`../../../src/components/astrology/HexagramGlyph.vue`](../../../src/components/astrology/HexagramGlyph.vue)
- [`../../../src/components/astrology/OrganCard.vue`](../../../src/components/astrology/OrganCard.vue)
