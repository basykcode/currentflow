# Decision: Layer zodiac-element art beneath temporal hexagrams

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Astrology glance presentation, static asset delivery, and responsive row sizing

## Context

The Year / Day / Month row consumed substantially more height than the Organ Hour / Hour row, leaving
large inactive areas inside the first three cards. The project owner supplied a complete set of 60
transparent animal-element illustrations and requested the image corresponding to each Temporal
Hexagram's stem-branch combination.

The source package is approximately 146 MB at 1254 × 1254 pixels, which is inappropriate for direct
delivery in a compact card interface. The canonical temporal snapshot already carries raw Ganzhi;
the art must not create another calendrical source or alter the hexagram mapping.

## Decision

- Resolve polarity, element, and zodiac animal through one pure `resolveGanZhiZodiac` domain helper
  shared with the existing Ganzhi description.
- Keep filename concerns in `ZodiacIllustration.vue`, including the received package's `sheep`
  filename for the domain's Goat branch.
- Publish web-sized 384 × 384 AVIF derivatives with transparency instead of the 1254px PNG sources.
- Render the art as a subdued decorative layer beneath the canonical SVG hexagram glyph. The visible
  Ganzhi remains the accessible identity.
- Give the temporal and active card rows equal-height tracks and stop stretching the mobile glance
  to the full remaining viewport. Desktop keeps matching 14-rem minimum row heights.

## Consequences

- All 60 valid Jiazi have one deterministic animal-element asset without changing calendrical or
  hexagram results.
- The browser loads only the four images used by the current snapshot, while the complete static set
  adds approximately 4.3 MB to the deployed project instead of approximately 146 MB.
- The supplied art remains visually secondary to the canonical glyph and cannot intercept card
  input.
- Calculation provenance remains unchanged; the art is a presentation derived from the displayed
  raw Ganzhi.
- The instrument panel becomes shorter, and calculation details may enter the initial viewport on
  taller phones. Natural page scrolling remains available.

## Related files

- [`../../ZODIAC_ART_ASSETS.md`](../../ZODIAC_ART_ASSETS.md)
- [`../../../src/domain/astrology/ganZhi.ts`](../../../src/domain/astrology/ganZhi.ts)
- [`../../../src/components/astrology/ZodiacIllustration.vue`](../../../src/components/astrology/ZodiacIllustration.vue)
- [`../../../src/components/astrology/HexagramCard.vue`](../../../src/components/astrology/HexagramCard.vue)
- [`../../../src/components/astrology/FiveElementComposition.vue`](../../../src/components/astrology/FiveElementComposition.vue)
