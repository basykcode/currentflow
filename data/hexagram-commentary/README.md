# Hexagram commentary staging

This directory is the local preparation boundary for source-grounded hexagram commentary. It is not
read by the frontend and does not make any runtime network request.

## Layout

- `manifest.json` records source identity, lens/sequence labels, provenance, extraction method,
  checksums, coverage, rights status, and blockers.
- `chunk-index.jsonl` records one metadata/checksum row per local chunk.
- `audit.json` records deterministic coverage and quarantine checks.
- `chunked/<source_id>/hex_01.txt` through `hex_64.txt` contain the full local source passages.
  `chunked/` is deliberately Git-ignored.

The path and naming convention remain compatible with the earlier
[`current-almanac` chunk corpus](https://github.com/BenKalish42/current-almanac/tree/master/data/chunked).
Hexagram numbers use King Wen order.

## Source labels added in this preparation

- `daoist_2_wang_bi` - Wang Bi as translated by Richard John Lynn,
  *The Classic of Changes*
- `psychological_2_balkin` - Jack M. Balkin, *The Laws of Change*
- `psychological_3_dening` - Sarah Dening, *The Everyday I Ching*
- `gene_keys_2_rudd` - Richard Rudd, *The 64 Ways*

## Rebuild

Use the bundled workspace Python, which supplies `pypdf` and `lxml`, and pass a local checkout of
the reference repository plus the four user-provided files:

```powershell
python scripts/prepare_hexagram_commentary.py `
  --reference-repo <current-almanac-checkout> `
  --balkin-epub <laws-of-change.epub> `
  --dening-pdf <everyday-i-ching.pdf> `
  --wang-bi-epub <wang-bi-classic-of-changes.epub> `
  --rudd-64-ways-epub <the-64-ways.epub>
```

The script never maps a text to a hexagram unless the source supplies an explicit numbered
boundary. It imports seven legacy directories byte-for-byte and extracts four new 1-64 works.
The Wang Bi/Lynn extractor verifies the EPUB title and subtitle and splits only at its explicit
`HEXAGRAM 1` through `HEXAGRAM 64` section markers.

## Focused local Gene Keys refresh

When only the two Richard Rudd EPUBs are available, rebuild their local ignored chunk folders with:

```powershell
python scripts/chunk_gene_keys_epubs.py `
  --gene-keys-epub <gene-keys.epub> `
  --rudd-64-ways-epub <the-64-ways.epub>
```

This focused command writes `gene_keys_1_rudd` and `gene_keys_2_rudd` only. It deliberately does
not rewrite the tracked manifest, chunk index, normalized evidence, or public commentary. If an
input differs from the indexed source, adopt it through a full provenance and commentary rebuild
rather than silently remapping existing sentence support.

## Private Prompt Lab publication

The password-protected Gene Keys Prompt Lab can read these two source folders from a private
Cloudflare Workers KV namespace. The source text still does not enter Git, `dist`, browser storage,
or a public response. `npm run prompt-lab:publish-sources` uploads the exact 128 local files directly
to a configured namespace after all three required Cloudflare environment variables are supplied.
The command verifies both complete filename sets before making the explicit network request and
prints only the record count and a combined integrity hash.

Run `npm run prompt-lab:verify-sources` first to perform the same completeness and integrity pass
without credentials or a network request.

Uploading the sources is a separate operational action from adopting them into the tracked
commentary corpus. In particular, the newer `gene_keys_1_rudd` chunks must not inherit the older
legacy index or sentence mappings.

## Ingestion gate

Later summarization should:

1. read only `chunk-index.jsonl` records with `ingestion_eligible: true`;
2. retain `source_id`, hexagram number, and chunk SHA-256 in every derived record;
3. treat generated OLTRs and summaries as drafts until human review;
4. keep original full-text chunks out of the public application bundle and repository.
