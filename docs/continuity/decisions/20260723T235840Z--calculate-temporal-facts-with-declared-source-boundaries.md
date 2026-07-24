# Decision: Calculate temporal facts with declared source boundaries

- Status: accepted
- Date (UTC): 2026-07-23
- Scope: data, dependency, product behavior, and calculation conventions

## Context

The alpha displayed only fixtures. The product now needs a truthful current configuration, including
the verified acceptance case that the present 2026 year is the Yang Fire Horse pillar and maps to
Hexagram 28, plus a timezone-correct organ period.

## Constraints and requirements

- Traditional source data and calculations must not be fabricated.
- Calendar facts, I Ching mappings, organ periods, structural relationships, and prose synthesis
  have different authorities and must remain distinguishable.
- The application remains client-side and must make no hidden network call at runtime.
- Timezone choice must affect all civil-time calculations.
- Differing GanZhi boundary conventions must be selected explicitly.

## Options considered

1. **Keep the demo provider** — preserved presentation quality but did not answer the requirement and
   continued showing false present-state fixtures.
2. **Infer date-to-hexagram formulas from examples** — could fill every card but would fabricate a
   method and violate deterministic authority.
3. **Compose a calendrical library with versioned traditional lookup data** — supplies complete,
   testable results while keeping each authority and convention visible. Selected.

## Decision

Use `lunar-javascript` 1.7.7 to calculate exact GanZhi year and month pillars, the sect-2 day pillar,
and the two-hour pillar from civil time in the selected IANA timezone. Resolve each GanZhi through the
documented `60 Jia Zi to 64 Da Gua` table. Select the organ period through the cited twelve-window
meridian-clock table. Derive nuclear, reverse, and complementary day-hexagram relationships only
through explicit line transformations.

Do not generate interpretive synthesis or recommended actions. Return those fields as `unavailable`
until a separately verified synthesis model exists.

## Rationale and supporting evidence

- The library's official GanZhi API documents exact Li Chun and solar-term methods and the two
  competing late-Zi day conventions.
- The 60 Jia Zi table supplies a complete lookup and confirms `丙午` → Hexagram 28.
- A published TCM reference table supplies all twelve organ-clock windows.
- Timezone projection through `Intl` avoids relying on the library for a timezone feature it does not
  expose.

## Consequences and tradeoffs

- Every current pillar, hexagram, and organ period is now deterministic and locally reproducible.
- The selected date-boundary conventions are stable and documented but are not the only traditions.
- Solar-term boundary accuracy inherits the calendar library and needs extra cross-library fixtures.
- Civil-time organ selection does not claim apparent-solar-time correction without coordinates.
- The interface contains less guidance copy because unavailable interpretation is shown honestly.

## Implementation or migration implications

- `CurrentFlowProvider.getSnapshot` accepts optional timezone and location context.
- `CurrentFlowSnapshot.synthesis` and structural relationships expose their own status and source.
- The active adapter changes from `DemoCurrentFlowProvider` to `LunarScriptCurrentFlowProvider`.
- Settings timezone becomes a functional input rather than a scaffold.

## Verification criteria

- A New York snapshot at 2026-07-23 12:00 shows Yang Fire Horse and Hexagram 28.
- The same snapshot shows Heart for 11:00–13:00.
- Every civil hour maps to its documented organ period.
- All 60 Jia Zi entries and all 64 King Wen figures are present.
- Strict checks, unit tests, production build, and responsive browser inspection pass.

## Supersedes

The demo-only active-provider portion of
[Preserve deterministic authority through provider and provenance contracts](20260723T233411Z--preserve-deterministic-authority-through-provider-and-provenance-contracts.md).
The provider/provenance contract itself remains accepted.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../CALCULATION_SOURCES.md`](../../CALCULATION_SOURCES.md)
- [`../../../src/providers/lunarScriptCurrentFlow.ts`](../../../src/providers/lunarScriptCurrentFlow.ts)
- [`../../../src/domain/astrology/jiaZiHexagrams.ts`](../../../src/domain/astrology/jiaZiHexagrams.ts)
- [`../../../src/domain/astrology/organClock.ts`](../../../src/domain/astrology/organClock.ts)
