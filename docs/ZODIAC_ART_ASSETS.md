# Temporal zodiac art assets

## Runtime purpose

The Astrology glance places one decorative animal-element illustration in a separate row
immediately above each live temporal hexagram glyph. This mirrors the card's data hierarchy: the
stem-branch label and its animal-element identity are above, while hexagram identity is below. The selected image is a presentation of the
canonical `ganZhiRaw` already supplied by `CurrentFlowProvider`; it does not participate in the
calendrical or hexagram calculation.

`resolveGanZhiZodiac` maps the ten Heavenly Stems to Wood, Fire, Earth, Metal, or Water and the
twelve Earthly Branches to their zodiac animal. The 60 valid Jiazi resolve to 60 distinct
animal-element pairs. The received 未 artwork uses the source folder name `sheep`; the domain keeps
the existing English label `Goat` and only the asset adapter translates `goat` to `sheep`.

## Supplied and published files

- Received package: 60 user-supplied transparent PNGs, 1254 × 1254 pixels, organized as
  `<animal>/<animal>_<element>.png`.
- Runtime package: 60 transparent 384 × 384 AVIF files under `public/media/zodiac`, using the same
  animal/element organization and names.
- Conversion: macOS ImageIO (`sips`), AVIF quality 75, aspect ratio and alpha preserved.
- Runtime footprint: approximately 4.3 MB for the complete set, reduced from approximately 146 MB
  for the received PNG package.

The received package remains outside the repository and is not modified. The project owner supplied
the art for inclusion in this feature; no separate upstream creator or license metadata was
provided. Do not infer a broader redistribution license from its presence in this repository.

## Presentation and accessibility

`ZodiacIllustration.vue` owns the filename boundary. Artwork uses partial opacity and restrained
saturation in its own normal-flow row; it neither overlays nor changes the canonical SVG glyph's
sizing box. It has no pointer behavior and is hidden from assistive technology because the adjacent
visible Ganzhi text already names the element and animal. If `ganZhiRaw` is unavailable, the card
remains complete without decorative art rather than guessing from another field.

The compact Ganzhi label deliberately omits the redundant Yin/Yang word. This is presentation-only:
`resolveGanZhiZodiac` continues to return the stem polarity as part of its typed domain identity.

## Gene Key frequency marks

`GeneKeyFrequencyIcon.vue` draws compact, theme-colored SVG equivalents of the three geometric
frequency-band marks shown in the official Gene Keys profile guide: downward triangle for Shadow,
upward triangle for Gift, and a six-pointed Siddhi emblem. The SVGs are implemented locally rather
than copying the source banners. Visible vocabulary comes from the canonical curated hexagram
registry, and visually hidden band names ensure that icon geometry and color are never the only
labels.

Reference: [Gene Keys · How to read your profile](https://teachings.genekeys.com/how-to-read-your-profile/).
