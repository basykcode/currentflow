# Calculation sources and conventions

The active Astrology provider performs deterministic, client-side calculations. This document
defines which source owns each displayed fact, the conventions selected where traditions differ,
and the current limits.

## Calendrical pillars

Current uses [`lunar-javascript` 1.7.7](https://github.com/6tail/lunar-javascript) for the four
GanZhi pillars. The library's
[official GanZhi documentation](https://6tail.cn/calendar/lunar.ganzhi.html) distinguishes several
boundary conventions. Current selects:

- year: `getYearInGanZhiExact()`, changing at the exact Li Chun transition;
- month: `getMonthInGanZhiExact()`, changing at the exact solar-term transition;
- day: `getDayInGanZhiExact2()`, where the 23:00–23:59 late-Zi hour remains on the civil day;
- hour: `getTimeInGanZhi()`, the traditional two-hour pillar.

The library does not accept an IANA timezone. The provider first projects the requested instant into
Gregorian civil parts with the platform `Intl.DateTimeFormat` implementation, then passes those
parts to `Solar.fromYmdHms`. Invalid timezone preferences fall back to the device timezone and are
reported in snapshot provenance.

Golden case: 2026-07-23 at 12:00 in `America/New_York` resolves to year `丙午` (Yang Fire Horse),
month `乙未`, day `戊戌`, and hour `戊午`.

## GanZhi to hexagram

`lunar-javascript` calculates GanZhi but does not assign an I Ching hexagram to each pillar.
Current applies the complete lookup in Howard Choy's
[`60 Jia Zi to 64 Da Gua`](https://howardchoy.wordpress.com/wp-content/uploads/2011/05/60jiazito64dagua.pdf)
table. The lookup is versioned source data, not a formula inferred by the application.

The King Wen hexagram catalog stores every figure bottom-line first. Trigram composition supplies
the six line polarities; presentation alone reverses them for top-to-bottom screen rendering.

Golden case: `丙午` (Yang Fire Horse) maps to Hexagram 28, `大過` / Great Exceeding.

## Organ clock

The active organ period uses the twelve two-hour windows in Table 3 of
[_Traditional Chinese Medicine and Clinical Pharmacology_](https://pmc.ncbi.nlm.nih.gov/articles/PMC7356495/).
The sequence is:

| Civil time  | Period          |
| ----------- | --------------- |
| 23:00–01:00 | Gallbladder     |
| 01:00–03:00 | Liver           |
| 03:00–05:00 | Lung            |
| 05:00–07:00 | Large Intestine |
| 07:00–09:00 | Stomach         |
| 09:00–11:00 | Spleen          |
| 11:00–13:00 | Heart           |
| 13:00–15:00 | Small Intestine |
| 15:00–17:00 | Bladder         |
| 17:00–19:00 | Kidney          |
| 19:00–21:00 | Pericardium     |
| 21:00–23:00 | San Jiao        |

Selection uses civil clock time in the snapshot timezone. It does not correct for apparent solar
time or longitude because Current does not request coordinates. This is a traditional educational
framework, not a diagnostic or treatment claim.

## Structural relationships

The day hexagram supplies three deterministic, line-derived relationships:

- nuclear: source lines 2–4 form the lower trigram and lines 3–5 form the upper trigram;
- reverse: the six source lines are read in the opposite order;
- complement: every yin line becomes yang and every yang line becomes yin.

These are structural transformations, not Plum Blossom changing-line divination. No changing line
is selected or implied.

## Deliberately unavailable

Current does not generate interpretive forecasts, recommended actions, personal BaZi synthesis, or
medical guidance from these factors. Those surfaces remain explicitly unavailable until a separate,
verified and reviewable model is connected.

## Known verification risk

Exact solar-term boundaries inherit `lunar-javascript` data and implementation behavior. Boundary
dates should receive additional cross-library golden fixtures before they are treated as
high-assurance natal or electional calculations. Away from a transition, the selected convention is
unambiguous.
