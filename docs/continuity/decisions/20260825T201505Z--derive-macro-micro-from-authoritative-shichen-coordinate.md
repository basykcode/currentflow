# Decision: Derive Macro and Micro from the authoritative Shíchen coordinate

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: temporal calculation, DST behavior, guidance semantics, validity, and Organ System UX

## Context

The migrated branch contained a civil-hour parity calculation and an eight-step Current cultivation
envelope. The product now requires exact Chū/Zhèng/Kè boundaries, DST-safe behavior, and a semantic
Macro maturity modifier without giving Micro intervals unsupported meanings.

## Decision

Use the provider's explicit instant and selected IANA local-civil projection as the single active
Shíchen basis. Resolve a normalized 120-basis-minute coordinate and all future boundaries through
that same projection. The pure `temporal-hour-phase:chu-zheng-ke-96-v1` classifier consumes the
coordinate; Vue renders it but never recalculates it.

Chū and Zhèng become a versioned Current Hour maturity modifier subordinate to Day, Hour Hexagram,
response relation, effort, and safety. Macro enters semantic identity, evidence, candidate scoring,
and validity. Phase 0–3 remains observational and never enters guidance in v1.

Replace the home label `Internal State` with `ORGAN SYSTEM` and present the whole Shíchen through a
dependency-free SVG timeline and one shared Taiji component. Use minute-aligned recursive sampling;
freeze controlled selected instants; respect reduced motion.

## Alternatives rejected

- Fixed UTC subtraction: fails when a local-civil Shíchen spans 60 or 180 real minutes at DST.
- Vue hour/minute classification: duplicates authority and can disagree with Organ/hour identity.
- Retaining eight cultivation meanings: assigns unsupported semantics to Micro intervals.
- Micro guidance refresh: adds semantic volatility unsupported by the model.
- A timeline library or remote Taiji asset: unnecessary surface and provenance risk.

## Consequences

Spring gaps and fall repeats follow the existing IANA projection policy and report nonstandard real
duration. Future solar-time modes can provide the same coordinate contract. Macro can change OLTR
phrasing and candidate ordering without changing Hour identity or effort. Guidance stays stable at
ordinary Kè boundaries.

## Supersedes

The cultivation-model portion of
`20260825T184547Z--orient-temporal-hierarchy-and-formalize-ke-cultivation.md` is superseded. Its
unrelated glyph geometry and temporal hierarchy decisions remain accepted.

The `Internal State` presentation choice in
`20260825T193506Z--balance-five-card-inner-geometry.md` is superseded by `ORGAN SYSTEM`; its shared
card geometry remains accepted.

## Verification criteria

Exact phase/event fixtures, same-instant timezone tests, DST spring/fall fixtures, controlled
simulation, Macro/Micro provider cache behavior, semantic subordination, timeline structure,
accessibility, reduced motion, responsive browser checks, and the full repository gate must pass.
