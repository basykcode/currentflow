# Decision: Adopt a versioned Current temporal semantic resolver

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: temporal interpretation architecture, product behavior, provenance, and review policy

## Context

The deterministic Astrology provider calculates four temporal hexagrams, and the Guidance Output
Layer safely expresses already-resolved semantics. The missing boundary was a deterministic,
reviewable Current ontology that could classify those symbolic conditions without treating a title,
commentary, or language model as operational advice.

## Constraints and requirements

- Keep canonical identity/commentary evidence separate from Current product semantics.
- Do not create unsupported mappings for all 64 figures.
- Make response relation, effort, vectors, verbs, and compatible intentions deterministic.
- Preserve partial coverage and conflicts rather than filling gaps.
- Do not claim human review without a real reviewer identity.

## Options considered

1. **Interpret titles or commentary at runtime** — rejected because it merges classical and product
   layers and makes operational selection depend on prose.
2. **Generate a semantic profile with a language model for every request** — rejected because the
   result would not be stable, versioned, or independently reviewable.
3. **Create a closed Current registry with deterministic four-scale composition** — accepted because
   every input, rule, conflict, version, and output remains inspectable and testable.

## Decision

Create `src/domain/guidance/semantic-resolver` with controlled semantic primitives, a validated
13-hexagram MVP registry, ordinal day/hour/month/year composition, conflict records, separated
evidence, and an explicit adapter into `GuidanceSemanticInput`.

The day is operative and required. Internal precedence is day 8, hour 4, month 2, year 1; these are
ordinal ranks rather than confidence values. Lesser missing profiles permit visibly recorded partial
coverage, but a missing day profile returns unavailable.

Initial profiles use `spec-reviewed`, meaning checked against the product specification. They are
not `human-approved`, and no reviewer identity is invented. Canonical hexagram provenance supports
identity only; Current profile provenance supports operational vectors.

## Consequences and tradeoffs

- Live guidance becomes available on days covered by the initial registry and stays unavailable on
  other days.
- The resolver is reproducible and can be expanded one reviewed profile at a time.
- Partial coverage is useful but less complete than four reviewed scale profiles; missing numbers
  remain explicit in the resolution.
- The adapter preserves the already-verified output engine but requires maintained mappings between
  resolver and guidance vocabularies.
- Product-specification review enables an auditable MVP without mislabeling automated work as human
  editorial approval.

## Verification criteria

- The registry resolves only through canonical hexagram identities and contains exactly 13 profiles.
- Hexagram 28 uses `narrow` as its vector and `reduce` only as a verb.
- Day precedence, conflict handling, partial/unavailable behavior, evidence separation, and repeated
  deterministic output have unit coverage.
- A live provider fixture with day Hexagram 57 produces validated guidance; an uncovered day remains
  unavailable.
- Strict project checks and the production build pass.

## Supersedes

The active-provider unavailability clause in
[Gate guidance output on versioned semantic input](20260822T222049Z--gate-guidance-output-on-versioned-semantic-input.md)
is superseded only where an eligible resolver profile now supplies that input. The output gate and
all deterministic-authority requirements remain accepted.

## Superseded by

[Complete runtime guidance and rank Elemental work domains](20260827T201839Z--complete-runtime-guidance-and-elemental-execution.md)
supersedes the 13-profile limitation and partial canonical coverage expectation. The deterministic
semantic-input gate, source separation, precedence, provenance, and review policy remain accepted.

## Related files and documents

- [`../../TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md`](../../TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md)
- [`../../../src/domain/guidance/semantic-resolver`](../../../src/domain/guidance/semantic-resolver)
- [`../../GUIDANCE_OUTPUT_ARCHITECTURE.md`](../../GUIDANCE_OUTPUT_ARCHITECTURE.md)
