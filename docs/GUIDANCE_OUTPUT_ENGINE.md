# Guidance Output Engine

## Purpose

The Guidance Output Engine turns one already-resolved temporal state into one coherent bundle:

- **OLTR:** one validated `FIELD CLAUSE; RESPONSE CLAUSE.` sentence;
- **Intention:** exactly three ranked choices from the controlled 15-entry lexicon;
- **Execution:** exactly three ranked Five Phase work domains, including the active Organ's element.

This is a pure deterministic TypeScript engine, not a database of temporal combinations. It stores
64 individual semantic profiles, 15 intention definitions, five Elemental work-domain definitions,
and composition rules. For each requested instant, the provider resolves the four identities and
the engine composes only those profiles at runtime. It does not precompute or persist the nominal
60⁴ (12,960,000-row) four-pillar cross-product—or any environment-enriched cross-product—call a
model, inspect browser state, or make a network request.

## Runtime flow

```text
four temporal hexagram profiles
  + authoritative Macro Hour
  + active Organ and Five Phase
  + Cantong qi node and solar season when available
  -> GuidanceSemanticInput
  -> one versioned GuidanceSynthesis
  -> OLTR + 3 Intentions + 3 Elemental Executions
  -> validateGuidanceBundle()
```

All three outputs consume the same `GuidanceSynthesis`. Output selectors never calculate from raw
dates, GanZhi, Organ periods, hexagram numbers, source prose, or Vue state.

The environmental adapter consumes the `GlobalConditionsSnapshot` already calculated for the
Celestial Current instruments. It does not run Astronomy Engine a second time. Cantong qi provides
the actual lunar tempo, annual Yin/Yang movement provides the subordinate direction, and the solar
season provides a named Current-formalized background. If those inputs are missing, provenance
records the unavailable signal and the resolver retains its bounded profile-compatibility fallback;
it does not invent astronomy.

## OLTR

`renderOltr()` selects controlled field and response phrases, constructs candidates in the exact
semicolon format, rejects every hard failure, and selects deterministically. The original 100-point
base ranking is retained, with controlled texture, lunar-tempo, and Macro-maturity tie-breakers so
the renderer can express more of the resolved field without changing its grammar.

Hard validation requires:

- exactly one sentence, one semicolon, and one final period;
- 14–26 words;
- a present-tense field clause and an imperative response clause;
- no first- or second-person pronouns;
- no metadata, prediction, fate, generic-spirituality, unsafe, or high-stakes language.

Every response relation has a separately validated fallback. Chū may favor an onset-compatible
verb, and Zhèng may favor continuation, but Macro maturity cannot change the relation or effort.

## Intention

`INTENTION_LEXICON` remains the only vocabulary. Each definition includes its stable ID, Chinese
character, tone-marked Pinyin, English label, short definition, affinities, conflicts, and version.
These are Current operational formalizations, not claims that a classical source mechanically
assigns an intention to an instant.

Relation compatibility is the hard gate. Profile preference, Day and Hour work, real lunar tempo,
field direction, effort, environmental background, and Macro maturity rank the compatible set.
The selector first favors meaningful diversity, then deterministically fills any remaining place.
It must return exactly ranks 1, 2, and 3 for every available synthesis.

Choosing a different ranked intention preserves the temporal field, Primary Current, OLTR,
evidence, versions, and validity. It re-ranks Execution only.

## Elemental Execution

Execution is a ranking of adult work categories, not a small command or productivity nudge. The
complete library contains exactly five definitions:

| Phase         | Spirit correspondence | Current work domain        |
| ------------- | --------------------- | -------------------------- |
| Wood 木 Mù    | Hún 魂 · Liver        | Direction & Development    |
| Fire 火 Huǒ   | Shén 神 · Heart       | Communication & Leadership |
| Earth 土 Tǔ   | Yì 意 · Spleen        | Operations & Stewardship   |
| Metal 金 Jīn  | Pò 魄 · Lung          | Refinement & Closure       |
| Water 水 Shuǐ | Zhì 志 · Kidney       | Insight & Resolve          |

The traditional Five Phase, Zang, and spirit correspondences are kept separate from the modern task
taxonomy. Work-domain names, examples, affinities, scores, and ranking are Current
formalizations—not traditional attributions, medical claims, or performance claims. A paired Fu
Organ uses its Phase for ranking; the displayed spirit remains associated with its traditional Zang
correspondence.

The engine scores all five definitions and never filters a safe category out. Internal weights are:

| Criterion            | Weight |
| -------------------- | -----: |
| Response relation    |     25 |
| Selected intention   |     20 |
| Strategic response   |     15 |
| Field direction      |     10 |
| Day work             |     10 |
| Hour work            |      5 |
| Active Organ element |     10 |
| Macro maturity       |      5 |

It returns the top three unique phases. If the active Organ's Phase is absent, that definition
replaces rank 3 and records `active-organ-coverage` as the inclusion basis. Scores remain internal;
the UI shows rank and contextual labels, not pseudo-precision.

Every definition has five representative work domains, explicit Current-formalization metadata,
library version, and source links for the traditional correspondence only. Validation rejects
incomplete identity, imperative atomic copy, duplicated domains or affinities, version mismatch,
unsupported claims, and medical, legal, financial, or otherwise high-stakes guidance.

## Cross-output validation and containment

`validateGuidanceBundle()` enforces the output contract after initial construction and after an
intention change. Available bundles must contain exactly three unique intention ranks and exactly
three unique Elemental ranks, include the active Organ element, preserve selected-item membership,
pass each output validator, avoid repeated output, and agree with the bundle version manifest.

Construction failures use a typed `GuidanceConstructionError`. The active provider converts only
that known fail-closed condition into an explicit unavailable bundle; unrelated implementation
errors are not swallowed. Unavailable bundles are validated as absence records and cannot retain a
generated OLTR, intention, or execution.

## Validity and caching

The bundle expires at the earliest known future semantic boundary:

- Macro Hour;
- Shíchen or legacy Earthly Branch hour;
- civil-day semantic classification;
- Cantong qi node;
- either solar-term boundary supplied by the traditional calendar or local astronomy.

Micro Hour remains observational and does not enter guidance identity or validity. A live bundle is
cached inside its half-open validity interval. Selected-time requests bypass that cache and never
overwrite it. Cache identity includes the four-profile resolution, Macro state, Organ, Cantong node
and interval, solar term and interval, and timezone.

## Safety and future language models

The engine produces no diagnosis, treatment, breath retention, qi manipulation, sexual cultivation,
advanced Neidan work, legal or financial instruction, prediction, fate claim, or irreversible life
decision. A future language model may phrase an already selected result only if the result preserves
the deterministic state and passes the same validators. The deterministic renderer is complete
without a model.

## Verification strategy

Tests generate states in memory and discard them. They do not build a state database. The closure
suite currently executes all 64 Day profiles × all 64 Hour profiles × both Macro states—8,192
runtime bundles—and asserts a validated semicolon OLTR, exactly three intentions, exactly three
unique Elemental domains, and active-Organ coverage. Separate table tests cover all Cantong nodes,
annual movements, seasons, status preservation, boundaries, and live/selected cache isolation.
