# Data integration

The stable seam is `CurrentFlowProvider.getSnapshot(at: Date, context?)`. The active adapter is
selected in `src/providers/currentFlow.ts`; replacing that binding remains enough to change the data
implementation.

## Active connections

- **Temporal engine:** `LunarScriptCurrentFlowProvider` uses `lunar-javascript` for timezone-projected
  GanZhi pillars, then the versioned 60 Jia Zi to 64 Da Gua lookup for hexagrams.
- **Organ-clock engine:** a pure domain table selects the documented two-hour period from civil time
  in the snapshot timezone.
- **Structural relationships:** pure line transformations calculate nuclear, reverse, and
  complementary forms from the day hexagram.
- **Local context:** the Settings timezone is active; invalid values fall back to the device timezone
  and appear in provenance. The optional location label is display-only and no geolocation is used.

Full sources and boundary conventions are in
[`CALCULATION_SOURCES.md`](CALCULATION_SOURCES.md).

## Planned connections

- **Personal BaZi:** enters through a separate personal-context contract. Global temporal facts and personal facts remain separate before synthesis.
- **AI synthesis:** receives only verified facts, curated passages, user-controlled context, and provenance. It may phrase OLTR, intention, execution, and explanations, but may not invent hexagrams, calendar facts, organ periods, or transformations.

## Deterministic authority

Calendar conversion, stems and branches, hexagram construction, transformation relationships, organ-clock selection, and all source identifiers must remain deterministic or explicitly unavailable. When a required input or verified algorithm is absent, the adapter returns `unavailable`; it does not guess.

## Provenance

Every display datum carries a `DataStatus` and a source label. Snapshots add provider ID, model
version, factor labels, and notes. The UI displays local status near each datum and exposes
snapshot-level provenance below the synthesis. Calculated facts are labeled `computed`; interpretive
synthesis remains `unavailable`.
