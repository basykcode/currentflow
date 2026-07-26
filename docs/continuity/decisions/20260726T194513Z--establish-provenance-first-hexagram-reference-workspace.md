# Decision: Establish a provenance-first hexagram reference workspace

- Status: accepted
- Date (UTC): 2026-07-26
- Scope: product, data, and frontend architecture

## Context

Hexagrams already appeared as calculated temporal factors and three related day structures, but they
were passive cards with only number, Chinese characters, an English title, and line geometry. The
product now needs one reusable inspection surface plus a complete 64-figure library, while future
commentary corpora and some advanced transformation rules are not yet available.

## Constraints and requirements

- Bottom-to-top line storage and deterministic calculations must remain authoritative.
- Traditional names, pinyin, Gene Keys keywords, and transformation results require visible
  provenance or availability state.
- Presentation must not invent commentary, divination outcomes, or an Absolute Shadow algorithm.
- Any hexagram shown in the ordinary interface must open the same accessible, responsive inspector.
- The static Vue SPA must make no new runtime network calls.

## Options considered

1. **Embed inspection logic in each card and route** — simple locally but duplicates calculations,
   state, and accessibility behavior. Rejected.
2. **Use a remote reference API** — would add an unnecessary network dependency and obscure source
   availability. Rejected.
3. **Create a verified local catalog, pure transformations, and one transient global inspector** —
   keeps facts deterministic, presentation focused, and every entry point consistent. Selected.

## Decision

Maintain a single 64-entry domain catalog with King Wen number, received Chinese name, tone-marked
pinyin, English display title, bottom-to-top lines, trigram identities, and source-linked official
Gene Keys Shadow/Gift/Siddhi terms. Label these fields `curated`.

Calculate nuclear, reverse, complement, upper/lower trigram exchange, and each user-selected
single-line change with pure domain functions. Label their results `computed`. Expose the first four
as the inspector's fixed relationship set and the six line changes as a separate control.

Mount one modal inspector at the application boundary and use a transient, non-persisted Pinia store
containing only the selected King Wen number. Route and card components request inspection without
owning modal logic.

Keep all six commentary views and Absolute Shadow visible but `unavailable` until their reviewed
content or deterministic rule is supplied.

## Rationale and supporting evidence

The local catalog extends the existing deterministic King Wen lookup without changing temporal
calculation authority. The Chinese Text Project provides the received Zhouyi names and romanization;
the official Gene Keys Living Library publishes the three short frequency-band terms for each
numbered Key. Pure line functions are exhaustively testable across all 64 figures and do not require
interpretive claims.

## Consequences and tradeoffs

- Every present and future hexagram entry point shares one interaction and accessibility boundary.
- The library works offline and introduces no secret, provider, or runtime integration.
- Static Gene Keys vocabulary must be reviewed if the official terminology changes.
- English translation preference is a display convention, not a claim that alternatives are wrong.
- Some structural results equal their source figure; the inspector truthfully shows that identity.
- Commentary and Absolute Shadow surfaces are intentionally incomplete rather than speculative.

## Implementation or migration implications

- `DataStatus` adds `curated` for reviewed static references.
- `src/domain/astrology` owns trigrams, Gene Keys terms, catalog ordering, and transformations.
- `src/stores/hexagramInspector.ts` owns transient selection only.
- `App.vue` mounts the shared dialog, and `/tools/hexagrams` hosts the complete grid.

## Verification criteria

- The catalog, every ordering, and Gene Keys vocabulary contain 64 unique numbered entries.
- All four fixed relationships and every one-line change resolve into the verified catalog.
- Existing temporal and related hexagram cards plus library cards open the same inspector.
- The dialog supports keyboard close, focus containment, responsive stacking, and explicit statuses.
- Commentary and Absolute Shadow return no fabricated result.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../CALCULATION_SOURCES.md`](../../CALCULATION_SOURCES.md)
- [`../../DATA_INTEGRATION.md`](../../DATA_INTEGRATION.md)
- [`../../../src/domain/astrology/hexagrams.ts`](../../../src/domain/astrology/hexagrams.ts)
- [`../../../src/domain/astrology/transformations.ts`](../../../src/domain/astrology/transformations.ts)
- [`../../../src/components/hexagrams/HexagramInspector.vue`](../../../src/components/hexagrams/HexagramInspector.vue)
