# Decision: Orient temporal hierarchy and formalize ke cultivation

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: Astrology glance hierarchy, glyph geometry, and Organ Hour quarter presentation
- Supersedes: the zodiac/glyph row order in
  `20260825T183341Z--separate-temporal-art-and-show-canonical-spectrum.md`

## Context

The separated zodiac and hexagram visuals were both visible, but their order opposed the card's
data hierarchy: stem-branch identity was at the top while its animal was below the hexagram. The Day
glyph also appeared bluer and differently spaced because the featured card supplied another color
and minimum pixel line thickness changed the apparent weight at different widths.

Compact Gene Key spectra sometimes wrap to multiple lines. The lowest line should hold Shadow while
the ordinary single-line reading order remains Shadow, Gift, Siddhi.

The Organ Hour card had a two-column layout that pushed its illustration off center and left unused
space. The owner requested the current Chu / Zheng / Ke interval and a cultivation-oriented English
meaning in that space. Historical clock identity is sourceable; an eight-step energetic meaning is
not an accepted received table and must not be presented as one.

## Decision

- Place the animal row before the hexagram row, matching the label and domain hierarchy.
- Give every glance glyph the same moonlit ink color and percentage geometry. Define compact width
  once; derive Day at `1.6 ×` and Hour at `1.25 ×`. Remove minimum pixel line thickness so all line
  thickness and spacing scale with the glyph.
- Keep Shadow / Gift / Siddhi DOM order for semantics and single-line display, but use reverse flex
  line stacking so Shadow occupies the lowest line when wrapping occurs.
- Extend the Organ Moment with an optional typed `ChuZhengKeMoment`. The live provider computes the
  exact 15-minute interval in civil time using the Shixian 96-ke convention.
- Center the Organ illustration and quarter block in one column. Show Chinese name, tone-marked
  pinyin, exact bounds, English timing meaning, and a short cultivation cue.
- Treat the eight cultivation phases as `Current Flow cultivation phase model v1` with
  `current-formalization` status. Keep its source label separate from the computed historical clock
  label in the calculation disclosure and provider notes.

## Consequences

- All four glance glyphs now differ only by a linear width multiplier; line color, weight ratio, and
  spacing are consistent.
- Wrapped compact spectra place Shadow visually lowest without changing screen-reader or single-line
  order.
- The Organ Hour uses its former blank area for a live quarter-scale cultivation cue while retaining
  the organ name and two-hour range as its lower anchor.
- Quarter boundaries update with the snapshot's existing one-minute refresh and use its selected
  timezone.
- The product does not misattribute Current's phase envelope to traditional Chinese clock sources.

## Sources and related files

- [National Astronomical Observatory of Japan · calendar time systems](https://eco.mtk.nao.ac.jp/koyomi/wiki/BBFEB9EF2FC4EABBFECBA1A4C8C9D4C4EABBFECBA1.html)
- [China Daily · brief history of the twelve double-hours](https://ent.chinadaily.com.cn/a/201907/26/WS5d3a5399a3106bab40a029b1.html)
- [`../../CALCULATION_SOURCES.md`](../../CALCULATION_SOURCES.md)
- [`../../../src/domain/astrology/organClock.ts`](../../../src/domain/astrology/organClock.ts)
- [`../../../src/components/astrology/OrganCard.vue`](../../../src/components/astrology/OrganCard.vue)
- [`../../../src/components/astrology/HexagramCard.vue`](../../../src/components/astrology/HexagramCard.vue)
- [`../../../src/components/astrology/HexagramGlyph.vue`](../../../src/components/astrology/HexagramGlyph.vue)
