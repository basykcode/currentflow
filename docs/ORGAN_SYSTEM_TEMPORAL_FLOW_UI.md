# Organ System temporal-flow UI

## Card hierarchy

The lower-left home card retains the existing Organ Hour domain and full-card details interaction,
but its glance label is `ORGAN SYSTEM`. Its visual hierarchy is:

1. Organ and element;
2. Earthly Branch and animal Shíchen;
3. Macro Hour (`初 Chū · Entering` or `正 Zhèng · Established`);
4. Micro Hour (`Phase 0–3` with its Kè label);
5. the complete Shíchen timeline;
6. the active two-hour civil range.

The paired Organ System and Hour Hexagram remain equal-width grid columns.

## Compact and detailed densities

`ShichenFlowTimeline` has `compact` and `detailed` densities. The compact home card shows three
major labels—`初`, `正`, and `NEXT`—and no explanatory paragraphs. The calculation disclosure uses
the detailed density, lists all eight Kè, names the next Branch, and shows model, time basis, exact
UTC bounds, warnings, and guidance-boundary behavior.

## Timeline structure

The original dependency-free SVG contains:

- three major nodes at 0, 60, and 120 basis minutes;
- six minor nodes at 15, 30, 45, 75, 90, and 105;
- eight individually rendered Kè segments;
- one continuous structural line;
- an active-segment difference in stroke width and fill/stroke geometry;
- one shared `CurrentTaijiMark` present marker.

The last node is `NEXT`, never `END`, because it represents transformation into the next Shíchen.
Timeline position remains internal; no percentage, elapsed/remaining minute, countdown, or seconds
are displayed.

## Taiji and motion

Repository inspection found no pre-existing Taiji SVG or asset; the existing wordmark is a distinct
two-wave Current line. `CurrentTaijiMark.vue` is therefore the one shared Taiji implementation and
uses the platform's standard Taiji glyph without a remote or third-party asset.

The marker target changes once per authoritative whole basis minute. Ordinary movement uses the
`--shichen-marker-transition-duration: 4s` restrained ease. Initial render starts at the correct
position. A `shichen-change` disables the long position transition so the marker does not sweep
backward from the prior Shíchen.

The Taiji rotates independently with `--shichen-taiji-rotation-duration: 90s`. It represents present
transformation, not loading or urgency. Under `prefers-reduced-motion: reduce`, both continuous
rotation and position interpolation stop; text, nodes, active segment, and marker remain.

## Clock cadence

`useShichenPhaseClock()` uses recursive `setTimeout` aligned to the next minute boundary. It
reprojects the authoritative instant after tab visibility resumes, emits only the highest-priority
missed event, and removes timers/listeners on unmount. A selected historical/simulated instant is
frozen: no live timer overwrites it, and phase remains static until that selected instant changes.

## Accessibility

The full-card button keeps a visible focus ring and minimum card-sized target. The redundant SVG
internals are hidden. One concise figure caption names the Organ System, animal Shíchen, Macro,
Micro, and next Shíchen. Chinese text always has adjacent English/pinyin context. There is no
per-minute live region; Micro passage does not repeatedly interrupt screen readers.

## Responsive behavior

The timeline uses a stable viewBox, responsive width, inset terminal nodes, and a clipped-safe HTML
marker overlay. Compact typography and art reduce further below 380px or 720px viewport height.
The document remains naturally scrollable rather than hiding content. Verification targets are
375×667, 390×844, 393×852, 430×932, tablet, and desktop.
