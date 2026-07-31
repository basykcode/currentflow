# Decision: Ship only derived, auditable hexagram commentary drafts

- Status: accepted
- Date (UTC): 2026-07-30
- Scope: commentary architecture, publication boundary, and product behavior

## Context

The hexagram inspector needs six interpretive lenses across all 64 King Wen figures. The local
corpus contains 11 sources, most without a verified redistribution license. The product must expose
useful synthesis without bundling protected passages, collapsing schools, inventing missing
evidence, or presenting automated prose as editorially final.

## Decision

Use a four-boundary pipeline:

1. local ignored source chunks;
2. local ignored normalized evidence, source digests, and school packets;
3. tracked original-prose drafts with sentence-to-source mappings;
4. tracked public JSON containing synthesis and compact provenance, but no source prose.

The frontend lazy-loads public bundles through a typed repository and renders explicit loading,
unavailable, evidence, rights, and review states. Automated QA may mark a record `qa-passed`, but
all generated prose remains `draft-only` and visibly requires human review.

Process the corpus in resumable batches of eight. Preserve the manually reasoned Hexagram 5 pilot.
When eligible evidence is absent, ship an explicit unavailable record with no synthesized prose.

## Consequences

- The browser receives 64 small static JSON bundles and makes no hidden network calls.
- Every displayed synthesis retains school, source contribution, chunk support, rights, and review
  metadata.
- Five Buddhist cells are unavailable because their only records are quarantined.
- Public builds can be validated without the protected local corpus; full regeneration requires it.
- Human editorial review remains required before publication eligibility can become `publishable`.

## Supersedes

This decision supersedes the earlier temporary requirement that commentary tabs remain unavailable
until a future synthesis boundary exists. It does not supersede the local-only source-text and
conservative-rights boundary established on 2026-07-30. The record-specific consequence that
`daoist_2_wang_bi` was blocked is superseded because the user subsequently supplied the correct
hexagram-organized Wang Bi *Classic of Changes*. The expanded audit also supersedes the earlier
two-record anomaly count with six quarantined records.

## Related

- [`../../HEXAGRAM_COMMENTARY_PIPELINE.md`](../../HEXAGRAM_COMMENTARY_PIPELINE.md)
- [`../../HEXAGRAM_COMMENTARY_RIGHTS.md`](../../HEXAGRAM_COMMENTARY_RIGHTS.md)
- [`../../../content/yijing/school-registry.json`](../../../content/yijing/school-registry.json)
