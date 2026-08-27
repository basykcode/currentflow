# Temporal Semantic Resolver architecture

## Purpose

The Temporal Semantic Resolver owns the deterministic boundary between four calculated temporal
hexagrams and the Guidance Output Engine:

```text
lunar-javascript + reviewed Jia Zi projection
  -> Year / Month / Day / Hour canonical hexagram identities
  + authoritative Chū or Zhèng maturity
  -> Current Temporal Semantic Resolver
  -> GuidanceSemanticInput
```

It is a composition engine, not a lookup database of complete Temporal States. The durable registry
contains one profile per canonical King Wen hexagram. Each request resolves and composes only the
four profiles named by that instant.

## Separate meaning layers

The canonical registry under `src/domain/astrology` owns received names, numbers, trigrams, line
structure, and source labels. Commentary repositories own source-grounded school summaries and
evidence. The semantic resolver owns a distinct Current product layer: movement, texture, response,
effort, vectors, verb policy, and intention preferences.

The resolver does not import commentary and does not use titles as instructions. Its 64 profiles are
`spec-reviewed` Current operational formalizations. Empty reviewer lists are intentional; no human
approval or traditional attribution is fabricated.

## Registry and validation

`src/domain/guidance/semantic-resolver/hexagrams/profiles.ts` contains profiles 1–64 in canonical
order. Runtime registry validation requires:

- exactly one profile for every King Wen number 1–64;
- canonical identity resolution;
- nonempty, duplicate-free controlled dimensions;
- known intention IDs with relation/effort overlap;
- no preferred/forbidden verb collision;
- valid versions and honest review metadata.

Hexagram 28 continues to use the controlled `narrow` vector and retains `reduce` only as a verb.

## Four-scale composition

Composition retains ordinal precedence:

| Scale | Role | Internal rank |
| --- | --- | ---: |
| Day | operative Primary Current | 8 |
| Hour | immediate modifier | 4 |
| Month | near background | 2 |
| Year | broad background | 1 |

The integers express ordering only, not probability or confidence. Day remains authoritative even
when all lesser scales oppose it. Stable weighting resolves relation, directions, texture, profile
lunar compatibility, image family, strategies, verbs, and intention preferences. Effort chooses the
least demanding shared value; an incompatibility uses the least demanding Day-compatible value and
retains an explicit conflict record.

Month and Year become typed temporal backgrounds. They are not mislabeled as astronomical or
seasonal signals.

## Environment adapter

After temporal resolution, `guidanceEnvironment.ts` adds categorical facts already calculated for
the same instant:

- Cantong 震/兌/乾/巽/艮/坤 -> emerging/building/culminating/releasing/resting/threshold;
- annual Yin/Yang movement -> subordinate guidance direction;
- Spring/Summer/Autumn/Winter -> Current-formalized background vectors;
- active Organ -> identity and Five Phase for downstream Execution ranking.

The adapter does not alter the Day Primary Current or response relation. Actual Cantong tempo
overrides the profile-compatibility lunar mode when present. Annual movement overrides only the
secondary direction. Season is appended as `seasonal-current`. Raw astronomy measurements do not
enter the semantic model.

## Coverage and defensive unavailability

Canonical 1–64 coverage makes all valid temporal pillar combinations complete. Defensive partial or
unavailable types remain because upstream temporal identities may still be malformed, absent, or
explicitly unavailable. The resolver never substitutes a title, commentary, neighboring hexagram,
or generated meaning.

Environmental absence is separate from profile coverage. Missing Cantong or season data carries an
unavailable or partial evidence record. Profile lunar compatibility may remain as an explicitly
labeled fallback; no seasonal background is inferred.

## Macro maturity, identity, and validity

The resolver accepts only `macroHour` and `macroSemantic` from the authoritative Shíchen coordinate.
Chū favors entry or light establishment; Zhèng favors continuation or consolidation. Macro does not
change the Hour hexagram, response relation, effort, or safety. Micro Hour never enters semantic
identity, evidence, or validity.

Resolution identity contains the four profile numbers and Macro state. The provider adds timezone,
active Organ, Cantong node and interval, and solar term and interval. Guidance expires on the first
future Macro, Shíchen, civil-day, Cantong, or solar-term boundary.

## Verification

Unit tests verify registry coverage, canonical reuse, Day precedence, conflicts, evidence separation,
environment mappings, deterministic repeat output, and exact validity boundaries. The generated
closure matrix executes 8,192 Day/Hour/Macro combinations through the complete output engine. It is
a test loop over runtime functions, not a persisted or precomputed state corpus.
