# Alchemy data governance

## Source admission

Every source starts with a validated YAML manifest containing identity, authorship/organization,
publisher, release year, URLs, source type, languages, version, license, rights status, attribution,
intended use, limitations, retrieval timestamp, SHA-256 checksum, adapter/version, expected files,
ingestion scope, and citation template.

Rights states are:

- `approved`: eligible for normal checksum-verified ingestion.
- `review_required`: validation or download requires an explicit development-only override; it is
  excluded from distributable seed data.
- `blocked`: rejected without override.

Unknown adapters, malformed records, missing rights declarations, path escapes, missing files, and
checksum mismatches are rejected. Public visibility is not a license. Current does not scrape
American-Dragon.com or similar commercial reference sites.

## Provenance and review

Each assertion becomes a source-specific `Claim` with predicate, subject, optional object/text,
quotation and normalized interpretation where supplied, language, locator, evidence type, review
status, optional process-defined confidence, import-run ID, and creation timestamp. Ingestion never
turns an LLM output into medical or historical truth.

Review statuses are `synthetic_fixture`, `machine_imported`, `human_reviewed`, `disputed`, and
`superseded`. Conflicting claims coexist. A later review can add a status or claim but must not erase
the earlier source record without an auditable supersession.

## Included source work

### Synthetic fixture

All record and relationship IDs begin with `demo:` and all records are explicitly synthetic. The
fixture exercises aliases, a claim conflict, preparation distinctions, formula overlap, sourced and
unknown pair signals, retrieval citations, and missing fields. It has no clinical or historical
authority.

### USDA Duke 2023

The manifest points only to the
[USDA Ag Data Commons release](https://agdatacommons.nal.usda.gov/articles/dataset/Dr_Duke_s_Phytochemical_and_Ethnobotanical_Databases/24660351),
records its CC0 license and official “not for self-diagnosis or self-medication” limitation, and
pins the downloaded archive SHA-256.

The first-pass field map is deliberately conservative:

| Table             | Mapped output                                                               | Boundary                                                            |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `FNFTAX.csv`      | `BotanicalTaxon` identity, scientific name, family, source record, raw row  | No automatic `HerbMaterial` crosswalk                               |
| `CHEMICALS.csv`   | `Compound` name, source chemical ID, CAS when supplied, raw row             | No traditional-property inference                                   |
| `AGGREGAC.csv`    | Source activity `Action`, unresolved source-name `Compound`, source `Claim` | Name-to-CHEMID ambiguity stays unresolved                           |
| `FARMACY_NEW.csv` | Raw quantitative `Claim` and locator                                        | Preliminary dictionary does not justify guessed unit/plant mappings |

Raw rows are preserved as JSON on imported records. `REFERENCES`, `ETHNOBOT`, assays, dosage, parts,
and yield tables remain pending a reviewed field map. The adapter is idempotent, supports dry-run and
batch size, and never equates a USDA plant with a Chinese medicinal material from string similarity.

### PubChem

The administration-only client uses official HTTPS PUG-REST endpoints, a descriptive User-Agent,
timeouts, at most five requests per second, retries for transient throttling/service errors, and an
ignored response cache. Each cached response receives a SHA-256. The offline adapter maps CID, title,
molecular formula, InChI, InChIKey, connectivity SMILES, and source URL. No end-user route calls
PubChem and no traditional property is inferred.

### SymMap

The placeholder manifest is `review_required`, has no download URL or distributable payload, and
documents potentially useful herb, symptom, ingredient, target, and relationship fields. The
adapter refuses ingestion even after manifest review override until Current records an approved
license decision.

### User-supplied sources

The adapter accepts checksum-declared JSONL and Markdown/text that the project has rights to use.
JSONL records carry source ID, locator, original text, normalized fields, language, review status,
and optional reviewed mentions. Markdown/text is deterministically divided into paragraph passages
and marked `machine_imported`. PDF OCR is intentionally absent.

## Review workflow

1. Verify rights and create a manifest without secrets or personal data.
2. Download only the declared location into ignored `data/raw`.
3. Verify checksums and run `--dry-run`.
4. Review unresolved fields, identity boundaries, and record counts.
5. Run ingestion, then `alchemy data audit`.
6. Human reviewers add or supersede claims without flattening disagreement.
