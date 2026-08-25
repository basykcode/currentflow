# Celestial Current instruments

## Product purpose

Celestial Current turns the Home heading into a quiet orientation instrument: Lunar Current at the
upper left, `The Current Flow` and its minute clock in the center, and Solar Current at the upper
right. It answers only where each cycle is and what kind of movement is occurring. Technical
astronomy, calendar mechanics, and provenance belong in details.

Production wiring is currently gated by the missing authoritative Global Conditions source. The
components, view models, unavailable states, and development gallery are implemented without
inventing that source.

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

`GlobalConditionsSnapshot` is the required upstream seam. `presentLunarHomeInstrument` and
`presentSolarHomeInstrument` project reviewed source fields into Home view models. They fail closed
when astronomy is absent, preserve source methodology and warnings, and reject inconsistent Solar
season or Branch values rather than silently choosing one.

Vue owns display only. It does not derive phase from Chinese lunar day, season from browser month,
Branch from Gregorian month, or Yin/Yang movement from marker angle. Development fixtures carry
explicit `development-fixture:not-production-*` methodology identifiers.

## Home information contract

Each whole cluster is one button and displays exactly three primary values.

- Moon: astronomical phase; Cantong qi character/Pinyin/gloss; lunar Yin/Yang movement.
- Sun: Chinese season; Solar Term character/Pinyin/contextual English; annual Yin/Yang movement.

The Sun has a subordinate active-Branch decode next to its ring. Home does not expose percentages,
degrees, numerical progress, countdowns, elapsed/remaining time, or seconds.

## Layout and visual hierarchy

`CelestialCurrentHeader` uses a three-column CSS Grid (`moon center sun`). It never uses
viewport-level absolute positioning. Celestial body, Taiji marker, three values, and ring characters
form the visual hierarchy in that order. Both bodies and their textures are local SVG; there are no
remote assets or runtime image requests.

Marker position and marker self-rotation are separate transform layers. The ring never rotates.
Ordinary target changes use a shortest-path unwrapped angle; selected or simulated time jumps can
disable interpolation. The first render starts at the supplied target without sweeping from zero.

## Interaction and details

The Moon and Sun clusters emit typed requests for `lunar-current` and `seasonal-current` details.
`CelestialCurrentDetails` is the lightweight common shell required because the repository has no
reusable Lunar/Seasonal details surface. It separates astronomical calculation, Chinese calendar
classification, Current Flow semantic gloss, and Current Flow visual mapping. Exact angles and
fractions may appear there, never on Home.

## Responsive strategy

Desktop aligns Moon outward-left and Sun outward-right while their text extends inward. Below 768
CSS pixels, each outer cluster stacks its ring and three values in a compact three-column header.
At short mobile heights, ring diameter and gaps reduce modestly and date/timezone metadata collapses.
Text is not clamped; large text may cause natural page scrolling. Safe-area behavior remains owned by
the existing page and app frame.

## Unavailable states

- Missing Moon astronomy: neutral Moon, `Lunar data unavailable`, no marker, details/retry affordance.
- Missing Cantong qi: astronomical Moon remains, node says unavailable, and no movement is invented.
- Missing Seasonal Current: neutral complete Sun and ring, `Seasonal data unavailable`, no marker.
- Missing Branch: no Gregorian-month guess.

The title and clock remain functional when either instrument is unavailable.

## Methodology registry

- `home-celestial-instruments:v1`
- `moon-ring:cantongqi-six-sector-v1`
- `sun-ring:branch-month-24-tick-v1`
- `solar-term-display-labels:current-en-v1`
- `chinese-solar-season-boundaries:v1`
- `moon-home-cantongqi-labels:v1`
- `moon-home-yinyang-movement:v1`
- `celestial-marker-geometry:top-clockwise-v1`
