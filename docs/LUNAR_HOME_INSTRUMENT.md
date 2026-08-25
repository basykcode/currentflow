# Lunar Home instrument

## Display contract

The Lunar instrument renders an actual round Moon disk from supplied astronomical illumination and
waxing/waning direction. A local SVG path creates the continuous terminator; a clip path keeps the
restrained crater texture inside the disk. The Home lines are:

1. astronomical phase;
2. Cantong qi node as character, tone-marked Pinyin, and English gloss;
3. the reviewed lunar Yin/Yang movement carried by that node.

No percentage, lunar age, lunar date, exact angle, numerical progress, or event countdown appears
on Home.

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

The intended production cadence is hourly plus relevant source boundaries and visibility resume,
but no scheduler is connected until the authoritative Global Conditions owner is selected.

## Methodology IDs

- presenter: `home-celestial-instruments:v1`
- ring: `moon-ring:cantongqi-six-sector-v1`
- labels: `moon-home-cantongqi-labels:v1`
- movement: `moon-home-yinyang-movement:v1`
- marker geometry: `celestial-marker-geometry:top-clockwise-v1`
