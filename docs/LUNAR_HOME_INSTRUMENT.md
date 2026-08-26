# Lunar Home instrument

## Display contract

The Lunar instrument renders an actual round Moon disk from supplied astronomical illumination and
waxing/waning direction. A local SVG path creates the continuous terminator; a clip path keeps the
restrained crater texture inside the disk. The Home lines are:

1. astronomical phase;
2. current Cantong qi period bounds;
3. Cantong qi node as character, tone-marked Pinyin, and English gloss;
4. the reviewed lunar Yin/Yang movement carried by that node.

The compact period row uses the selected display timezone. Its title and accessible name disclose
the exact start and exclusive-end instant with the GMT offset at each boundary. No percentage,
lunar age, lunar date, exact angle, numerical progress, or event countdown appears on Home.

## Six-sector Cantong qi ring

Clockwise from the first sector:

| Index | Node    | Gloss         | Movement      |
| ----: | ------- | ------------- | ------------- |
|     0 | 震 Zhèn | Emergence     | Yang Emerging |
|     1 | 兌 Duì  | Accumulation  | Yang Growing  |
|     2 | 乾 Qián | Culmination   | Yang Full     |
|     3 | 巽 Xùn  | Distribution  | Yin Emerging  |
|     4 | 艮 Gèn  | Consolidation | Yin Growing   |
|     5 | 坤 Kūn  | Concealment   | Yin Full      |

The active node is supplied by the traditional calendar source. It is emphasized by shape,
typographic weight, and color. The text beside the ring decodes it.

Each node covers a five-day traditional lunar-date interval on the reviewed `Asia/Shanghai` calendar
basis. The provider resolves the interval from exact local midnights; the final Kūn interval ends
after day 29 in a short lunar month rather than inventing a day 30. These calendar bounds are
classification boundaries, not astronomical Moon-phase events.

## Astronomical position versus traditional state

The Taiji marker angle is the supplied astronomical elongation normalized to a top-origin,
clockwise ring: 0° is top, 90° right, 180° bottom, and 270° left. The active Cantong qi sector is a
separate sourced classification. A marker may occupy a different sector than the highlighted node;
the presenter deliberately permits that distinction.

The presenter never derives phase from Chinese lunar day and never derives movement from marker
angle. If the node is missing, the astronomical Moon remains visible while node and movement are
explicitly unavailable.

## Motion and updates

The marker orbit and Taiji self-rotation use separate elements. Ordinary source refreshes may
interpolate over the shortest angular path. Initial render and selected/simulated time jumps place
the marker directly at the supplied target. Reduced motion disables interpolation and self-rotation.

The production cadence is hourly plus an exact major lunar event when sooner, with recalculation on
visibility resume. Selected/simulated instants bypass the live presentation cache and render
immediately without interpolation.

## Methodology IDs

- presenter: `home-celestial-instruments:v1`
- ring: `moon-ring:cantongqi-six-sector-v1`
- labels: `moon-home-cantongqi-labels:v1`
- movement: `moon-home-yinyang-movement:v1`
- marker geometry: `celestial-marker-geometry:top-clockwise-v1`
- ephemeris: `celestial-ephemeris:astronomy-engine-v1`
- lunar events: `lunar-events:search-moon-phase-v1`
- traditional date: `chinese-lunar-date:lunar-javascript-asia-shanghai-v1`
