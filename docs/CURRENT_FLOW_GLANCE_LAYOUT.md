# Current Flow glance layout

## Product goal

The Astrology home opens as a compact instrument panel for a Western audience. A brief look leads
with the celestial clock, complete One Line to Remember, four temporal hexagrams, active Organ
System, and validated Intention and Execution. Year and Month visibly flank a central Hour/Day
stack, while a balanced lower tier pairs Organ with Guidance. The default narrow first-glance
composition fits the app viewport without suppressing natural scrolling or large-text expansion.
Detail remains available through the existing hexagram inspector and calculation disclosure.

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
│  │  ├─ CelestialCurrentHeader
│  │  │  └─ YinClock
│  │  ├─ CurrentFlowOltr
│  │  └─ PrincipalGlanceGrid
│  │     ├─ temporal sandwich
│  │     │  ├─ HexagramCard Year
│  │     │  ├─ Hour / Day vertical center stack
│  │     │  └─ HexagramCard Month
│  │     └─ equal active/guidance split
│  │        ├─ OrganCard glance variant
│  │        │  ├─ computed Macro and observational Micro rows
│  │        │  └─ compact ShichenFlowTimeline with shared Taiji marker
│  │        └─ GuidanceOutputPanel glance variant
│  │           ├─ controlled ranked intentions
│  │           └─ up to three validated executions
│  ├─ CalculationProvenanceDetails
│  └─ SynthesisPanel depth-only related/future content
└─ HexagramInspector
```

`AstrologyView` still requests one canonical `CurrentFlowSnapshot` from `CurrentFlowProvider`.
Presentation components select fields from that snapshot; they do not calculate or remap them.

## Glance order contract

The DOM order starts with the celestial header, then the full-width `OLTR · One Line To Remember`
band and principal instrument. The desktop instrument has two explicit rows:

1. The temporal row uses Year | Hour above Day | Month. Year and Month have equal widths and equal
   heights; each spans the complete height of the central Hour/Day stack.
2. The active/guidance row uses two equal-width columns. Organ System occupies the left 50%; the
   right 50% stacks Intention above Execution. The Organ card and complete Guidance stack have equal
   outer heights. Intention takes only the height needed by its compact choices; Execution fills the
   remainder and shares the lower edge of the row with Organ System.

The `1fr 2fr 1fr` and `1fr 1fr` ratios remain literal at narrow mobile widths; the rows do not
collapse to single-column cards. The default text-size treatment compacts the celestial heading,
clock, OLTR, and Guidance projection so the complete principal instrument fits the reviewed narrow
viewport. The page does not hide overflow, truncate the OLTR, or disable scrolling. An unusually
long sentence or increased user text size may naturally extend the document.

## Density variants

`HexagramCard` accepts four presentation densities:

- `glance-compact`: Year and Month in the outer temporal columns.
- `glance-featured`: Hour in the principal instrument.
- `glance-regular`: Day in the principal instrument.
- `standard`: retained detailed-card presentation.

All densities receive the same `TemporalHexagram`, whose hexagram is a canonical
`HexagramReference`. The glance densities render scope, compact Ganzhi, canonical
`HexagramGlyph`, number, English title, Chinese title with tone-marked pinyin, and its curated Gene
Key Shadow / Gift / Siddhi vocabulary. Long titles and complete spectrum terms wrap naturally.

Each live Ganzhi also resolves to one of 60 user-supplied animal-element illustrations. Every compact
animal label sits directly beneath its temporal scope. Hour and Day place the illustration beside
the canonical glyph in a compact horizontal row. Year and Month retain the earlier stacked
illustration-then-glyph composition in their taller outer cards.
The visible Ganzhi text names only the element and animal because stem polarity is redundant in
this compact label; the raw stem-branch value and polarity remain available in the domain model and
calculation details.
`OrganCard` similarly adds a `glance` density while reusing `OrganIllustration` and the canonical
`OrganMoment`.

All glance glyphs use the same color, aspect ratio, trigram gap, line gap, and percentage-based line
thickness. Their widths vary by density while the geometry remains proportional. Hour uses the
largest current-priority size, Day uses the regular size, and secondary Year/Month use the compact
size. Year and Month remain compact in glyph width while their cards stretch to match the central
stack.

## Guidance projection

The principal instrument consumes the existing validated `GuidanceBundle`; it does not resolve
semantics in Vue. The Intention panel shows every ranked controlled term supplied by the bundle, up
to the domain maximum of three. Each option is one compact row with its Chinese character above
tone-marked Pinyin at left and its English title at right. The selected definition is intentionally
omitted from first glance and remains available in the full Guidance presentation. Choosing an
alternative still delegates to the pure domain reselection function. When the domain supplies only
one compatible intention, the glance shows one; presentation never invents filler terms.

Execution shows the first three validated ranked selections supplied by the bundle, or fewer when
the domain has fewer valid actions. First glance keeps the category and bounded action visible. Its
accessible group name and hover title preserve the observable completion endpoint and highest-ranked
rationale without making the narrow card excessively tall. The presentation never creates a third
action to fill the grid. An unavailable bundle produces separate explicit unavailable states for
Intention and Execution and no controls or recommendations. Primary Current status remains in the
deeper provenance presentation rather than occupying the lower edge of the glance grid.

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

- Desktop and tablet widths preserve the Year | Hour/Day | Month temporal sandwich followed by the
  50/50 Organ/Guidance tier. Track dimensions come from content rather than a forced viewport
  height.
- Mobile preserves both literal rows. Compact default typography and content projection target the
  complete first-glance instrument in the reviewed viewport without fixed heights or clipping.
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
- Narrow mobile preserves both ratios and lets card content increase row height when wrapping is
  required. Increased text size is allowed to expand the page and preserve natural scrolling.

## Clock and header

The clock presents `HH:mm:ss` as three independently keyed sections. Seconds target regular
four-second wall-clock boundaries. Each regular seconds change spends the full four-second interval
dissolving toward its target, lands at the boundary, and hands immediately to the next dissolve;
these cycles are contiguous and never overlap. Minute and hour sections remain static until their
values change, then use the same four-second dissolve. A first render or visibility resume joins the
current dissolve at its already-elapsed phase while retaining the canonical four-second duration, so
the next target still lands on time. The two blue colons never transition, providing stable visual
anchors. The clock has no live region, so updates do not continuously interrupt assistive technology.

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

At each size, verify that the document and cards have no horizontal overflow, the horizontal
animal/Ganzhi and glyph row remains legible, all glyphs share color and proportional line spacing,
and both percentage rows remain intact. At the 412 × 790 in-app review size, verify the principal
instrument ends within the viewport at default text size. Also inspect the compact timeline and unclipped marker,
tablet and desktop layouts, both themes, a long timezone, long canonical titles and spectrum terms,
keyboard activation, focus visibility, and the calculation disclosure. Desktop checks include
1280 × 720, 1366 × 768, and 1440 × 900. At every width verify 25/50/25 temporal columns, 50/50
Organ/Guidance columns, equal outer temporal heights, equal Organ/Guidance heights, and the compact
Intention plus remainder-filling Execution stack.

In development, `/?text-scale=large` raises the root font size to 150% so natural-scroll and
non-clipping behavior can be inspected without changing a browser or operating-system preference.
The fixture is guarded by `import.meta.env.DEV` and is absent from production behavior.

Celestial instrument review adds tablet, laptop, and wide-desktop inspection plus the same mobile
matrix, both themes, 150% text, reduced motion, whole-cluster focus, and the shared details shell.
The gallery is development-only and makes no remote asset requests; the production instruments
also make zero runtime astronomy requests.
