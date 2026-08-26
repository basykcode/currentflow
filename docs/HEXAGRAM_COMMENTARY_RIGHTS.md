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

## Private Prompt Lab exception

The internal Gene Keys Prompt Lab may place the two user-supplied Richard Rudd chunk sets in a
private Cloudflare Workers KV namespace solely so a password-authorized server function can send the
selected chapter to the configured Workers AI model. This is a private processing boundary, not a
change in redistribution rights or publication eligibility.

The browser receives only original generated prose and compact settings. The function never returns
the source passage, and successful output is checked for exact eight-word overlap and retried once
before delivery. The public SPA bundle, Git history, localStorage archive, and exported experiment
history contain no source text. Cloudflare nevertheless processes selected source text during each
generation; operators must keep the namespace private, protect its credentials, and re-evaluate the
provider boundary if the service or rights basis changes.

## Editorial approval

Automated `qa-passed` records remain `draft-only`. Human approval must assess factual fidelity,
school fidelity, prose quality, source tensions, and rights before a record becomes publishable.
Approval of derived prose does not change the rights status of an underlying source.
