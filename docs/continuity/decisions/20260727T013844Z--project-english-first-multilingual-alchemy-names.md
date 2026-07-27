# Decision: Project English-first multilingual Alchemy names

- Status: Accepted
- Date: 2026-07-27
- Branch: `master`

## Context

The live Taiwan MOHW foundation preserved exact Traditional Chinese names but exposed those strings
as public display names. That was faithful to the source yet made the English-language application
unusable. Herb/material and formula identity must remain stable while names evolve, and official
source names must remain distinguishable from translations created by Current Flow.

The pinned Taiwan Herbal Pharmacopeia 4th edition includes common English names for all 355
monographs. The ministry's 2021 common-formula bilingual compendium supplies formula romanization
references but does not provide a complete set of common English formula titles for the 200-formula
release.

## Decision

1. Keep canonical entity IDs and exact Traditional Chinese source records unchanged.
2. Model English, tone-marked Hanyu Pinyin, and Traditional Chinese as separate `CanonicalName`
   nodes connected by `HAS_NAME`; keep untoned Pinyin as an additional search representation.
3. Use English as `display_name` and as the preferred public name. Show Pinyin and Traditional
   Chinese as secondary identity fields in the application.
4. Import the 355 pharmacopeia common English material names with their official-source provenance.
5. Import conservative English translations for the 93 exact formula-only material terms and
   conventional English titles for all 200 formulas with explicit Current Flow derivation metadata
   and `machine_imported` review status. Do not call these source-official names.
6. Generate Hanyu Pinyin with tone marks using pinned `pypinyin` 0.55.0 and curated phrase/polyphone
   overrides. Retain untoned official MOHW formula references separately, including spelling
   variants, for audit.
7. Gate production readiness on all 647 public Taiwan MOHW entities carrying the multilingual name
   schema. A missing projection forces the release-safe startup reconciliation and re-import.

## Consequences

- English speakers can browse and search the complete current foundation by English, toned or
  untoned Pinyin, or Traditional Chinese.
- Future reviewed aliases can be added without changing canonical IDs or source evidence.
- Duplicate English material labels remain possible where the official monograph name and an exact
  formula-only source term refer to related wording; no equivalence is inferred from a shared
  translation.
- Formula translations and formula-only material translations require later domain review before
  their review status can be promoted.
- Updating an adapter or mapping version may change the deterministic import-run ID. A non-resume
  pipeline run therefore starts a fresh checkpoint instead of attempting to reuse an incompatible
  historical checkpoint.

## References

- [`../../ALCHEMY_GRAPH_ARCHITECTURE.md`](../../ALCHEMY_GRAPH_ARCHITECTURE.md)
- [`../../ALCHEMY_DATA_PIPELINE.md`](../../ALCHEMY_DATA_PIPELINE.md)
- [`../../../services/alchemy-api/data/manifests/releases/taiwan-mohw-thp4-2025-07-30.yaml`](../../../services/alchemy-api/data/manifests/releases/taiwan-mohw-thp4-2025-07-30.yaml)
- [`../../../services/alchemy-api/data/releases/taiwan-mohw-multilingual-names-v1.json`](../../../services/alchemy-api/data/releases/taiwan-mohw-multilingual-names-v1.json)
