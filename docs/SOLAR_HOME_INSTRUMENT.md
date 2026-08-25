# Solar Home instrument

## Display contract

The Solar instrument uses a complete, static, locally rendered Sun disk. The Home lines are Chinese
season, current Solar Term, and the reviewed annual Yin/Yang movement. The Solar Term always includes
traditional characters, tone-marked Pinyin, and contextual English. A small subordinate badge
decodes the active Branch without creating a fourth primary line.

Home never displays solar longitude, term progress, percentages, boundary countdowns, or remaining
days.

## Twenty-four-term table and Chinese seasons

The reviewed display registry contains all 24 Solar Terms at their standard 15-degree longitudes.
It is a label table, not an astronomical calculator. The provider selects a term from exact
`astronomy-engine` longitude/crossing results; the presenter resolves the reviewed label and
cross-checks supplied classification against continuous longitude.

Chinese season boundaries are:

- 315° inclusive through 45° exclusive: Spring;
- 45° inclusive through 135° exclusive: Summer;
- 135° inclusive through 225° exclusive: Autumn;
- 225° inclusive through 315° exclusive: Winter.

These boundaries begin at Lìchūn, Lìxià, Lìqiū, and Lìdōng rather than Gregorian month starts.

## Twelve Branch sectors and 24 ticks

The ring contains 12 equal Branch-month sectors and 24 term ticks. Four cardinal ticks are stronger
by width and color. Starting with the Zǐ boundary at 255° solar longitude, sectors advance every
30° in this order:

`子 Zǐ`, `丑 Chǒu`, `寅 Yín`, `卯 Mǎo`, `辰 Chén`, `巳 Sì`, `午 Wǔ`, `未 Wèi`,
`申 Shēn`, `酉 Yǒu`, `戌 Xū`, `亥 Hài`.

The active Branch comes from the Seasonal Current source's physical longitude. The presenter's
independently reviewed geometry cross-check throws a typed conflict if supplied Branch and
longitude disagree; it does not silently replace source data. The existing Month Pillar Branch is
also cross-checked and any narrow exact-boundary disagreement is reported without changing either
authority.

## Orientation and marker

Solar longitude 270° maps to top, 0° to right, 90° to bottom, and 180° to left. Therefore the visual
marker angle is normalized `solar longitude - 270°`. The ring remains static while the marker orbit
moves. The Taiji's slow self-rotation is independent of orbital position.

The annual Yin/Yang label is semantic source data. It is never inferred from the visual quadrant,
season name, or marker angle.

## Motion and updates

Initial and selected/simulated renders jump directly to the source target. Ordinary live updates may
use shortest-path interpolation. Reduced motion disables interpolation and self-rotation.

The production cadence is the next `Asia/Shanghai` midnight or exact Solar Term, whichever is
sooner, with recalculation on visibility resume. Selected/simulated instants bypass the live
presentation cache and render immediately without interpolation.

## Methodology IDs

- presenter: `home-celestial-instruments:v1`
- ring: `sun-ring:branch-month-24-tick-v1`
- term display table: `solar-term-display-labels:current-en-v1`
- season boundaries: `chinese-solar-season-boundaries:v1`
- marker geometry: `celestial-marker-geometry:top-clockwise-v1`
- ephemeris: `celestial-ephemeris:astronomy-engine-v1`
- event search: `solar-term-events:search-sun-longitude-v1`
- annual movement: `solar-home-yinyang-movement-by-term:v1`
