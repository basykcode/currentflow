# Decision: Gate guidance output on versioned semantic input

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: Guidance domain architecture, provenance, product behavior, and safety

## Context

The product requires deterministic OLTR, Intention, and Execution outputs. The repository already
calculates four temporal hexagrams, but it has no reviewed Global Conditions Engine, Moment
Signature, Primary Current classifier, or mapping from those facts to operative semantic state.
The existing architecture explicitly forbids unverified interpretive synthesis.

## Constraints and requirements

- Do not infer semantic meaning directly from raw dates, GanZhi, organ periods, or hexagram numbers.
- Keep one semantic object authoritative for OLTR, Intention, and Execution.
- Preserve explicit provenance, versioning, qualitative effort, safety, and unavailability.
- Keep the static SPA functional without an LLM or runtime service.
- Allow future phrasing assistance only after deterministic selection.

## Options considered

1. **Assign semantics directly from the four temporal hexagrams** — rejected because no reviewed
   mapping exists and it would create an unsourced second interpretation engine.
2. **Generate guidance through a freeform language-model prompt** — rejected because model output
   would own semantic selection and could bypass reproducibility, provenance, and safety.
3. **Accept a versioned semantic input and deterministically select all outputs** — accepted because
   it makes the output layer complete and testable while preserving the unavailable state until an
   upstream semantic classifier is reviewed.

## Decision

Create `src/domain/guidance` as a framework-independent output layer. It accepts only a resolved,
versioned `GuidanceSemanticInput`, produces one `GuidanceSynthesis`, and deterministically renders
OLTR, controlled Intention, and bounded Execution before cross-output validation. The active
LunarScript provider returns and boundary-caches an unavailable bundle until a separately reviewed
semantic classifier is connected. The demo provider supplies an explicit demo semantic fixture.

## Rationale and supporting evidence

Repository inspection found deterministic calendrical and structural calculations but no live
semantic classifier. The accepted provider/provenance decisions require missing interpretation to
remain unavailable rather than inferred. A semantic-input gate lets the requested output engine be
fully implemented without weakening those decisions.

## Consequences and tradeoffs

- Output selection, safety, alternatives, validity, and versioning are deterministic and testable.
- The live page remains honest about unavailable guidance until upstream semantic work is accepted.
- A later semantic engine must supply a richer typed contract and evidence rather than passing raw
  Astrology facts to the output layer.
- The demo provider can display the complete interaction but must remain visibly demo-labeled.

## Implementation or migration implications

- `CurrentFlowSnapshot.guidance` replaces the former freeform synthesis fields.
- Deterministic structural relationships move to `CurrentFlowSnapshot.relatedHexagrams`.
- Future semantic work must target `GuidanceSemanticInput` and supply candidate boundary instants.
- Future AI phrasing must preserve selected state and pass the same validators.

## Verification criteria

- The five acceptance conditions resolve to their expected response relations.
- No guidance module imports a provider, Vue, a language-model client, or raw source evidence.
- Invalid OLTR, intention, execution, or cross-output combinations are rejected.
- Live guidance remains unavailable and stable until its next boundary; demo guidance renders the
  complete bundle.
- Strict repository checks and production build pass.

## Supersedes

None. This fulfills the previously reserved “separately verified synthesis model” boundary without
superseding the deterministic-authority decisions.

## Superseded by

The active-provider unavailability clause is superseded by
[Adopt a versioned Current temporal semantic resolver](20260822T225700Z--adopt-versioned-current-semantic-resolver.md)
and [Complete runtime guidance and rank Elemental work domains](20260827T201839Z--complete-runtime-guidance-and-elemental-execution.md),
which also supersedes the atomic Execution behavior. Defensive unavailability remains for malformed
or unavailable upstream input and typed fail-closed construction. The semantic-input gate remains
accepted.

## Related files, issues, handoffs, and commits

- [`../../GUIDANCE_OUTPUT_ARCHITECTURE.md`](../../GUIDANCE_OUTPUT_ARCHITECTURE.md)
- [`../../GUIDANCE_OUTPUT_ENGINE.md`](../../GUIDANCE_OUTPUT_ENGINE.md)
- [`../../../src/domain/guidance`](../../../src/domain/guidance)
- [Preserve deterministic authority](20260723T233411Z--preserve-deterministic-authority-through-provider-and-provenance-contracts.md)
- [Calculate temporal facts with declared source boundaries](20260723T235840Z--calculate-temporal-facts-with-declared-source-boundaries.md)
