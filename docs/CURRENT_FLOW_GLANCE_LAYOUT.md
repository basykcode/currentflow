# Current Flow glance layout

## Product goal

The Astrology home opens as a compact instrument panel. Its leading flow communicates the section,
local time, Year/Day/Month temporal hexagrams, active Organ System, Hour hexagram, and complete
One Line to Remember in a stable order. Detail remains available through the existing hexagram
inspector and the adjacent calculation disclosure. The page scrolls naturally when distinct glyph,
animal, language, and spectrum rows exceed the current viewport.

## Component structure

Before this refactor, the route composed the page directly:

```text
App
├─ AppHeader
├─ AstrologyView
│  ├─ oversized route header
│  │  └─ YinClock
│  ├─ FiveElementComposition
│  │  ├─ HexagramCard × 4
│  │  │  └─ HexagramGlyph
│  │  └─ OrganCard
│  │     └─ OrganIllustration
│  └─ SynthesisPanel
│     └─ OLTR and deeper synthesis
└─ HexagramInspector
```

The route now keeps the same data and interaction boundaries while delegating the first viewport:

```text
App
├─ AppHeader
├─ AstrologyView
│  ├─ CurrentFlowGlance
│  │  ├─ compact section label
│  │  ├─ YinClock
│  │  ├─ FiveElementComposition
│  │  │  ├─ HexagramCard density variants × 4
│  │  │  │  ├─ GanZhi zodiac-element illustration
│  │  │  │  ├─ canonical HexagramGlyph
│  │  │  │  └─ canonical identity and Gene Key spectrum
│  │  │  └─ OrganCard glance variant
│  │  │     ├─ compact Organ/element and Branch/animal identity
│  │  │     ├─ computed Macro and observational Micro rows
│  │  │     └─ compact ShíchenFlowTimeline with shared Taiji marker
│  │  └─ CurrentFlowOltr
│  ├─ CalculationProvenanceDetails
│  └─ SynthesisPanel without its duplicate OLTR/provenance blocks
└─ HexagramInspector
```

`AstrologyView` still requests one canonical `CurrentFlowSnapshot` from `CurrentFlowProvider`.
Presentation components select fields from that snapshot; they do not calculate or remap them.

## Glance order contract

The mobile DOM and visual order is:

1. `The Current Flow` section heading and compact local clock.
2. Year / Day / Month.
3. Organ System / Hour hexagram.
4. One Line to Remember.

The temporal row uses `1fr 2fr 1fr`, making Day exactly half of the usable row width before gaps.
The active row uses two equal `minmax(0, 1fr)` tracks. Day uses the strongest border/surface and the
largest glyph. The two rows use equal-height tracks; the former oversized temporal row no longer
stretches the instrument panel to the full mobile viewport.

The page does not hide overflow, clamp the OLTR, or disable scrolling. The distinct visual and
identity rows, an unusually long sentence, or increased user text size may naturally extend the
document.

## Density variants

`HexagramCard` accepts four presentation densities:

- `glance-compact`: Year and Month.
- `glance-featured`: Day.
- `glance-regular`: Hour.
- `standard`: retained detailed-card presentation.

All densities receive the same `TemporalHexagram`, whose hexagram is a canonical
`HexagramReference`. The glance densities render scope, compact Ganzhi, canonical
`HexagramGlyph`, number, English title, Chinese title with tone-marked pinyin, and its curated Gene
Key Shadow / Gift / Siddhi vocabulary. Long titles and complete spectrum terms wrap naturally.

Each live Ganzhi also resolves to one of 60 user-supplied animal-element illustrations. The
web-sized transparent artwork occupies its own normal-flow row immediately before the canonical
glyph so the visual order mirrors the card's stem-branch identity above and hexagram identity below.
It is not a watermark and does not share or reduce the glyph's sizing box. The visible Ganzhi text
names only the element and animal because stem polarity is redundant in this compact label; the raw
stem-branch value and polarity remain available in the domain model and calculation details.
`OrganCard` similarly adds a `glance` density while reusing `OrganIllustration` and the canonical
`OrganMoment`.

All glance glyphs use the same color, aspect ratio, trigram gap, line gap, and percentage-based line
thickness. Line bars occupy 36% of their proportional row, giving every figure a slightly stronger
weight without introducing fixed pixel thickness. Only width changes: Day is exactly 1.6 times the
compact Year/Month width and Hour is exactly 1.25 times that width. This keeps the complete geometry
proportional instead of allowing minimum pixel thicknesses to make smaller figures appear heavier.

The Gene Key terms retain the canonical Shadow / Gift / Siddhi document order. The flex lines wrap
in the reverse cross-axis direction, so a multi-line compact card places Shadow on its lowest line
while a card with enough width keeps all three terms in their ordinary single-line order.

## Organ System temporal flow

The home label is `ORGAN SYSTEM`; the underlying Organ Hour domain remains unchanged. One centered
column presents Organ/element, Macro Hour, Micro Hour, the compact complete-Shíchen timeline, and the
two-hour range. The redundant Branch/animal Hour line remains available in the adjacent Hour card
and is not repeated here. The timeline has three major nodes, six minor nodes, eight Kè segments,
and a slowly rotating Taiji present marker. Its final node is `次` (_cì_, next).

Chū / Entering and Zhèng / Established are subordinate guidance maturity. Micro Hour follows the
same Chinese → Pinyin → English-product-label order: for example, `初刻 Chū Kè · Phase 0`. Phase 0–3
and the Kè labels are observational. No independent Micro interpretation is displayed. The detailed timeline,
96-kè methodology, local-civil basis, exact UTC bounds, warnings, and semantic-boundary explanation
remain visible in `Calculated From`.

## Technical metadata and provenance

Exact bounds, full pillar labels, calculation status, source/library and mapping labels, organ
source, provider version, factors, day-boundary convention, and calculation limits do not render
inside glance cards. They remain available immediately below the first viewport in the
`Calculated From` disclosure. Selecting Organ System opens and focuses that disclosure.

Hexagram cards continue to open the single app-level `HexagramInspector`; no modal or selection
state is duplicated.

## Responsive strategy

- Mobile allows the instrument panel to take its content height instead of stretching cards to fill
  the remaining dynamic viewport.
- The app-header total combines its accessible content height with `env(safe-area-inset-top)`.
- The glance bottom padding includes `env(safe-area-inset-bottom)`.
- Grid children use `min-width: 0` and `min-height: 0` so tracks can shrink without overflow.
- Every glance card uses the same responsive padding on all four sides. Its heading is the first
  grid row, its bottom-most text is the final grid row, and all expandable height is isolated in the
  middle visual stage. This keeps the visible top and bottom gaps equal even when equal-height rows
  stretch a card with shorter content.
- Shared custom properties control gaps, padding, radii, glyph sizes, metadata, titles, organ art,
  and OLTR type.
- Mobile heights at or below 720 CSS pixels use one compact-height rule set with modestly smaller
  spacing and artwork.
- Tablet and desktop preserve the same hierarchy and exact column proportions, with matching
  14-rem minimum row heights and the existing maximum page width. They are not forced into one
  viewport.

## Clock and header

The clock presents `HH:mm:ss` as three independently keyed sections. Seconds target regular
four-second wall-clock boundaries. Each change begins a 1.5-second dissolve before its target and
finishes at the boundary; minute and hour sections join the same dissolve only when their values
change. The two blue colons never transition, providing stable visual anchors. A visibility resume
resynchronizes to wall-clock time. The clock has no live region, so updates do not continuously
interrupt assistive technology.

The mobile app-header content remains 64 CSS pixels high and its menu target remains at least 44 by
44 CSS pixels. Its sticky navigation and safe-area padding are unchanged in behavior.

## Production celestial header

`CelestialCurrentHeader` is active in production `CurrentFlowGlance`. It uses the same heading and
`YinClock` in the middle, with clickable Lunar Current and Solar Current clusters in shrink-safe
outer columns. At every width the Moon ring sits outward-left with its four semantic values to the
right, while the Sun ring sits outward-right with its four values to the left. Compact-height rules
reduce ring size and collapse only nonessential metadata. The clock presents the selected timezone
as its derived GMT offset; the IANA identifier remains available in the metadata title.

The physical calculations come from the local pinned ephemeris provider and share one instant with
the existing temporal snapshot and clock. The development-only `/__dev/celestial-instruments` route
remains available for fixture-based responsive composition review, but does not feed production.
See
[`CELESTIAL_CURRENT_INSTRUMENTS.md`](CELESTIAL_CURRENT_INSTRUMENTS.md).

## Accessibility

- `The Current Flow` is the route's level-one heading; glance cards retain subordinate headings.
- Every card has a full-card native button target with an explicit accessible name.
- Enter and Space activate temporal cards and Organ System; focus returns to the triggering temporal
  card after the inspector closes.
- Existing global focus rings, reduced-motion handling, and theme contrast remain active.
- Hexagram glyphs keep their line-by-line accessible descriptions.
- Decorative zodiac art remains hidden from assistive technology because the adjacent Ganzhi label
  already names the element and animal.
- Each frequency-band icon has an adjacent visually hidden Shadow, Gift, or Siddhi label; meaning
  is never conveyed by the geometric mark or blue shade alone.
- Clock changes have no `aria-live` announcement. The timeline has one concise Organ/Shíchen/Macro/
  Micro/next summary and hides redundant SVG internals.
- Reduced motion disables Taiji rotation and marker interpolation while preserving state.
- Default text size targets first-viewport fit; larger text is allowed to grow and scroll naturally.

## Verification viewports

The required default-text mobile viewports are:

- 375 × 667
- 390 × 844
- 393 × 852
- 430 × 932

At each size, verify that the document and cards have no horizontal overflow, the canonical glyph
retains its configured geometry below a separate visible animal row, all glyphs share color and
proportional line spacing, Day remains twice the card width of Year/Month, and Organ/Hour card widths
are equal. Also inspect the compact timeline and unclipped marker, a tablet and desktop, both
themes, a long timezone, long canonical titles and spectrum terms, keyboard activation, focus
visibility, and the calculation disclosure.

In development, `/?text-scale=large` raises the root font size to 150% so natural-scroll and
non-clipping behavior can be inspected without changing a browser or operating-system preference.
The fixture is guarded by `import.meta.env.DEV` and is absent from production behavior.

Celestial instrument review adds tablet, laptop, and wide-desktop inspection plus the same mobile
matrix, both themes, 150% text, reduced motion, whole-cluster focus, and the shared details shell.
The gallery is development-only and makes no remote asset requests; the production instruments
also make zero runtime astronomy requests.
