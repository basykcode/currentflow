# Data integration

The stable seam is `CurrentFlowProvider.getSnapshot(at: Date)`. The active adapter is selected in `src/providers/currentFlow.ts`; replacing that binding is enough to move from fixtures to a verified provider.

## Planned connections

- **Verified temporal engine:** supplies year, month, day, and hour hexagrams, GanZhi labels, timestamps, and deterministic factor records. It must return explicit line arrays and never rely on display components for calculation.
- **Organ-clock engine:** supplies the active organ period from a documented source and timezone-aware clock rules. Its output remains educational context and must not become a medical claim.
- **Personal BaZi:** enters through a separate personal-context contract. Global temporal facts and personal facts remain separate before synthesis.
- **AI synthesis:** receives only verified facts, curated passages, user-controlled context, and provenance. It may phrase OLTR, intention, execution, and explanations, but may not invent hexagrams, calendar facts, organ periods, or transformations.

## Deterministic authority

Calendar conversion, stems and branches, hexagram construction, transformation relationships, organ-clock selection, and all source identifiers must remain deterministic or explicitly unavailable. When a required input or verified algorithm is absent, the adapter returns `unavailable`; it does not guess.

## Provenance

Every display datum carries a `DataStatus` and a source label. Snapshots add provider ID, model version, factor labels, and notes. The UI displays local status near each datum and exposes snapshot-level provenance below the synthesis. The alpha adapter uses `demo` everywhere and plainly states that no temporal calculation occurred.
