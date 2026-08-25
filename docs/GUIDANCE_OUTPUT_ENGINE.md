# Guidance Output Engine

## Purpose

The Guidance Output Engine converts already-resolved temporal semantics into three coherent,
bounded outputs:

- **One Line to Remember (OLTR):** what is happening and how it should be met;
- **Intention:** one controlled internal orientation plus up to two distinct alternatives;
- **Execution:** one ordinary, observable, reversible action plus safe ranked alternatives.

It is a pure, deterministic TypeScript domain module. It performs no network request, has no model
dependency, reads no browser state, and does not calculate astrology.

## Semantic resolver

`resolveGuidanceSynthesis()` accepts `GuidanceSemanticInput`, not a `CurrentFlowSnapshot`. The live
input is produced by the Temporal Semantic Resolver adapter when an eligible operative day profile
exists. The input
contains a semantic condition, field description, day work, hour modulation, background signals,
evidence, and future boundaries. The resolver selects one response relation, qualitative effort,
supported and forbidden verbs, strategic and somatic vectors, and categorical completion,
initiation, containment, and release profiles.

Effort uses only:

- `minimal`
- `measured`
- `steady`
- `decisive`

Profiles use `none`, `low`, `moderate`, and `high`. No displayed percentage, confidence decimal, or
numeric pseudo-precision is produced.

## OLTR

`renderOltr()` performs four deterministic stages:

1. select controlled field and response phrases compatible with the synthesis;
2. construct candidates as `FIELD CLAUSE; RESPONSE CLAUSE.`;
3. reject every hard validation failure;
4. score remaining candidates and select deterministically.

The score totals 100:

| Criterion          | Weight |
| ------------------ | -----: |
| Semantic fidelity  |     30 |
| Response relation  |     20 |
| Direction clarity  |     15 |
| Compression        |     15 |
| Grammar            |     10 |
| Metaphor coherence |      5 |
| Safety             |      5 |

Hard validation requires exactly one sentence, exactly one semicolon, 14–26 words, one final
period, a present-tense field clause, and an imperative response clause. It rejects first- and
second-person pronouns, colons, parentheses, em dashes, metadata, predictions, fate language,
generic spirituality, unsupported claims, unsafe instructions, and high-stakes subject matter.

Every response relation has a separately validated fallback template. Rendering remains available
when the normal phrase bank yields no valid candidate.

## Intention

`INTENTION_LEXICON` is the only intention vocabulary. It contains the 15 requested Current
interpretive choices, including separate entries for `守 Shǒu` and `收 Shōu`. Each record carries a
stable ID, character, tone-marked pinyin, English label, short definition, compatible relations,
directions, lunar modes, effort levels, strategic and somatic vectors, conflicts, and a lexicon
version.

These records are explicitly Current formalizations. The engine does not claim that a classical
tradition mechanically assigns them to dates or hexagrams.

Selection weights are:

| Criterion                       | Weight |
| ------------------------------- | -----: |
| Response relation compatibility |     35 |
| Day operative work              |     20 |
| Hour modulation                 |     15 |
| Lunar tempo                     |     10 |
| Solar direction                 |     10 |
| Wu Yun Liu Qi background        |     10 |

Compatibility is validated before ranking. The selector returns one primary intention and at most
two alternatives whose labels and leading strategic/somatic signatures are meaningfully distinct.

## Execution

`EXECUTION_ACTION_LIBRARY` contains controlled somatic, task, environment, and pause actions. Each
definition includes an observable endpoint, one or two actions, a maximum qualitative effort,
compatible relations, directions and intention IDs, strategic and somatic vectors, low-risk status,
and a library version.

The validator rejects an action when it:

- lacks an observable endpoint;
- contains more than two actions;
- exceeds the synthesis effort;
- conflicts with relation, direction, intention, or a forbidden response verb;
- contains medical, legal, financial, irreversible, advanced cultivation, or otherwise unsafe
  content;
- contains unsupported claims;
- merely repeats the OLTR.

Selection is deterministic. A requested category re-ranks only already-valid actions; it cannot
make an incompatible action eligible.

## Cross-output validation

`validateGuidanceBundle()` runs after selection and after every user-requested alternative or
re-ranking. It validates OLTR format, selected-item membership, intention compatibility, every
ranked execution, forbidden verbs, effort, direction, unsupported claims, safety, and repeated
sentences. An invalid available bundle is never returned by `createGuidanceBundle()`.

An unavailable bundle is valid only as an absence record: it contains no OLTR, intention, or
execution claim and supplies an explicit reason and source boundary.

## Validity and versions

`resolveValidityWindow()` chooses the earliest candidate boundary after `validFromUtc`. Supported
reasons are:

- Earthly Branch hour change;
- lunar node change;
- solar-term boundary;
- Wu Yun Liu Qi period boundary;
- semantic classification change.

Every bundle stores temporal semantics, guidance synthesis, OLTR renderer, intention lexicon,
execution library, and validator versions. `isGuidanceExpired()` treats the boundary instant as
expired. The active provider caches its bundle until expiration instead of regenerating it on the
page’s minute refresh. The temporal-semantics version is the connected resolver version; exact
profile and registry versions remain in synthesis evidence.

## Frontend behavior

The frontend renders `GuidanceBundle`; it does not inspect raw Astrology fields. Selecting an
alternative calls `selectGuidanceIntention()`, which preserves the semantic synthesis and OLTR and
reselects only Execution. Choosing a preferred action form calls `rerankGuidanceExecutions()`, which
reorders valid actions without changing temporal semantics, OLTR, or intention.

## Safety and future AI boundary

The engine does not generate diagnosis, treatment, breath retention, qi manipulation, sexual
cultivation, advanced Neidan work, legal or financial instruction, or irreversible life decisions.
Actions stay ordinary, proportional, reversible, and low risk.

A future language model may only rewrite the phrasing of an already selected semantic result. It
may not calculate the temporal field, select a response relation, invent an intention, select an
action, change evidence, or bypass validators. The deterministic renderer is the complete fallback
and requires no language model.

## Verification

Acceptance fixtures cover emergence (`follow`), withdrawal (`withdraw`), completion (`complete`
then release), damp accumulation and repair (`transform`), and threshold (`wait`). Tests cover OLTR
format and safety, controlled intention and execution compatibility, cross-output coherence,
expiration, alternative selection, re-ranking, provider caching, explicit unavailability, and the
deterministic fallback.
