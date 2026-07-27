# Alchemy source register

The machine-readable authority is
`services/alchemy-api/data/source-registry/*.yaml`. This document explains its review
categories; it does not supersede release-specific manifests or grant rights.

## Current inventory

| Registry status | Count | Meaning |
| --- | ---: | --- |
| Initial candidate | 17 | Useful first-wave source; each release still requires checksum and rights verification |
| Conditional | 7 | Potentially usable only under the recorded terms and production projection |
| Permission pending | 10 | Adapter disabled; no acquisition or production use |
| Blocked | 3 | Excluded under the present distribution/product model |

The 37 registered sources cover traditional materials/formulas, taxonomy and ontology,
chemistry/bioactivity, exposure/toxicity, literature and classical text. Each entry records:
source ID, title, URL, domain, adapter, acquisition method, release/version strategy, expected
artifacts, license evidence, commercial/redistribution/derivative/AI rights, attribution,
share-alike or copyleft effect, production status, field inventory, mapping targets, and an
adapter checklist.

## Source-by-source summary

| Source | Planning class | Recorded license baseline | Intended use / controlling restriction |
| --- | --- | --- | --- |
| Taiwan MOHW THP / Standardized Formulas | Initial | Taiwan OGL 1.0 | Live foundation: 355 official monographs, 200 formulas, and exact base compositions |
| Disease Ontology | Initial | CC0 1.0 | Disease identity/hierarchy; release `v2026-06-30` is pinned |
| USDA Dr. Duke | Initial | CC0 1.0 | Phytochemical/ethnobotanical source records; mappings need domain review |
| LOTUS | Initial | CC0 1.0 | Natural-product occurrences; pin a release before use |
| COCONUT | Initial | CC0 1.0 | Compound identities/metadata; pin a release before use |
| ChEBI | Initial | CC BY 4.0 | Chemical identity/ontology; retain attribution |
| Catalogue of Life | Initial | CC BY 4.0 | Taxon crosswalk; manual release and attribution |
| EPA CompTox/ToxCast | Initial | CC0 1.0 | Exposure/toxicity records; manual release and schema review |
| Mondo | Initial | CC BY 4.0 | Disease crosswalk; retain attribution |
| Evidence and Conclusion Ontology | Initial | CC0 1.0 | Evidence vocabulary; pin a release |
| UniProt | Initial | Release-specific review | Protein identity/annotation; approve exact release terms |
| Gene Ontology | Initial | CC BY 4.0 | Function/process vocabulary; retain attribution |
| Reactome | Initial | CC BY 4.0 | Pathways/reactions; retain attribution |
| OpenAlex | Initial | CC0 1.0 | Literature metadata; snapshot and cite source |
| Crossref | Initial | Release-specific review | Citation metadata only; API/snapshot terms pending |
| PubMed | Initial | Release-specific review | Bibliographic metadata only; NLM terms pending |
| PMC Open Access | Initial | Article-specific/open subset | Text only with per-article rights lineage |
| ChEMBL | Conditional | CC BY-SA 3.0 | Bioactivity; isolated share-alike projection |
| BindingDB | Conditional | Release-specific review | Bioactivity; exact release/redistribution approval |
| PubChem | Conditional | Release-specific review | Compound metadata via explicit cached admin snapshot |
| Open Targets | Conditional | CC0 1.0 baseline | Target/disease evidence; release component review |
| TCMSP | Conditional | ODbL 1.0 baseline | TCM records; no full production import before ODbL approval |
| Kanripo | Conditional | CC BY-SA 3.0 | Classical-text metadata/text; isolated share-alike projection |
| Wikisource | Conditional | CC BY-SA 3.0 | Edition metadata/rights-approved passages only |
| HERB | Permission pending | Terms pending | TCM relationships; written reuse rights required |
| ETCM | Permission pending | Terms pending | Formula/herb/compound data; written rights required |
| SymMap | Permission pending | Terms pending | TCM-modern mappings; access and derivative rights required |
| TCMBank | Permission pending | Terms pending | Ingredient/target/disease data; written rights required |
| BATMAN-TCM | Permission pending | Terms pending | Predictions; permission and prediction-labeling rules required |
| TCMID | Permission pending | Terms pending | Formula/ingredient data; written rights required |
| DCABM-TCM | Permission pending | Terms pending | Mechanism/association data; written rights required |
| HerbComb | Permission pending | Terms pending | Combination evidence; written rights required |
| CTEXT | Permission pending | Terms pending | Classical text; API/text/commercial terms required |
| CBETA | Permission pending | Terms pending | Text witnesses; corpus-specific rights required |
| TCM Data Hub | Blocked | Reuse prohibited | No acquisition or import |
| American Dragon | Blocked | Reuse prohibited | No acquisition or import |
| Commercial materia-medica category | Blocked | No explicit bulk rights | No acquisition or import |

This table is an overview. The registry's URLs, evidence, field inventories, and detailed limitations
control machine behavior, and a release snapshot can only narrow these baselines.

## Initial candidates

Taiwan MOHW, Disease Ontology, USDA Dr. Duke, LOTUS, COCONUT, ChEBI, Catalogue of Life, EPA resources, Mondo,
Evidence and Conclusion Ontology, UniProt, Gene Ontology, Reactome, OpenAlex, Crossref, PubMed, and
PubMed Central are registered as first-wave candidates. This category is planning priority, not a
blanket license approval.

Two releases have checked-in, fully specified manifests:

- `source:taiwan-mohw-docmap` / `thp4-2025-07-30` pins the official pharmacopeia and correction
  PDFs plus the reproducible 2026-07-26 formula-page extraction under Taiwan OGL 1.0.
- `source:disease-ontology` / `v2026-06-30` pins the exact OBO artifact and CC0 snapshot.

The checked-in manifest starts with runtime verification/audit flags false. A successful acquisition
writes a resolved local manifest with observed retrieval metadata and true verification flags; that
environment-specific evidence is intentionally excluded from Git.

## Conditional sources

ChEMBL, BindingDB, PubChem, Open Targets, TCMSP, Kanripo, and Wikisource require source-specific
conditions, attribution, redistribution boundaries, or release review. They remain excluded from a
production projection until a particular release passes policy.

## Permission queue

HERB, ETCM, SymMap, TCMBank, BATMAN-TCM, TCMID, DCABM-TCM, HerbComb, CTEXT, and CBETA have disabled
adapter placeholders. See `ALCHEMY_PERMISSION_QUEUE.md`.

## Blocked

TCM Data Hub, American Dragon, and the commercial materia-medica category are blocked. No
downloader is configured for them, and the policy engine denies internal import and production
projection.

## Review commands

```powershell
cd services/alchemy-api
uv run alchemy sources validate
uv run alchemy sources list
uv run alchemy sources show source:disease-ontology
uv run alchemy sources show source:taiwan-mohw-docmap
uv run alchemy sources audit-rights
```

`validate` enforces the schema and uniqueness. `audit-rights` evaluates release snapshots with the
deny-by-default policy. A source-level status cannot promote a less permissive row.
