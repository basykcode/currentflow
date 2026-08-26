# Celestial Current instruments

## Product purpose

Celestial Current turns the Home heading into a quiet orientation instrument: Lunar Current at the
upper left, `The Current Flow` and its segmented clock in the center, and Solar Current at the upper
right. It answers only where each cycle is and what kind of movement is occurring. Technical
astronomy, calendar mechanics, and provenance belong in details.

Production Home is active. A local combined provider supplies pinned physical astronomy and the
existing traditional Chinese calendar classification to the staged presenters. The development
gallery remains a fixture-only visual review surface and is not a production data source.

## Conceptual symmetry

| Lunar Current              | Solar Current                                 |
| -------------------------- | --------------------------------------------- |
| Astronomically phased Moon | Complete static Sun                           |
| Six Cantong qi sectors     | Twelve Branch-month sectors and 24 ticks      |
| Continuous lunation marker | Continuous annual marker                      |
| Traditional lunar node     | Chinese-defined season and current Solar Term |
| Monthly Yin/Yang movement  | Annual Yin/Yang movement                      |

The underlying sequences are traditional classifications. The concentric ring layout, marker
placement, and visual styling are Current Flow product formalizations; they are not presented as a
surviving historical diagram.

## Data-source boundary

`CelestialCurrentSnapshot` is the production aggregate and its `GlobalConditionsSnapshot` is the
presenter seam. `presentLunarHomeInstrument` and
`presentSolarHomeInstrument` project reviewed source fields into Home view models. They fail closed
when astronomy is absent, preserve source methodology and warnings, and reject inconsistent Solar
season or Branch values rather than silently choosing one.

`AstronomyEngineCelestialProvider` uses local `astronomy-engine` 2.1.19 for physical Moon/Sun
conditions and exact event searches. `calculateChineseLunarCalendar` uses the existing
`lunar-javascript` 1.7.7 authority after projecting the same instant into `Asia/Shanghai`. See
[`CELESTIAL_EPHEMERIS_PROVIDER.md`](CELESTIAL_EPHEMERIS_PROVIDER.md).

Vue owns display only. It does not derive phase from Chinese lunar day, season from browser month,
Branch from Gregorian month, or Yin/Yang movement from marker angle. Development fixtures carry
explicit `development-fixture:not-production-*` methodology identifiers.

## Home information contract

Each whole cluster is one button and displays four compact values.

- Moon: astronomical phase; the current Cantong qi period's date bounds; Cantong qi
  character/Pinyin/gloss; lunar Yin/Yang movement.
- Sun: Chinese season; the current Solar Term's date bounds; Solar Term
  character/Pinyin/contextual English; annual Yin/Yang movement.

Compact date bounds are formatted in the selected display timezone. Their title and accessible name
carry the exact start and exclusive-end time with the correct GMT offset at each boundary. The
standalone active-Branch badge is deactivated on Home pending product and source review; the sourced
Branch state remains represented by the ring, cross-checked by the presenter, and disclosed in
details. The celestial instrument values do not expose percentages, degrees, numerical progress,
countdowns, or elapsed/remaining time. The central clock separately presents anchored hours,
minutes, and four-second-cadence seconds. Each seconds target dissolves for the full cadence and
hands directly to the next target without overlapping cycles; unchanged hour and minute segments
stay still.

## Layout and visual hierarchy

`CelestialCurrentHeader` uses a three-column CSS Grid (`moon center sun`). It never uses
viewport-level absolute positioning. Celestial body, Taiji marker, four values, and ring characters
form the visual hierarchy in that order. Both bodies and their textures are local SVG; there are no
remote assets or runtime image requests.

Marker position and marker self-rotation are separate transform layers. The ring never rotates.
Ordinary target changes use a shortest-path unwrapped angle; selected or simulated time jumps can
disable interpolation. The first render starts at the supplied target without sweeping from zero.

`CurrentFlowGlance` renders this header in production. Its temporal snapshot, celestial snapshot,
segmented clock, and selected-time presentation carry the same normalized instant.

## Interaction and details

The Moon and Sun clusters emit typed requests for `lunar-current` and `seasonal-current` details.
`CelestialCurrentDetails` is the lightweight common shell required because the repository has no
reusable Lunar/Seasonal details surface. It separates astronomical calculation, Chinese calendar
classification, Current Flow semantic gloss, and Current Flow visual mapping. Exact angles and
fractions, searched event times, calendar date, provider version, and methodology may appear there,
never on Home.

## Responsive strategy

Every supported width aligns the Moon ring outward-left with its text to the right and the Sun ring
outward-right with its text to the left. Lunar rows share a left edge; Solar rows and every wrapped
Solar subline share a right edge. The Yin/Yang movement row is unbreakable and scales against its
available text column so even the longest reviewed state remains on one line at the 320 CSS pixel
minimum. The same inward-reading arrangement remains horizontal in the compact three-column header
below 768 CSS pixels. At short mobile heights, ring diameter and gaps reduce modestly and
nonessential metadata may compact. Other text is not clamped; large text may cause natural page
scrolling. Safe-area behavior remains owned by the existing page and app frame.

## Unavailable states

- Missing Moon astronomy: neutral Moon, `Lunar data unavailable`, no marker, details/retry affordance.
- Missing Cantong qi: astronomical Moon remains, node says unavailable, and no movement is invented.
- Missing Seasonal Current: neutral complete Sun and ring, `Seasonal data unavailable`, no marker.
- Missing Branch: no Gregorian-month guess.

The title and clock remain functional when either instrument is unavailable.

## Live and selected-time behavior

Live Home calculates on initial load and refreshes Lunar presentation no later than the next hour or
major lunar event, and Solar presentation no later than the next `Asia/Shanghai` midnight or exact
Solar Term. Small bounded caches retain event brackets and view models only until those boundaries.
Visibility resume is handled by the shared live scheduler.

Selected/simulated mode calculates immediately from the selected instant, bypasses presentation
caches, freezes the clock at that instant, and suppresses marker interpolation. Neither mode makes
an astronomy network request.

## Methodology registry

- `home-celestial-instruments:v1`
- `moon-ring:cantongqi-six-sector-v1`
- `sun-ring:branch-month-24-tick-v1`
- `solar-term-display-labels:current-en-v1`
- `chinese-solar-season-boundaries:v1`
- `moon-home-cantongqi-labels:v1`
- `moon-home-yinyang-movement:v1`
- `celestial-marker-geometry:top-clockwise-v1`
- `celestial-ephemeris:astronomy-engine-v1`
- `chinese-lunar-date:lunar-javascript-asia-shanghai-v1`
- `celestial-current-snapshot:v1`
