# Guidance output architecture

## Authoritative flow

The Home guidance path is deterministic and one-way:

```text
AstrologyView
  -> celestialCurrentProvider.calculate(instant, mode)
  -> one GlobalConditionsSnapshot
  -> currentFlowProvider.getSnapshot(instant, { globalConditions, mode, timezone })
  -> Temporal Semantic Resolver + guidance environment adapter
  -> GuidanceSemanticInput
  -> GuidanceSynthesis
  -> OLTR / 3 Intentions / 3 Elemental Executions
  -> GuidanceBundle
```

Astronomy is calculated once per authoritative sampling cycle. The guidance environment adapter
reads only reviewed categorical fields from that exact snapshot and never imports or invokes the
astronomy provider. The temporal provider rejects a supplied Global Conditions snapshot from a
different instant.

## Domain boundaries

Framework-independent contracts and calculations live under `src/domain/guidance`; provider
adapters live under `src/providers`; Vue renders the resulting bundle without reinterpreting it.

```text
src/domain/guidance/
  types.ts
  guidanceEngine.ts
  semantic-resolver/
  synthesis/
  oltr/
  intention/
  execution/
  validation/

src/providers/
  guidanceEnvironment.ts
  lunarScriptCurrentFlow.ts
  localDeterministicCelestialCurrent.ts
```

Canonical hexagram identity and source-grounded commentary remain separate from Current operational
semantics. The engine neither imports narrative commentary nor turns a title into advice. All 64
semantic profiles are original Current product formalizations marked `spec-reviewed`; that status
does not claim human editorial review.

`GuidanceSynthesis` is the sole object consumed by OLTR, Intention, and Execution. Versioned fields
carry condition, direction, texture, lunar mode, Day/Hour work, Macro maturity, active Organ,
backgrounds, response vectors, and evidence. The output layer never receives raw dates, GanZhi, or
freeform model output.

## Environmental integration

The adapter adds four bounded signals:

- active Organ identity and Five Phase from the authoritative local-civil Organ clock;
- Cantong qi node mapped to the six controlled lunar-tempo values;
- annual Yin/Yang movement mapped to subordinate direction;
- Chinese solar season mapped to a named Current work background.

Raw angles, illumination, lunation fractions, waxing/waning, and Branch month do not enter guidance.
Seasonal work vectors and all Organ-to-task affinities are explicitly Current formalizations.
Evidence preserves `verified`, `computed`, `partial`, and `unavailable` status. Missing environment
data remains visible and does not silently pose as a computed signal.

The active Organ affects output selection only through Elemental Execution ranking. It is also
recorded in synthesis provenance and cache identity, and it refreshes at the authoritative Shíchen
boundary. It cannot alter the temporal field, Primary Current, response relation, effort, OLTR,
intention eligibility, or safety.

## Availability and closure

The registry covers canonical King Wen profiles 1–64, so every valid four-pillar temporal snapshot
has complete semantic-profile coverage. Defensive unavailable handling remains for malformed,
noncanonical, or unavailable source input. Intention relation closure and the five-definition
Execution library guarantee three valid choices by construction; the bundle validator enforces that
guarantee at runtime.

No table of cross-products exists. State-space tests call the same public functions used in
production and discard each generated bundle.

## Snapshot, cache, and selected-time behavior

`CurrentFlowSnapshot` carries a `GuidanceBundle`. Live mode caches a bundle only while
`validFrom <= instant < validUntil`. Selected mode always computes from the selected instant,
bypasses the live cache, and never replaces it. Returning to live mode can therefore reuse the
untouched live bundle when still valid.

Validity candidates include Macro, Shíchen, civil day, lunar node, and both available solar-term
boundaries. Micro Hour is excluded. The page schedules its next live sample at the earlier of the
Celestial Current refresh and guidance expiration.

## Frontend behavior

`GuidanceOutputPanel` shows the OLTR, three full ranked intention cards, and three full ranked
Elemental work-domain cards. Choosing an intention calls `selectGuidanceIntention()`; it preserves
the synthesis and OLTR and re-ranks only the three Execution domains. There is no manual category
preference selector and no atomic “next task” instruction.

The panel names the active Organ, highlights its represented Phase, lists five examples for each
domain, and labels the traditional correspondence versus Current task formalization. Responsive,
focus-visible, reduced-motion, and natural-scrolling behavior remain required.

## Failure and future AI boundary

Known guidance-construction validation failures become explicit unavailable bundles. Unexpected
programming faults propagate rather than being hidden behind generic unavailability. No runtime
language model is required. Any future language layer is downstream of deterministic selection and
cannot change relation, intention, Execution rank, evidence, versions, or validity.
