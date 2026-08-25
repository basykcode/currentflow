# Temporal Semantic Resolver architecture

## Purpose and discovered boundary

Current already calculates four deterministic temporal pillars and maps each GanZhi value to a
canonical King Wen hexagram. The Guidance Output Layer already converts a structured
`GuidanceSemanticInput` into one validated Guidance Synthesis, OLTR, controlled Intention, and
bounded Execution. Before this implementation, nothing owned the conversion between those two
layers; the live provider therefore returned guidance as unavailable.

The Temporal Semantic Resolver v1 now owns that missing conversion:

```text
lunar-javascript + reviewed Jia Zi mapping
  -> year / month / day / hour hexagram identities
  + authoritative Macro Hour maturity
  -> Temporal Semantic Resolver v1
  -> GuidanceSemanticInput adapter
  -> Guidance Synthesis
  -> OLTR / Intention / Execution
```

Repository inspection found no separate Global Conditions Engine, Moment Signature, Four-Scale
Resonance module, or Primary Current classifier. `CurrentFlowSnapshot.temporal` is the deterministic
input boundary. The resolver introduces a minimal four-scale composition and Primary Current
classification without claiming those absent systems exist.

## Two strictly separate meaning layers

The canonical hexagram registry under `src/domain/astrology` owns received names, numbering,
trigrams, line structure, and source labels. Static commentary repositories own source-grounded
school summaries and their evidence/review metadata. The resolver neither imports commentary nor
uses a hexagram title as an instruction.

The resolver registry is a different product layer:

| Layer                             | Owns                                                                                            | Does not own                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Classical identity and commentary | received identity, source texts, translations, commentary evidence                              | automatic advice or Current action policy                     |
| Current Semantic Layer v1         | operational movement, texture, response, effort, vectors, verb policy, compatible intention IDs | historical claims, translations, forecasts, personal readings |

Every resolver evidence record carries canonical identity provenance and Current profile provenance
in separate fields. A Current semantic profile is never described as a classical attribution.

## Module map

The repository is a single strict-TypeScript application rather than a package workspace, so the
requested package boundary is implemented under the existing framework-independent guidance domain:

```text
src/domain/guidance/semantic-resolver/
  types.ts
  resolver.ts
  composition.ts
  weighting.ts
  conflict.ts
  evidence.ts
  versions.ts
  hexagrams/
    registry.ts
    profiles.ts
    validation.ts
  rules/
    responseRelationRules.ts
    effortRules.ts
    vectorRules.ts
```

No resolver module imports Vue, browser state, a provider, a language model, or commentary content.
The provider calls the pure resolver and then passes an available result through
`toGuidanceSemanticInput()`.

## Controlled semantic model

`types.ts` defines closed unions for field direction, texture, lunar mode, response relation,
effort, strategic vector, somatic vector, and image family. Profiles use these primitives as their
primary data. Notes and verbs are bounded metadata, not an alternative freeform interpretation
system.

The resolver's `LunarMode` is a Current operational compatibility classification selected from
profile composition. It is not an astronomical lunar phase and does not claim that a lunar-node
engine is connected. Likewise, `FieldTexture` is an operational quality and not a weather
observation.

The initial registry contains only:

| Hexagram | Current operational coverage             |
| -------: | ---------------------------------------- |
|        1 | emergence and expansion                  |
|        2 | reception and consolidation              |
|       12 | contraction and protected waiting        |
|       18 | repair and restoration                   |
|       28 | culmination, containment, and completion |
|       48 | maintained access and restoration        |
|       52 | stillness and boundary retention         |
|       53 | gradual emergence                        |
|       57 | adaptive entry                           |
|       61 | clarification and receptive verification |
|       62 | small-scale completion and restraint     |
|       63 | secured completion                       |
|       64 | transition before completion             |

The specification listed `reduce` as a Hexagram 28 strategic vector even though `reduce` is not in
the controlled `StrategicVector` union. The profile uses `narrow` as the structured vector and keeps
`reduce` as a preferred verb. No extra primitive was silently introduced.

## Review and version policy

The initial profiles are `spec-reviewed`: they pass the Temporal Semantic Resolver v1 product
specification and registry validation. This status is deliberately not `human-approved`; reviewer
IDs remain empty rather than fabricating an editorial identity. A later human review must supply a
real reviewer identifier before changing that status.

Independent versions cover the resolver, registry, profile schema/content, composition, response
rules, effort rules, and vector rules. A profile update changes its semantic profile version; a
composition-policy change changes the resolver/composition version. Guidance bundles carry the
resolver version as `temporalSemantics`, and evidence carries the exact profile and registry
versions.

Runtime validation rejects duplicate profiles, non-canonical hexagram numbers, empty controlled
dimensions, duplicate values, unknown intention IDs, preferred/forbidden verb overlap, invalid
versions, incomplete review metadata, and long interpretive notes.

## Four-scale composition

Composition uses the following ordinal precedence:

| Scale | Role                      | Internal rank |
| ----- | ------------------------- | ------------: |
| Day   | operative Primary Current |             8 |
| Hour  | immediate modifier        |             4 |
| Month | near background           |             2 |
| Year  | broad background          |             1 |

These integers express precedence only. They are not probabilities, confidence scores, traditional
numerology, or displayed precision. The binary ranks guarantee that all lesser scales together
cannot silently overturn a day contribution while still allowing them to resolve ties among the
day's compatible values.

Response relation, directions, texture, lunar mode, image family, strategies, verbs, and compatible
intentions use stable weighted ordering. Effort selects the least demanding level shared by all
available profiles. If no shared effort exists, it selects the least demanding day-compatible level
and records an effort conflict. Direction, relation, effort, and verb-policy conflicts are retained
in the resolution with the rule that resolved them.

## Coverage and availability

An eligible day profile is mandatory because the day is the operative scale. If it is absent, the
resolver returns `unavailable` with the exact missing hexagram numbers. When the day is covered but
one or more lesser scales are not, the resolver returns `available` with `partial` coverage,
retains every missing profile number, and composes only reviewed records. It never substitutes a
title, commentary, neighboring hexagram, or generated meaning.

The live provider now publishes guidance only for dates whose operative day is in the 13-profile
registry. Other dates retain the existing explicit unavailable bundle. Both available and
unavailable bundles expire at the earliest exact Macro Hour, Shíchen, civil-day, or solar-term
boundary and remain cache-stable between boundaries. Micro Hour is absent from resolver identity,
evidence, and validity.

## Macro Hour maturity

The resolver input includes only `macroHour` and `macroSemantic` from the authoritative
`HourPhase`; no Micro field exists. Resolution identity includes Chū or Zhèng. `HourMaturity`
records relation-compatible supported verbs, discouraged escalation verbs, methodology version,
and evidence kind `macro-hour`.

Chū favors proportionate entry, orientation, or light establishment within the response already
selected by the Day/Hour composition. Zhèng favors continuation, stability, or consolidation. The
modifier cannot change the primary Day work, Hour Hexagram, response relation, effort level, safety
rules, or forbidden verb policy. OLTR and candidate selectors use it only as deterministic scoring
among already-valid options.

## Guidance adapter

The existing Guidance Output Layer has an older presentation-oriented vocabulary. The adapter maps
resolver primitives into that vocabulary explicitly rather than duplicating or rewriting the OLTR,
Intention, and Execution engines. It passes the resolver-selected response relation, effort,
strategic/somatic vectors, preferred/forbidden verbs, and compatible intention IDs as authoritative
input. Guidance Synthesis verifies that the supplied relation agrees with the controlled condition
and selects intentions only from the resolver-approved set.

The adapter exposes `operativeWork.dayTheme`, `hourTheme`, and `hourMaturity`. It generates short
controlled labels for display and legacy scoring. These labels do not
create new semantic state. An LLM is neither called nor required; future language assistance may
only phrase an already selected, validated result under the existing output validators.
