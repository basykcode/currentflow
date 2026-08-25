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
Current applies `liu-shi-jiazi-peigua-king-wen-v1`, the explicit sixty-entry `六十甲子配卦`
projection documented in [`SIXTY_JIAZI_HEXAGRAM_MAPPING.md`](SIXTY_JIAZI_HEXAGRAM_MAPPING.md).
Howard Choy's source table retains all 64 gua through four dual-assignment Jiazi; the selected
Current Flow projection uses 復, 革, 姤, and 蒙 at those positions, so the four unassigned pure gua
are 乾 1, 坤 2, 坎 29, and 離 30. The lookup is versioned source data, not a formula inferred by the
application.

The King Wen hexagram catalog stores every figure bottom-line first. Trigram composition supplies
the six line polarities; presentation alone reverses them for top-to-bottom screen rendering.
Received Chinese names and unaccented romanization are cross-checked against the
[Chinese Text Project Zhouyi index](https://ctext.org/book-of-changes); display pinyin adds standard
Mandarin tone marks. English display titles follow the widely circulated Wilhelm/Baynes convention
where translations differ. These identity fields are curated references rather than calculations.

Golden case: `丙午` (Yang Fire Horse) maps to Hexagram 28, `大過` / `Dà Guò` /
Preponderance of the Great.

Every temporal item stores the mapping system, mapping version, and canonical King Wen numbering.
The conversion boundary distinguishes King Wen IDs, bottom-line-LSB Fu Xi binary indexes, and
one-based XKDG Luo Pan positions; an ambiguous “hexagram number” is not accepted.

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

### Chū / Zhèng / Kè subdivision

Current selects the Shixian 96-kè convention, which divides a day into 96 equal `刻`, making one Kè
15 basis minutes and each two-hour Branch period eight Kè. This is a selected historical model, not
a claim that one convention governed every period of Chinese history. The first Macro Hour is `初`
Chū / Entering and the second is `正` Zhèng / Established:

| Offset in Shíchen | Macro    |   Micro | Historical Kè | Product meaning                |
| ----------------- | -------- | ------: | ------------- | ------------------------------ |
| 00–15             | 初 Chū   | Phase 0 | 初刻          | First Kè of current Macro Hour |
| 15–30             | 初 Chū   | Phase 1 | 一刻          | Second Kè                      |
| 30–45             | 初 Chū   | Phase 2 | 二刻          | Third Kè                       |
| 45–60             | 初 Chū   | Phase 3 | 三刻          | Fourth Kè                      |
| 60–75             | 正 Zhèng | Phase 0 | 初刻          | First Kè of current Macro Hour |
| 75–90             | 正 Zhèng | Phase 1 | 一刻          | Second Kè                      |
| 90–105            | 正 Zhèng | Phase 2 | 二刻          | Third Kè                       |
| 105–120           | 正 Zhèng | Phase 3 | 三刻          | Fourth Kè                      |

The [National Astronomical Observatory of Japan's calendar office](https://eco.mtk.nao.ac.jp/koyomi/wiki/BBFEB9EF2FC4EABBFECBA1A4C8C9D4C4EABBFECBA1.html)
documents the two-hour branch period, its `初` beginning and `正` midpoint, and the Shixian choice of
96 ke. A historical overview republished by
[China Daily](https://ent.chinadaily.com.cn/a/201907/26/WS5d3a5399a3106bab40a029b1.html)
documents the resulting eight 15-minute ke per branch period.

Phase derives from the same normalized local-civil coordinate that selects the Organ System,
Earthly Branch, hour pillar, and Hour Hexagram. Boundaries are projected through the IANA timezone
engine rather than assumed to be fixed UTC durations near DST. Macro Hour is a subordinate Current
guidance-maturity input. Micro Hour is observational only and has no independent energetic,
cultivation, intention, execution, or medical meaning. See
[`CHU_ZHENG_KE_CLOCK.md`](CHU_ZHENG_KE_CLOCK.md).

## Structural relationships and Transformation Lab

The Astrology day hexagram continues to expose three deterministic, line-derived relationships:

- nuclear: source lines 2–4 form the lower trigram and lines 3–5 form the upper trigram;
- reverse: the six source lines are read in the opposite order;
- complement: every yin line becomes yang and every yang line becomes yin.

The shared inspector's compact screen exposes a user-selected relating result plus nuclear,
complement, and reversal. Its Advanced Transformation Lab adds trigram exchange, explicit symmetry
compositions, a five-result Mutual Field, bounded nuclear iteration, all 63 non-self line-change
destinations, lazily paged minimal paths, King Wen sequence relations, and structural anatomy. Line
positions are always counted 1–6 from bottom to top and every result resolves through the same
verified catalog.

The composed symmetry family, four non-central Mutual Field projections, Deep Nuclear iteration, and
minimal-path enumeration are labeled Current formalizations rather than received traditional
systems. Zagua, Eight Palaces, Na Jia, lineage-specific Gua Bian, message hexagrams, Shao Yong maps,
Cantong Qi mappings, and Jiaoshi Yilin transitions remain explicitly source-needed. Exact formulas
and availability semantics are documented in
[`YIJING_TRANSFORMATIONS.md`](YIJING_TRANSFORMATIONS.md) and
[`YIJING_TRANSFORMATION_PROVENANCE.md`](YIJING_TRANSFORMATION_PROVENANCE.md). These tools remain
structural; the interface does not attach forecasts or select moving lines on the user's behalf.

The library's Fu Xi binary option sorts all-yin through all-yang using the bottom line as the least
significant bit. The trigram-matrix option groups the same complete set by upper and then lower
trigram in Early Heaven order. Both conventions are stated in the selector rather than presented as
King Wen numbering.

## Gene Keys vocabulary

Each numbered hexagram is paired one-to-one with the same-numbered Gene Key. The inspector displays
only the three short frequency-band terms published on the corresponding
[Gene Keys Living Library](https://genekeys.com/gene-key-1/) page: Shadow, Gift, and Siddhi. Every
entry stores a direct official source URL, carries `curated` status, and makes no runtime request.
No proprietary commentary or profile calculation is reproduced or inferred.

## Deliberately unavailable

### Celestial Current astronomy

Current does not yet calculate or receive lunar elongation, illumination, lunation progress,
waxing/waning direction, or continuous solar longitude. `lunar-javascript` is authoritative here for
the documented GanZhi and Jie-boundary uses only; those fields are not treated as substitutes for an
ephemeris.

The staged Celestial Current presenters therefore require explicit astronomical source fields and
render unavailable when they are absent. They never infer Moon phase from Chinese lunar day, season
from browser month, or Branch from Gregorian month. The reviewed 24-term display table, Chinese
season boundaries, Branch-sector geometry, Cantong qi glosses, and ring layout are presentation and
cross-check data—not an astronomical engine. Production integration is blocked pending the source
decision recorded in
[`CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md`](CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md).

Current does not infer forecasts, personal BaZi synthesis, or medical guidance directly from these
factors. The separate Temporal Semantic Resolver maps only 13 eligible hexagram identities into
Current operational vectors and keeps that product ontology distinct from classical sources. When
the operative day is covered, the deterministic Guidance Output Layer can render OLTR, controlled
Intention, and low-risk Execution; uncovered days return an explicit unavailable bundle. Lesser
missing scale profiles remain visible as partial coverage and are never inferred.

Hexagram commentary tabs display source-grounded editorial drafts. These are static interpretive
syntheses, not calculations, forecasts, translations, or personal readings. Every available record
retains evidence, source, rights, and review metadata; every automated result is labeled draft-only
pending human review. No source passage is shipped to the browser. Eleven sources have complete
King Wen 1-64 file coverage, including Richard John Lynn's translation of Wang Bi's _Classic of
Changes_. Six inherited chunk anomalies are quarantined, producing five unavailable Buddhist cells.

Selected line changes also show an original draft paraphrase of the corresponding source-to-result
entry in the _Jiaoshi Yilin_. The target hexagram is computed first from the canonical bottom-to-top
line registry; the Forest entry is joined afterward by its verified route and never determines the
calculation. All 384 records retain locator, passage-hash, rights, and review metadata, and no source
verse or note is shipped.

Named classical systems without accepted source data appear as `source-needed`; no transformation
or commentary is returned until the relevant rule, table, and source boundary are accepted.
Absolute Shadow remains a visible advanced placeholder only; no transformation is returned until
its rule is defined and accepted.

## Known verification risk

Exact solar-term boundaries inherit `lunar-javascript` data and implementation behavior. Boundary
dates should receive additional cross-library golden fixtures before they are treated as
high-assurance natal or electional calculations. Away from a transition, the selected convention is
unambiguous.
