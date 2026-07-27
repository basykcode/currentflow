# Handoff: publish the official herb/formula foundation

- Timestamp (UTC): 2026-07-27T00:36:00Z
- Branch: `master`
- Starting commit: `5a2dbb6`
- Published implementation chain: `0b69993`, `2ab7396`, `ac778c1`, `a9f101c`, `07f7318`,
  `9a1fa5a`
- Status: complete and live

## Objective

Replace the synthetic-only Alchemy catalog with a future-proof, provenance-first Neo4j foundation
containing a complete official release of medicinal-material and formula names, plus ordered
formula-to-material composition edges that the existing Current Flow interface can load.

## Source and scope

Selected Taiwan Ministry of Health and Welfare:

- Taiwan Herbal Pharmacopeia 4th edition;
- the correction effective 2025-07-30;
- the ministry's 200 standardized-formula pages, captured losslessly on 2026-07-26; and
- Taiwan Open Government Data License 1.0 as declared by the ministry website.

“Complete” means complete within this pinned official release:

- 355 official medicinal-material monographs;
- 200 standardized formulas;
- 1,672 ordered base ingredient uses;
- 555 distinct source records;
- 448 normalized material identities, of which 447 are public `HerbMaterial` records and one is a
  non-public `PreparedMaterial` excipient.

The 447 public material terms comprise 355 monographs plus 92 exact formula-only medicinal terms.
No botanical, preparation, synonym, or clinical equivalence was inferred for those extra terms.

## Implemented graph boundary

- Public identities: `HerbMaterial:MedicinalMaterial:CanonicalEntity` and
  `Formula:FormulaConcept:CanonicalEntity`.
- Evidence layer: `SourceRelease`, `SourceRecord`, `MappingAssertion`, `CanonicalName`, `Claim`,
  `FormulaWitness`, and ordered `IngredientUse`.
- Each `FormulaWitness` owns ordered ingredient uses, and each use points to exactly one material or
  prepared-material node.
- Regenerable direct `CONTAINS` edges and formula properties project ordered ingredient IDs, exact
  source terms, amount text, and units into the existing HTTP/UI contract.
- Traditional preparation additions after the base quantity context remain visible witness text;
  they are not fabricated as base ingredient rows.

## Production migration

Render startup now runs `alchemy foundation ensure --retire-demo` before binding the web port when
`ALCHEMY_ENSURE_FOUNDATION=1`. It:

1. checks exact release counts;
2. safely clears release-owned evidence when an earlier attempt is incomplete;
3. executes the checksum/rights/audit-gated full import;
4. verifies 355/200/1,672/555 exact counts;
5. rebuilds the approved projection;
6. retires exact `demo:*`/`demo=true` nodes only after success; and
7. refuses to serve on any critical graph audit failure.

The successful production run reconciled:

- 201 collapsed/partial source records;
- 555 invalid mapping assertions from the blocked attempt;
- 1,672 ingredient uses and 1,671 projected composition relationships;
- 846 release-owned evidence nodes; and
- 201 external identifiers.

It then imported 555 distinct source records, reported zero critical audit failures, and retired 12
demo/evidence nodes. Render deploy `dep-d9jabc8k1i2s73bmjrk0` for `ac778c1` became live in 3m59s.

## Failures found and corrected

1. The committed JSON snapshot had been checksummed from a Windows CRLF working copy. The repository
   now pins canonical LF bytes with `.gitattributes`; CI and Render use the same checksum.
2. The generic readable-ID helper stripped Chinese characters while retaining the shared ASCII
   prefix, collapsing all 355 monograph source records into one ID. Taiwan material source records
   now use a digest of the complete invariant identity, the pipeline audits 555 unique IDs before
   graph load, and incomplete-release reconciliation is restart-safe.
3. Neo4j full-text search scores were discarded before pagination. Search results now preserve
   relevance score before deterministic name/ID tie-breaking.
4. Neo4j stored public projection properties in snake case while the OpenAPI/frontend contract
   expects camel case. The API boundary now aliases property-map keys, backed by a real Neo4j
   integration assertion.
5. Demo-era UI copy labeled complete real records and workbench imports as synthetic. Completeness
   now carries the actual record status, review filters expose all supported states, and workbench
   notes use source-neutral wording.

## Verification

Local:

- `uv run alchemy check` — 64 files formatted, Ruff passed, MyPy passed 51 source files, 36 tests
  passed, one Neo4j integration test skipped locally by its environment gate, OpenAPI current.
- `npm.cmd run check` — strict TypeScript, ESLint with zero warnings, 74 frontend tests, and
  production Vite build passed.
- Full Taiwan MOHW dry run — 5,132 nodes, 13,798 relationships, 555 unique source records, zero
  rejects, zero critical pipeline failures, production rights projection approved.

CI:

- GitHub Actions run `30227398632` for `ac778c1` passed quality, disposable Neo4j integration, and
  container jobs.
- GitHub Actions run `30227672540` for `a9f101c` passed all three jobs.
- GitHub Actions run `30227780960` for `07f7318` passed quality, disposable Neo4j integration, and
  container jobs, including the new property-contract assertion.

Production at the successful foundation deploy:

- readiness: API ready, Neo4j ready;
- public totals: 447 herb/material terms and 200 formulas;
- known formula detail:
  `formula:taiwan-mohw:cp-866-5524-108` has six ordered ingredient IDs with amounts
  `8, 4, 4, 3, 3, 3` grams and source-backed claims;
- Render audit: zero critical failures, no issues, 555 projected source records.
- Render deploy `dep-d9jagcfaqgkc739ho3s0` made `07f7318` live in 1m21s.
- Exact live searches rank `六味地黃丸《丸》` and `熟地黃` first.
- The formula page renders six connected materials at `8, 4, 4, 3, 3, 3 g`; loading it creates six
  resolved device-local workbench rows with the same amounts, units, and material IDs.
- Cloudflare published `9a1fa5a`; public assets use source-neutral loading/import copy and the
  formula coverage badge reports `Source-reported`, not synthetic.

## Remaining limitations and next action

- “Exhaustive” is release-scoped, not a claim of global TCM completeness.
- The official corpus is primarily Traditional Chinese; reviewed bilingual aliases are not yet
  present.
- Ninety-two formula-only exact material terms need domain review and explicit cross-source identity
  decisions.
- Disease Ontology and compound/target enrichment remain deliberately deferred.
- Render Free and AuraDB Free remain alpha infrastructure without a production SLA.

Exact next action: domain-review the 92 formula-only material terms and select a licensed bilingual
identity authority.
