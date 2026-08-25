# Temporal Hexagram Mapping Audit

Audit date: 2026-08-22

## Scope and conclusion

Current Flow resolves each exact year, month, day, and hour Ganzhi through
`src/domain/astrology/jiaZiHexagrams.ts`, then retrieves the canonical hexagram from the King Wen
registry. The current lookup is not a coherent transcription of Howard Choy's 2011 "60 Jia Zi to
64 Da Gua" reference. It is an undocumented 60-entry projection of Choy's 64-row table:

- `甲子` selects 復 24 instead of the paired 坤 2;
- `庚寅` selects 離 30 instead of the paired 革 49;
- `甲午` selects 乾 1 instead of the paired 姤 44; and
- `庚申` selects 坎 29 instead of the paired 蒙 4.

That mixture produces the omitted set `[2, 4, 44, 49]`. The symptom report named 4, 44, and 49;
坤 2 was also absent but happens to belong to the intended omission set. The requested Current Flow
system is the explicit sixty-gua projection that selects 復 24, 革 49, 姤 44, and 蒙 4, leaving the
four pure gua `[1, 2, 29, 30]` outside the table.

The mapping should therefore be replaced only as a versioned lineage choice, not as a numeric
patch. Ganzhi calculation and temporal boundaries are independent and do not need to change.

## Repository findings

### Current lookup

- File: `src/domain/astrology/jiaZiHexagrams.ts`
- Introduced: commit `9b6cbe1` and unchanged through this audit
- Shape: `Map<string, number>`
- Entries: 60
- Distinct Ganzhi: 60
- Distinct hexagram IDs: 60
- Stored numbering: King Wen 1-64, although the type does not declare the numbering system
- Missing King Wen IDs: `2, 4, 44, 49`
- Duplicate assignments: none
- Source comment: Howard Choy's "60 Jia Zi to 64 Da Gua" table
- Source metadata, mapping ID, version, and validation: absent

`resolveJiaZiHexagram()` passes each stored number directly to `getHexagram()`. The canonical
registry in `src/domain/astrology/hexagrams.ts` is King Wen-numbered, so there is no hidden binary or
Xuan Kong conversion between the table and the UI.

### Ordering and conversion utilities

The repository contains three display orderings for the canonical 64-hexagram registry:

- `king-wen`: ascending canonical King Wen ID;
- `fu-xi`: ascending six-bit value, with the bottom line as the least-significant bit; and
- `trigram-matrix`: canonical trigram matrix traversal.

`fu-xi` is currently only a sort operation. It does not assign or persist a Fu Xi index. There was
no explicit Fu Xi-to-King Wen converter, Xuan Kong Da Gua/Luo Pan index converter, or generic
numbering-system type at the time of audit. There is no `temporalXkdg.ts` file and no other Jiazi
hexagram table in the application.

### Calendrical boundary

`src/providers/lunarScriptCurrentFlow.ts` obtains exact Ganzhi from `lunar-javascript` 1.7.7 and
only then calls the Jiazi mapping. The provider uses:

- exact Li Chun year (`getYearInGanZhiExact()`);
- exact solar-term month (`getMonthInGanZhiExact()`);
- sect-2 civil day (`getDayInGanZhiExact2()`); and
- two-hour pillar (`getTimeInGanZhi()`).

The correction is downstream of all four calculations. No BaZi boundary, solar term, day boundary,
timezone, organ clock, or Global Conditions logic is implicated.

## Current-system identification

The code comment points to [Howard Choy's original 2011 post](https://howardchoy.wordpress.com/2011/05/23/xuan-kong-da-gua-date-selection/).
Choy describes the artifact as an English correlation of the 60 Jiazi of the four pillars to the 64
Da Gua for XKDG date selection. The two published sheets explicitly contain 64 rows, not 60:

- [sheet 1](https://howardchoy.wordpress.com/wp-content/uploads/2011/05/60jiazito64dagua_page_1.jpg)
  gives both 復/坤 to 甲子 and both 革/離 to 庚寅; and
- [sheet 2](https://howardchoy.wordpress.com/wp-content/uploads/2011/05/60jiazito64dagua_page_2.jpg)
  gives both 姤/乾 to 甲午 and both 蒙/坎 to 庚申.

The sheet identifies gua by Chinese/English name plus Gua Qi and Gua Yun. Resolving those names
through the canonical registry yields King Wen 24/2, 49/30, 44/1, and 4/29 respectively. The current
code chose one row for each repeated Jiazi, but did not record a rule for those choices. Its choices
do not match either a pure-gua projection or a non-pure-gua projection.

Classification of the current code is therefore:

- source family: Xuan Kong Da Gua date-selection correlation table;
- stored numbering: canonical King Wen IDs;
- table behavior: an undocumented hybrid 60-row projection of a 64-row dual-assignment table;
- not: a Fu Xi binary-index table; and
- not: a faithful standalone Luo Pan/XKDG ring ordering.

## Target-system provenance

The target is recorded as `六十甲子配卦`, specifically the sixty-gua projection that omits the four
pure gua.

### Classical/historical evidence

Hu Guozhen's `羅經解定`, in the section titled `第十二層人元周易卦並卦爻吉凶` (also described in
some scans/OCR as 八元周易), states that 乾、坤、坎、離 are not assigned and that the remaining
sixty gua are distributed across the sixty Jiazi. A 1926 Shanghai edition, collated by Qin Shen'an,
is catalogued by the [National Taiwan Library](https://taiwanebook.ncl.edu.tw/zh-tw/book/NTL-9900014207),
and the digitized volume and section inventory are available through
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File%3ANLC511-13056616-69088_%E7%BE%85%E7%B6%93%E8%A7%A3%E5%AE%9A%EF%BC%88%E4%B8%8A%E5%86%8A%EF%BC%89.pdf).

This source establishes the target omission rule and its Luo Pan lineage. It does not by itself
establish that every modern system called "六十甲子配卦" or "XKDG" must use that projection.

### Independent table and implementation comparison

Independent modern transcriptions preserve the same four dual assignments. A Luo Pan layer
explanation lists the exact pairs 坤/復, 離/革, 乾/姤, and 坎/蒙 for the four repeated Jiazi
([UDN Luo Pan overview](https://classic-blog.udn.com/lnfjb71z/75846340?f_UA=pc)). A separate full
table prints all 64 rows and the same duplicates
([六十甲子配六十四卦](https://www.getit01.com/p201805262359110/)).

The [Chinese Metasoft 64 Hexagrams reference](https://chinesemetasoft.org/Table/Hexagrams) provides
an independent software-oriented comparison: it identifies all 64 canonical King Wen gua, their
Jiazi associations, and their distinct Luo Pan positions. It also shows exactly the four repeated
Jiazi and confirms the corresponding King Wen identities.

Together these sources support two separate, valid representations:

1. a 64-row XKDG/Luo Pan association, in which four Jiazi have two gua; and
2. a 60-row `六十甲子配卦` projection, in which the four pure gua are excluded.

Current Flow's product requirement selects representation 2. The implementation must name and
version that choice instead of presenting it as the only possible XKDG convention.

## Audit examples

The following snapshot was generated with the pre-correction table at
`2026-08-22T23:05:30.000Z` in `America/Los_Angeles`:

| Scope | Calculated Ganzhi | Current King Wen result              | Result after target projection |
| ----- | ----------------- | ------------------------------------ | ------------------------------ |
| Year  | 丙午              | 28 大過 / Preponderance of the Great | unchanged                      |
| Month | 丙申              | 40 解 / Deliverance                  | unchanged                      |
| Day   | 戊辰              | 10 履 / Treading                     | unchanged                      |
| Hour  | 庚申              | 29 坎 / The Abysmal Water            | 4 蒙 / Youthful Folly          |

The three-pillar result is independently consistent with the
[2026-08-22 almanac listing](https://bazi2u.com/en/calendar/2026-08-22) and the
[Hong Kong Observatory 2026 almanac](https://www.hko.gov.hk/tc/gts/astron2026/files/HKO_almanac_2026.pdf).
The hour lookup is independently listed as 庚申 for 15:00-16:59 on that 戊辰 day by the same
almanac implementation. These comparisons verify the Ganzhi stage separately from the Jiazi-to-gua
stage.

## Replacement gate

The mapping may be replaced after the implementation provides all of the following:

- an explicit `liu-shi-jiazi-peigua` mapping model with King Wen numbering and source metadata;
- all 60 Ganzhi entries written explicitly;
- deterministic King Wen normalization utilities for every supported external index;
- validation of exactly 60 unique Ganzhi, 60 unique gua, and missing IDs `[1, 2, 29, 30]`;
- versioned real-date fixtures that compare Ganzhi before gua identity;
- mapping version propagation into live snapshots and calculation details; and
- migration documentation naming the former table `old-current-table`.
