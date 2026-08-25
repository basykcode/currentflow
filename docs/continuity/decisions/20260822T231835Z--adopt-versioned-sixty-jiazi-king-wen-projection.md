# Decision: Adopt the versioned sixty-Jiazi King Wen projection

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: temporal hexagram identity, source lineage, numbering, migration, and snapshot provenance

## Context

Current Flow's anonymous 60-entry Ganzhi lookup was attributed to Howard Choy's "60 Jia Zi to 64
Da Gua" table but omitted King Wen 2, 4, 44, and 49. Choy's actual reference contains 64 rows: four
Jiazi each have both a non-pure and a pure gua. The code had selected 復 for 甲子 but the pure gua
離, 乾, and 坎 for the other three pairs, without a documented selection rule.

The product requirement is a 60-entry `六十甲子配卦` system whose omitted gua are the four pure
figures 乾, 坤, 坎, and 離.

## Evidence boundary

- Howard Choy's original 2011 post and two published sheets establish the complete 64-row
  association and exact four dual pairs.
- Hu Guozhen's `羅經解定`, `第十二層人元周易卦並卦爻吉凶`, establishes a documented Luo Pan
  lineage in which 乾、坤、坎、離 remain outside the sixty assignments.
- Two independent modern transcriptions and Chinese Metasoft's software-oriented reference confirm
  the dual pairs and canonical identities.

The evidence supports the selected projection. It does not establish that every system labeled
XKDG or `六十甲子配卦` must make the same choice.

## Options considered

1. **Patch only the three visibly wrong assignments** — rejected because the source system,
   numbering, selection rule, and migration would remain implicit.
2. **Retain all 64 rows and choose by a seasonal boundary** — not selected because it is a different
   dual-assignment variant from the requested 60-entry Current Flow contract.
3. **Adopt an explicit non-pure 60-gua projection with canonical King Wen IDs** — accepted because
   it matches the target omission rule, remains independently testable, and preserves the existing
   UI identity system.

## Decision

Adopt mapping version `liu-shi-jiazi-peigua-king-wen-v1`:

- store all 60 Ganzhi and their canonical King Wen identities explicitly;
- select 復 24, 革 49, 姤 44, and 蒙 4 for the four dual-assignment Jiazi;
- derive and validate omissions `[1, 2, 29, 30]`;
- reject any table that omits 4, 44, or 49;
- keep `lunar-javascript` Ganzhi and boundary calculation unchanged; and
- propagate the mapping version through every live temporal item and snapshot provenance.

Normalize external numbering through a discriminated conversion boundary. `king-wen`,
`fu-xi-binary`, and `xuan-kong-da-gua-luo-pan` are distinct systems. The XKDG representation is
specifically a one-based Luo Pan ring position and must not be confused with Gua Qi or Gua Yun.

## Migration

Designate the former table `old-current-table`. Exactly three assignments change:

- 庚寅: 30 離 → 49 革
- 甲午: 1 乾 → 44 姤
- 庚申: 29 坎 → 4 蒙

The other 57 assignments remain identical and are regression-tested. Existing external saved
readings without a mapping version are legacy `old-current-table` output and must not be silently
recomputed. The current repository has no persisted saved-reading/snapshot store; new live snapshots
store the v1 mapping version.

## Consequences and tradeoffs

- Temporal UI identity is unambiguous and consistently King Wen-numbered.
- The source rule, variant choice, and migration are durable project records rather than comments.
- Guidance can change on the three corrected Ganzhi because downstream semantics consume the
  corrected canonical identity. That is intended and covered by the provider boundary.
- Supporting the seasonal 64-row variant later requires a new mapping ID/version and an explicit
  boundary rule; it cannot be added as a silent mutation of v1.
- The explicit table is verbose, but it makes source identity, review, and validation local to every
  entry.

## Verification criteria

- Exactly 60 unique Ganzhi and 60 unique King Wen assignments.
- Derived and declared omissions both equal `[1, 2, 29, 30]`.
- Every entry matches canonical Chinese and English registry identity and resolves to declared
  source metadata.
- Pure-gua conversions pass for all three supported numbering systems.
- Real-date fixtures compare raw Ganzhi before King Wen lookup.
- Calculation details render Chinese/English name, canonical number, mapping system, and version.
- Strict project checks and production build pass.

## Supersedes

The unversioned lookup described in the 2026-07-24 temporal-calculation handoff is superseded. Its
Ganzhi and boundary conventions remain unchanged.

## Superseded by

None.

## Related files and documents

- [`../../TEMPORAL_HEXAGRAM_MAPPING_AUDIT.md`](../../TEMPORAL_HEXAGRAM_MAPPING_AUDIT.md)
- [`../../SIXTY_JIAZI_HEXAGRAM_MAPPING.md`](../../SIXTY_JIAZI_HEXAGRAM_MAPPING.md)
- [`../../../src/domain/astrology/jiaZiHexagrams.ts`](../../../src/domain/astrology/jiaZiHexagrams.ts)
- [`../../../src/domain/astrology/hexagramNumbering.ts`](../../../src/domain/astrology/hexagramNumbering.ts)
- [`../../../fixtures/temporal-hexagram-validation/known-dates.json`](../../../fixtures/temporal-hexagram-validation/known-dates.json)
