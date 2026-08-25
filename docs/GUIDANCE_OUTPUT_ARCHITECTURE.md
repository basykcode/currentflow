# Guidance output architecture

## Repository findings

The repository already has a stable deterministic input seam, but it did not contain the semantic
systems named in the Guidance Output Layer specification.

| Requested input or layer  | Discovered implementation                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global Conditions Engine  | Not present. No runtime contract or reviewed global semantic classifier exists.                                                                                                 |
| Moment Signature          | Not present. `CurrentFlowSnapshot` is the closest aggregate, but it contains temporal facts rather than a semantic signature.                                                   |
| Four Temporal Hexagrams   | Present in `CurrentFlowSnapshot.temporal`, produced by `LunarScriptCurrentFlowProvider`.                                                                                        |
| Primary Current synthesis | Not present. The active provider deliberately returned interpretive synthesis as unavailable.                                                                                   |
| Existing OLTR             | The active Astrology OLTR was factual placeholder copy. Separate six-school hexagram OLTRs are static, source-grounded editorial drafts and are not a temporal guidance engine. |
| Frontend guidance         | `SynthesisPanel.vue` previously rendered provider-supplied strings and an empty execution list. It did no interpretation.                                                       |
| Methodology/versioning    | Snapshot providers expose a model version; commentary bundles have generation metadata. No shared guidance semantic or renderer version system existed.                         |
| Current Intelligence      | `IntelligenceView.vue` is a disconnected future shell. It does not calculate or synthesize guidance.                                                                            |

At the time this layer was introduced, live semantic synthesis happened nowhere. The later Temporal
Semantic Resolver v1 now supplies that boundary for its explicit 13-profile Current registry; see
[`TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md`](TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md).
Uncovered operative days remain unavailable rather than falling back to titles or commentary.

## Implemented boundary

The Guidance Output Layer lives under `src/domain/guidance`, following the repository convention
that framework-independent contracts and pure calculations live under `src/domain`. A new top-level
package was not introduced because this repository is a single strict-TypeScript Vite application,
has no package workspace, and the guidance engine has no independent runtime or dependency boundary.

```text
Temporal Semantic Resolver v1
  -> GuidanceSemanticInput
  -> resolveGuidanceSynthesis()
  -> GuidanceSynthesis
  -> OLTR + Intention + Execution selectors
  -> validateGuidanceBundle()
  -> GuidanceBundle
  -> Vue presentation
```

The input is already semantic. It includes a controlled `GuidanceCondition`, directions, texture,
lunar mode, field relationship, image family, day/hour themes, subordinate Macro Hour maturity,
categorical evidence weight,
provenance, and candidate validity boundaries. The guidance engine never receives raw dates,
GanZhi strings, hexagram numbers, organ periods, or source passages and therefore cannot silently
become a calendar or hexagram interpretation engine.

Seven controlled conditions resolve to exactly one primary response relation:

| Semantic condition | Response relation |
| ------------------ | ----------------- |
| emergence          | follow            |
| excess             | contain           |
| deficiency         | counterbalance    |
| completion         | complete          |
| threshold          | wait              |
| repair             | transform         |
| withdrawal         | withdraw          |

Completion may carry a high release profile and produce “complete, then withdraw” language, but
`complete` remains the single primary relation.

## Module map

```text
src/domain/guidance/
  types.ts
  guidanceEngine.ts
  synthesis/
    guidanceResolver.ts
    responseRelation.ts
    effortResolver.ts
    semanticVersion.ts
    validityWindow.ts
  oltr/
    renderer.ts
    validator.ts
    phraseBank.ts
  intention/
    lexicon.ts
    selector.ts
    validator.ts
  execution/
    actionLibrary.ts
    selector.ts
    validator.ts
  validation/
    coherenceValidator.ts
  index.ts
```

`GuidanceSynthesis` is the only semantic object consumed by the three output selectors. OLTR,
Intention, and Execution cannot independently inspect Astrology data. Every synthesis field is
carried in a `Versioned<T>` value. Evidence stores a versioned source identity, semantic claim,
categorical weight, and provenance record.

## Snapshot and frontend integration

`CurrentFlowSnapshot` now carries:

- `guidance: GuidanceBundle` for validated output or explicit unavailability;
- `relatedHexagrams` for deterministic structural relationships, kept outside guidance.

The demo provider supplies a curated, visibly demo-labeled semantic fixture so the complete output
and interaction path remains testable. The active LunarScript provider calls the Temporal Semantic
Resolver. It supplies available guidance when the operative day has an eligible profile and an
unavailable bundle otherwise. It caches either result until the earliest known Macro, Shíchen,
civil-day, or solar-term semantic boundary, so guidance identity does not churn every minute or
remain stale across a pillar change. A Micro Hour update changes presentation but not the semantic
resolution ID, evidence, validity, or cached bundle.

`operativeWork` separates `dayTheme`, `hourTheme`, and `hourMaturity`. Maturity evidence is typed as
`macro-hour`; no `micro-hour` evidence kind exists. OLTR, Intention, and Execution may use Macro as a
tie-breaker among already valid relation/effort-compatible candidates. It cannot change the Hour
Hexagram, response relation, effort level, primary Day work, or safety policy.

`CurrentFlowGlance` renders the bundle OLTR or its unavailable state. `GuidanceOutputPanel` renders
the selected controlled intention and bounded action. A user may choose one of the ranked intention
alternatives or request an execution category. Those events call pure domain functions that return
a newly validated bundle; the component does not interpret temporal fields or choose semantic state.
Changing intention retains the original synthesis, Primary Current, OLTR, validity window, and
versions, and reselects Execution only.

## Integration contract for temporal semantics

The current Temporal Semantic Resolver stops at `GuidanceSemanticInput`. Future Global Conditions
or Moment Signature inputs must preserve that boundary. They must:

1. own and document the deterministic or curated classification that selects `GuidanceCondition`;
2. supply versioned semantic directions, operative themes, and evidence without using this output
   layer to infer them from raw astrology;
3. supply all known next boundaries so the earliest semantic boundary controls expiration;
4. remain unavailable when a required semantic claim lacks reviewed support;
5. receive a separate decision, provenance review, and golden fixtures before replacing the active
   unavailable bundle.

No language model is required or called. A future language model may receive an already validated
bundle to improve phrasing, but its result must pass the same OLTR and cross-output validators and
must not change relation, intention, execution, evidence, versions, or validity.
