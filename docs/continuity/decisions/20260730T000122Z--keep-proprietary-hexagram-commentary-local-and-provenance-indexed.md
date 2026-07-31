# Decision: Keep proprietary hexagram commentary local and provenance-indexed

- Status: accepted
- Date (UTC): 2026-07-30
- Scope: data rights, source preparation, and commentary integration

## Context

The planned hexagram inspector commentary requires a multi-source corpus organized by King Wen
number. Seven earlier source directories are available in a public legacy repository, and the user
supplied four additional commercial books. The source text is needed locally for later OLTR and
summary development, but public availability of an earlier copy does not establish redistribution
rights for the underlying books.

One supplied work also conflicts with its intended data role: Richard John Lynn's translation of
Wang Bi's *Classic of the Way and Virtue* is an 81-section Daodejing commentary, not a
64-hexagram *Classic of Changes*.

## Constraints and requirements

- Do not publish copyrighted full-text commentary without an accepted rights basis.
- Preserve enough provenance to reproduce and audit every future derived summary.
- Map a passage to a hexagram only when the source supplies an explicit numbered boundary.
- Keep the existing UI unavailable until derived content is source-grounded and reviewed.
- Preserve the legacy chunks exactly so their prior behavior can be audited rather than silently
  rewritten.

## Options considered

1. **Commit every full-text chunk to the application repository** - maximally convenient, but it
   would redistribute commercial text and could place it in the public frontend history. Rejected.
2. **Store only opaque local files without an index** - avoids redistribution, but loses
   reproducibility, source identity, completeness, and anomaly tracking. Rejected.
3. **Keep chunk bodies local and ignored while tracking preparation code, hashes, provenance, and
   eligibility** - supports auditable synthesis without publishing the corpus. Selected.

## Decision

Write full commentary passages only to the Git-ignored
`data/hexagram-commentary/chunked/` directory. Track:

- a reproducible extraction/import script;
- a source manifest with lens and sequence labels;
- a per-chunk SHA-256 index with King Wen number and eligibility;
- an audit report that quarantines known boundary anomalies; and
- no local source path, source filename, or commentary body.

Import the seven legacy directories byte-for-byte from a pinned public-repository commit. Extract
the Balkin, Dening, and *The 64 Ways* works only at their explicit 1-64 chapter boundaries.
Register `daoist_2_wang_bi` as blocked with zero chunks until a hexagram-organized Wang Bi
*Classic of Changes* is supplied. Do not infer a Daodejing-to-hexagram crosswalk.

## Consequences and tradeoffs

- The local workspace is ready for source-grounded synthesis, but another machine must rebuild or
  securely transfer the ignored corpus before use.
- Git history contains provenance and integrity data without the commercial passages.
- Future summary records can retain source IDs and chunk hashes even if the local source file is
  later replaced after review.
- Two inherited legacy records remain unusable until repaired: Buddhist source 1, Hexagram 17, and
  Confucian source 2, Hexagram 64.
- Daoist source 2 remains unavailable until the correct work arrives.

## Verification criteria

- Every ready source has exactly `hex_01.txt` through `hex_64.txt`.
- Every chunk is valid UTF-8, non-empty, indexed, hashed, and identified by source and King Wen
  number.
- New source boundaries resolve exactly once for all numbers 1-64.
- Imported legacy chunk hashes match the pinned reference checkout.
- Known malformed chunks are not ingestion eligible.
- The full-text directory is ignored by Git and absent from the frontend bundle.

## Supersedes

None.

## Superseded by

None.

## Related files, handoffs, and references

- [`../../../data/hexagram-commentary/README.md`](../../../data/hexagram-commentary/README.md)
- [`../../../scripts/prepare_hexagram_commentary.py`](../../../scripts/prepare_hexagram_commentary.py)
- [`../../DATA_INTEGRATION.md`](../../DATA_INTEGRATION.md)
- [Legacy public chunk layout](https://github.com/BenKalish42/current-almanac/tree/master/data/chunked)
