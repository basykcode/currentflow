# Decision: Separate temporal art and show canonical hexagram spectrum

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Temporal Hexagram contract and Astrology glance identity presentation
- Supersedes: the visual-layering portion of
  `20260825T181930Z--layer-zodiac-art-beneath-temporal-hexagrams.md`

## Context

The first zodiac-art implementation absolutely layered the animal image and canonical hexagram
inside one percentage-sized wrapper. That wrapper had no independent width, which collapsed the
hexagram diagram and left the animal artwork microscopic. The requested hierarchy is instead the
original canonical glyph, then a clearly visible but slightly transparent animal image beneath it.

The same card also needs tone-marked pinyin and the correct Gene Key Shadow, Gift, and Siddhi terms.
Those values already belong to the canonical `HexagramReference`; presentation must not reproduce
or infer a second identity table. The compact stem-branch label no longer needs its explicit
Yin/Yang word because the polarity is already encoded by the Heavenly Stem.

## Decision

- Require `TemporalHexagram.hexagram` to be a canonical `HexagramReference` rather than the smaller
  base `Hexagram`. Both live and demo providers resolve temporal values through the same registry.
- Render `HexagramGlyph` directly in its established sizing row. Render `ZodiacIllustration` in the
  next normal-flow row with visible partial opacity; never overlay the two assets.
- Keep polarity in `GanZhiZodiac`, but make `describeGanZhi` display only the raw Ganzhi, element,
  and animal. The calculation and typed identity lose no fact.
- Display Chinese identity as `characters ~ tone-marked pinyin` from `HexagramReference`.
- Display the canonical Gene Key Shadow, Gift, and Siddhi terms below the language line. Use local
  SVG equivalents of the official frequency-band marks, plus visually hidden text labels, so the
  icons are accessible and remain within the blue product palette.

## Consequences

- The glyph can no longer collapse because of a shrink-to-fit overlay wrapper.
- Animal art is large enough to read as an illustration and remains a decorative presentation of
  the already-calculated Ganzhi.
- Temporal cards gain height to accommodate two distinct visual rows and the spectrum. The two
  signature rows remain equal-height and natural scrolling remains available.
- Pinyin and Gene Key terms preserve one canonical source and its existing provenance.
- The demo provider now exercises the complete reference boundary instead of maintaining partial
  hand-authored hexagram fixtures.

## Sources and related files

- [Gene Keys · How to read your profile](https://teachings.genekeys.com/how-to-read-your-profile/)
- [`../../ZODIAC_ART_ASSETS.md`](../../ZODIAC_ART_ASSETS.md)
- [`../../../src/domain/astrology/types.ts`](../../../src/domain/astrology/types.ts)
- [`../../../src/domain/astrology/ganZhi.ts`](../../../src/domain/astrology/ganZhi.ts)
- [`../../../src/components/astrology/HexagramCard.vue`](../../../src/components/astrology/HexagramCard.vue)
- [`../../../src/components/astrology/GeneKeyFrequencyIcon.vue`](../../../src/components/astrology/GeneKeyFrequencyIcon.vue)
