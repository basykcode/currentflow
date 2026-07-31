# Hexagram commentary rights and distribution

## Conservative rule

Possession of a file, user provision of a file, or availability of a copy in a public repository
does not establish redistribution rights. Unknown licenses remain unknown. The system therefore
uses protected material only as local research evidence and publishes no quotation from it.

## Rights statuses

- `public-domain`: an accepted public-domain basis is documented.
- `licensed`: the project has an accepted license for the intended use.
- `user-supplied-internal`: supplied for local research; no redistribution permission inferred.
- `review-required`: rights basis is unresolved.
- `blocked`: not eligible for synthesis or display.

Every current source uses `summary-only` display policy and `none` quotation policy. Source titles,
authors, translators, high-level contribution labels, chunk IDs, and checksums are provenance
metadata; they do not expose the passage.

## Technical enforcement

- Raw chunks are Git-ignored at `data/hexagram-commentary/chunked/`.
- Normalized text, source digests, and packets are Git-ignored at `content/yijing/internal/`.
- Application code lazy-loads only `content/yijing/generated/hexagrams/*.json`.
- Public generated records set `quotationIncluded: false`.
- Build QA scans summaries for exact eight-word overlap with contributing source chunks.
- Tests reject `originalText` and `normalizedText` fields in public bundles.
- Production UI discloses source titles and contributors; source and chunk IDs appear only in
  development diagnostics.

## Editorial approval

Automated `qa-passed` records remain `draft-only`. Human approval must assess factual fidelity,
school fidelity, prose quality, source tensions, and rights before a record becomes publishable.
Approval of derived prose does not change the rights status of an underlying source.
