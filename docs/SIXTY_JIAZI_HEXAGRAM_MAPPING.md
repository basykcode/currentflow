# Sixty Jiazi Hexagram Mapping

## Implemented contract

- System: `六十甲子配卦` (`liu-shi-jiazi-peigua`)
- Mapping ID: `liu-shi-jiazi-peigua-king-wen`
- Mapping version: `liu-shi-jiazi-peigua-king-wen-v1`
- Stored identity: canonical King Wen ID, 1-64
- Entries: 60 explicit Ganzhi assignments
- Derived omissions: 1 乾, 2 坤, 29 坎, 30 離

This contract is the Current Flow product's selected sixty-gua projection. It is not a claim that
every lineage using the names `六十甲子配卦`, Da Gua, or Xuan Kong uses a single-assignment table.

## Source lineage and confidence

Howard Choy's [2011 source post](https://howardchoy.wordpress.com/2011/05/23/xuan-kong-da-gua-date-selection/)
publishes an English reference for correlating the 60 Jiazi of the four pillars to 64 Da Gua in
XKDG date selection. Its [first sheet](https://howardchoy.wordpress.com/wp-content/uploads/2011/05/60jiazito64dagua_page_1.jpg)
and [second sheet](https://howardchoy.wordpress.com/wp-content/uploads/2011/05/60jiazito64dagua_page_2.jpg)
contain 64 rows because four Jiazi receive two gua:

| Ganzhi | Non-pure gua | Pure gua |
| ------ | ------------ | -------- |
| 甲子   | 24 復        | 2 坤     |
| 庚寅   | 49 革        | 30 離    |
| 甲午   | 44 姤        | 1 乾     |
| 庚申   | 4 蒙         | 29 坎    |

The target projection chooses the non-pure member in each pair. This selection is supported by the
omission rule in Hu Guozhen's `羅經解定`, `第十二層人元周易卦並卦爻吉凶`: the four pure gua
乾、坤、坎、離 remain outside the sixty while the other sixty gua are assigned across the sixty
Jiazi. The 1926 Qin Shen'an-collated edition is catalogued by the
[National Taiwan Library](https://taiwanebook.ncl.edu.tw/zh-tw/book/NTL-9900014207), with a
[digitized section inventory and volume](https://commons.wikimedia.org/wiki/File%3ANLC511-13056616-69088_%E7%BE%85%E7%B6%93%E8%A7%A3%E5%AE%9A%EF%BC%88%E4%B8%8A%E5%86%8A%EF%BC%89.pdf).

Independent comparison sources preserve the same four dual assignments:

- a [Luo Pan layer explanation](https://classic-blog.udn.com/lnfjb71z/75846340?f_UA=pc);
- a separate [full 64-row transcription](https://www.getit01.com/p201805262359110/); and
- the [Chinese Metasoft 64 Hexagrams table](https://chinesemetasoft.org/Table/Hexagrams), which
  cross-references King Wen identity, Jiazi association, Gua values, and Luo Pan position.

Confidence is high for the implemented table identity, the four dual pairs, and the target omission
set. The historical source supports a Luo Pan lineage; this documentation does not assert a more
specific ancient authorship or collapse all modern XKDG variants into the selected projection.

The complete investigation, including the former hybrid table, is in
[`TEMPORAL_HEXAGRAM_MAPPING_AUDIT.md`](TEMPORAL_HEXAGRAM_MAPPING_AUDIT.md).

## Numbering normalization

The application stores and displays only canonical King Wen IDs. External numbers must enter
through `convertToKingWenHexagram()` with a declared system:

- `king-wen`: 1-64, returned unchanged after validation;
- `fu-xi-binary`: 0-63, bottom line as the least-significant bit; and
- `xuan-kong-da-gua-luo-pan`: 1-64 clockwise Luo Pan position, beginning with 復 at north.

“XKDG number” is not accepted as an ambiguous label. Gua Qi, Gua Yun, Jiazi order, Luo Pan position,
Fu Xi binary value, and King Wen ID are separate fields. For example:

| Pure gua | King Wen | Fu Xi binary | XKDG Luo Pan position |
| -------- | -------: | -----------: | --------------------: |
| 乾       |        1 |           63 |                    32 |
| 坤       |        2 |            0 |                    64 |
| 坎       |       29 |           18 |                    46 |
| 離       |       30 |           45 |                    14 |

## Canonical 60-entry table

English titles below are Current Flow's canonical registry titles; they are not presented as
translations from the source sheets.

| Cycle | Ganzhi | King Wen ID | Chinese | English                       |
| ----: | ------ | ----------: | ------- | ----------------------------- |
|     1 | 甲子   |          24 | 復      | Return                        |
|     2 | 乙丑   |          21 | 噬嗑    | Biting Through                |
|     3 | 丙寅   |          37 | 家人    | The Family                    |
|     4 | 丁卯   |          41 | 損      | Decrease                      |
|     5 | 戊辰   |          10 | 履      | Treading                      |
|     6 | 己巳   |          34 | 大壯    | The Power of the Great        |
|     7 | 庚午   |          32 | 恆      | Duration                      |
|     8 | 辛未   |           6 | 訟      | Conflict                      |
|     9 | 壬申   |           7 | 師      | The Army                      |
|    10 | 癸酉   |          53 | 漸      | Development                   |
|    11 | 甲戌   |          39 | 蹇      | Obstruction                   |
|    12 | 乙亥   |          35 | 晉      | Progress                      |
|    13 | 丙子   |          27 | 頤      | Nourishment                   |
|    14 | 丁丑   |          17 | 隨      | Following                     |
|    15 | 戊寅   |          55 | 豐      | Abundance                     |
|    16 | 己卯   |          60 | 節      | Limitation                    |
|    17 | 庚辰   |          11 | 泰      | Peace                         |
|    18 | 辛巳   |          14 | 大有    | Great Possession              |
|    19 | 壬午   |          57 | 巽      | The Gentle Wind               |
|    20 | 癸未   |          47 | 困      | Oppression                    |
|    21 | 甲申   |          64 | 未濟    | Before Completion             |
|    22 | 乙酉   |          33 | 遯      | Retreat                       |
|    23 | 丙戌   |          52 | 艮      | Keeping Still Mountain        |
|    24 | 丁亥   |          16 | 豫      | Enthusiasm                    |
|    25 | 戊子   |           3 | 屯      | Difficulty at the Beginning   |
|    26 | 己丑   |          25 | 無妄    | Innocence                     |
|    27 | 庚寅   |          49 | 革      | Revolution                    |
|    28 | 辛卯   |          61 | 中孚    | Inner Truth                   |
|    29 | 壬辰   |          26 | 大畜    | The Taming Power of the Great |
|    30 | 癸巳   |          43 | 夬      | Breakthrough                  |
|    31 | 甲午   |          44 | 姤      | Coming to Meet                |
|    32 | 乙未   |          48 | 井      | The Well                      |
|    33 | 丙申   |          40 | 解      | Deliverance                   |
|    34 | 丁酉   |          31 | 咸      | Influence                     |
|    35 | 戊戌   |          15 | 謙      | Modesty                       |
|    36 | 己亥   |          20 | 觀      | Contemplation                 |
|    37 | 庚子   |          42 | 益      | Increase                      |
|    38 | 辛丑   |          36 | 明夷    | Darkening of the Light        |
|    39 | 壬寅   |          13 | 同人    | Fellowship with People        |
|    40 | 癸卯   |          54 | 歸妹    | The Marrying Maiden           |
|    41 | 甲辰   |          38 | 睽      | Opposition                    |
|    42 | 乙巳   |           5 | 需      | Waiting                       |
|    43 | 丙午   |          28 | 大過    | Preponderance of the Great    |
|    44 | 丁未   |          18 | 蠱      | Work on What Has Been Spoiled |
|    45 | 戊申   |          59 | 渙      | Dispersion                    |
|    46 | 己酉   |          56 | 旅      | The Wanderer                  |
|    47 | 庚戌   |          12 | 否      | Standstill                    |
|    48 | 辛亥   |           8 | 比      | Holding Together              |
|    49 | 壬子   |          51 | 震      | The Arousing Thunder          |
|    50 | 癸丑   |          22 | 賁      | Grace                         |
|    51 | 甲寅   |          63 | 既濟    | After Completion              |
|    52 | 乙卯   |          19 | 臨      | Approach                      |
|    53 | 丙辰   |          58 | 兌      | The Joyous Lake               |
|    54 | 丁巳   |           9 | 小畜    | The Taming Power of the Small |
|    55 | 戊午   |          50 | 鼎      | The Cauldron                  |
|    56 | 己未   |          46 | 升      | Pushing Upward                |
|    57 | 庚申   |           4 | 蒙      | Youthful Folly                |
|    58 | 辛酉   |          62 | 小過    | Preponderance of the Small    |
|    59 | 壬戌   |          45 | 萃      | Gathering Together            |
|    60 | 癸亥   |          23 | 剝      | Splitting Apart               |

The table assigns 60 distinct gua. Computing the complement against King Wen 1-64 yields exactly
`[1, 2, 29, 30]`. The validator fails if 4, 44, or 49 is absent.

## Real-date validation

Versioned fixtures live in `fixtures/temporal-hexagram-validation/known-dates.json`. Each fixture
compares two stages separately:

1. exact year/month/day/hour Ganzhi produced by `lunar-javascript`; and
2. the King Wen result returned by the versioned Jiazi lookup.

The fixtures include:

| Instant and timezone                       | Year      | Month     | Day       | Hour      |
| ------------------------------------------ | --------- | --------- | --------- | --------- |
| 2026-07-23T16:00:00Z · America/New_York    | 丙午 → 28 | 乙未 → 48 | 戊戌 → 15 | 戊午 → 50 |
| 2026-08-22T23:05:30Z · America/Los_Angeles | 丙午 → 28 | 丙申 → 40 | 戊辰 → 10 | 庚申 → 4  |

The first verifies the Fire Horse golden case. The second exercises one corrected assignment at a
real hour. Sources and confidence are stored with each fixture; no network request occurs in tests.

## Known variants

- **64-row dual-assignment table:** all 64 gua are retained by assigning two gua to 甲子, 庚寅,
  甲午, and 庚申. Some practitioner sources select between the pair by seasonal boundary. Current
  Flow does not implement that conditional variant.
- **60-row pure-gua projection:** a possible projection selects 坤, 離, 乾, and 坎 and therefore
  omits 復, 革, 姤, and 蒙. This is not Current Flow's selected system.
- **Other Jiazi-gua systems:** other historical systems also associate stems/branches with gua but
  use different start points, governing gua, or orderings. They must receive their own system ID and
  adapter rather than being placed in this table.

## Migration and snapshot safety

The former anonymous table is designated `old-current-table`. The new contract is
`liu-shi-jiazi-peigua-king-wen-v1`. Exactly three assignments change:

| Ganzhi | old-current-table | New version |
| ------ | ----------------- | ----------- |
| 庚寅   | 30 離             | 49 革       |
| 甲午   | 1 乾              | 44 姤       |
| 庚申   | 29 坎             | 4 蒙        |

The other 57 assignments are regression-tested unchanged. The provider model version moves from
1.0.0 to 1.1.0, and every live temporal item plus snapshot provenance stores the mapping version.
The calculation details UI identifies `六十甲子配卦`, the mapping version, and canonical King Wen
numbering.

The repository currently has no persisted saved-reading or snapshot store. Existing external
snapshots without a mapping version must be treated as `old-current-table` and preserved as
historical output; they must not be silently re-resolved under v1. Future persistence must store the
mapping version alongside the original Ganzhi and displayed King Wen identity.
