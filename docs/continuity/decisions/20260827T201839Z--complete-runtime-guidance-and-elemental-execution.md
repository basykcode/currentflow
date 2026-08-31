# Decision: Complete runtime guidance and rank Elemental work domains

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: temporal semantic coverage, environmental integration, guidance output contract, and Execution taxonomy

## Context

The live Guidance Engine had a safe architecture but an incomplete runtime contract. Only 13 of 64
hexagrams had Current semantic profiles; environment-like fixture backgrounds were not connected to
the real Celestial Current snapshot; Intention could return fewer than three choices; Execution was
an atomic-action library; and the provider caught every construction exception as ordinary
unavailability. The requested v0 requires one OLTR plus three Intentions and three Executions for any
valid temporal state, with active Organ participation and adult categories of work.

## Decision

Keep guidance as a runtime composition engine. Do not materialize, precompute, or persist the
nominal 60⁴ (12,960,000-row) four-pillar cross-product—or any environment-enriched cross-product.

1. Maintain one Current semantic profile for each canonical King Wen hexagram 1–64. Four profile
   identities are composed for the requested instant under the existing Day/Hour/Month/Year
   precedence. Profiles remain `spec-reviewed` Current formalizations with no invented human
   reviewer.
2. Calculate Celestial Current once per authoritative Home sampling cycle and pass that exact
   `GlobalConditionsSnapshot` into the temporal provider. Map only categorical Cantong node, annual
   movement, and solar season into the semantic input. Keep raw angles and fractions out of
   guidance.
3. Require exactly three relation-compatible Intentions. Profile, temporal, lunar, seasonal, effort,
   and Macro affinities rank the closed lexicon; they do not reduce it below the required cardinality.
4. Replace atomic Execution actions with exactly five Five Phase work domains and return the top
   three. The active Organ's element must appear in those three, replacing rank 3 when necessary.
5. Treat Wood/Fire/Earth/Metal/Water, Zang correspondence, and Hún/Shén/Yì/Pò/Zhì as traditional
   identity metadata. Treat task-domain names, examples, affinities, scoring, and Organ-to-work
   ranking as Current operational formalizations, not traditional, medical, or performance claims.
6. Fail closed only for typed guidance-construction validation failures. Unexpected programming
   errors must remain visible.

## Elemental work domains

| Phase | Traditional correspondence | Current operational domain |
| ----- | -------------------------- | -------------------------- |
| Wood  | Liver · Hún                | Direction & Development    |
| Fire  | Heart · Shén               | Communication & Leadership |
| Earth | Spleen · Yì                | Operations & Stewardship   |
| Metal | Lung · Pò                  | Refinement & Closure       |
| Water | Kidney · Zhì               | Insight & Resolve          |

Traditional correspondence references:

- https://ctext.org/huangdi-neijing/xuan-ming-wu-qi
- https://ctext.org/huangdi-neijing/ling-lan-mi-dian-lun/zh

The references support only the traditional organ/spirit frame. They do not support or receive
attribution for Current's modern work taxonomy.

## Consequences

- Every valid canonical temporal combination closes through one deterministic engine.
- The durable data remains compact: 64 profiles, 15 intentions, five Execution definitions, and
  rules. State-space verification generates cases in memory and stores no result corpus.
- The active Organ affects output selection only through Execution ranking. It remains part of
  synthesis identity and provenance and refreshes at the authoritative Shíchen boundary. It cannot
  change Primary Current, response, effort, OLTR, intention eligibility, or safety.
- Missing environmental signals remain explicit and retain truthful status; a missing season is not
  inferred, while profile lunar compatibility may remain as a labeled fallback.
- Selected-time calculations bypass and preserve the live cache.
- The UI presents ranked work domains rather than commands, endpoints, or hand-holding task counts.

## Verification criteria

- Registry validation requires canonical profiles 1–64 exactly once.
- Available bundles contain exactly three unique intention ranks and three unique Elemental ranks.
- Every Execution result contains the active Organ element.
- All six Cantong mappings, eight annual-movement mappings, four seasons, environmental statuses,
  semantic boundaries, and live/selected cache behavior have table tests.
- A generated 64 Day × 64 Hour × two Macro-state closure test passes without persisted state.
- Full repository checks and production build pass before completion.

## Supersedes

This decision supersedes the 13-profile limitation, partial canonical coverage expectation, and
atomic Execution behavior in:

- `20260822T225700Z--adopt-versioned-current-semantic-resolver.md`
- `20260822T222049Z--gate-guidance-output-on-versioned-semantic-input.md`

Their deterministic semantic-input gate, source separation, provenance, review honesty, safety, and
future-AI constraints remain accepted.

## Related files

- `docs/GUIDANCE_OUTPUT_ENGINE.md`
- `docs/GUIDANCE_OUTPUT_ARCHITECTURE.md`
- `docs/TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md`
- `src/domain/guidance`
- `src/providers/guidanceEnvironment.ts`
