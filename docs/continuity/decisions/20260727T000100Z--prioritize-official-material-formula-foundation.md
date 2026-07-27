# Decision: Prioritize an official material and formula foundation

- Status: accepted
- Date (UTC): 2026-07-27
- Scope: Alchemy source priority, graph identity, public projection, and production bootstrapping

## Context

The release-aware graph architecture was proven with a Disease Ontology subset, but the live
product still contained only synthetic herbs and a synthetic formula. That technical proof did not
serve Alchemy's actual product spine: medicinal materials, named formulas, and formula composition.
The next source had to provide both official names and source-attested ingredient lists under terms
compatible with the public product.

## Constraints and requirements

- Use an official, public, production-compatible source with pinned artifacts and explicit reuse
  terms.
- Populate all material and formula names in the selected release, not a demonstration subset.
- Preserve formula order, quantities, source wording, and provenance without inventing botanical,
  synonym, preparation, or clinical equivalence.
- Keep the richer evidence graph and the existing `HerbMaterial` / `Formula` API compatible.
- Make a missing or partial foundation a deployment failure, and remove synthetic live records only
  after the real foundation reaches audited counts.

## Options considered

1. **Continue with Disease Ontology** — useful for later condition identity, but unrelated to the
   minimum usable material/formula catalog. Deferred.
2. **Use HERB, ETCM, or similar research databases** — broad coverage, but their recorded reuse and
   derivative-database permissions are not production-approved. Rejected for this release.
3. **Use Taiwan MOHW's Herbal Pharmacopeia and Standardized Formulas** — official government
   material names and 200 formula prescriptions under Taiwan Open Government Data License 1.0.
   Selected.

## Decision

Pin Taiwan Herbal Pharmacopeia 4th edition, its amendment effective 2025-07-30, and a
2026-07-26 lossless extraction of the ministry's 200 standardized-formula pages. Check the derived
snapshot into the repository so imports are reproducible and offline after acquisition; continue to
download and checksum the two official PDFs as release evidence.

Treat “complete” as complete within this pinned official release: 355 medicinal-material
monographs, 200 standardized formulas, and 1,672 ordered base ingredient uses. Preserve the one
official item-number anomaly (detail item 122 is repeated where the ordered index supplies item 123)
as source metadata.

Dual-label official material and formula identities:

- `HerbMaterial:MedicinalMaterial:CanonicalEntity`
- `Formula:FormulaConcept:CanonicalEntity`

Each formula also has a source-specific `FormulaWitness`; every composition row is an
`IngredientUse` connected to its witness and exact material term. A regenerable `CONTAINS`
relationship and ordered `ingredient_ids` property support the existing public API and workbench.
Formula-only parenthetical terms remain source-scoped exact material terms. No broader identity is
asserted. The generic `油質基劑` excipient is a `PreparedMaterial`, not a public herb.

At production startup, verify exact foundation counts before serving. Import only when those counts
are absent or incomplete, rebuild projections after the audit passes, and retire exact
`demo:*`/`demo=true` nodes only after the real foundation is complete. Disable automatic demo
seeding.

## Consequences and tradeoffs

- The live Materia Medica and Formula Library become useful before condition, compound, target, or
  ontology enrichment.
- Public formulas load real ordered materials and source-reported quantities into the workbench.
- The public material list includes 92 additional exact formula ingredient terms beyond the 355
  monograph names; their unresolved broader identity is explicit.
- Traditional-preparation additions after the base quantity context remain preserved in witness
  text but are not projected as base ingredient uses.
- Deployment has a one-time official-PDF acquisition dependency when the persistent graph lacks the
  foundation. Later restarts skip ingestion after an exact count check.
- Disease Ontology remains a valid registered source and adapter, but it is not a product priority.

## Verification criteria

- Source registry and two release manifests validate.
- Snapshot generation yields exactly 355 monographs, 200 formulas, and 1,672 ingredient uses.
- Full dry-run has zero rejects and zero critical audit failures.
- Every canonical material/formula and every formula witness has source-record provenance.
- Every `IngredientUse` has one formula witness and one material/prepared-material target.
- Live status reports the exact required counts; herb/formula endpoints are searchable; opening a
  formula returns resolvable ingredient IDs and amounts.
- Backend and repository-wide checks pass before publication.

## Supersedes

The source-priority portion of
[`20260726T220215Z--establish-release-aware-alchemy-knowledge-foundation.md`](20260726T220215Z--establish-release-aware-alchemy-knowledge-foundation.md):
Disease Ontology remains the first architecture proof, but no longer controls product ingestion
priority.

## Superseded by

None.

## Related files

- [`../../ALCHEMY_SOURCE_REGISTER.md`](../../ALCHEMY_SOURCE_REGISTER.md)
- [`../../ALCHEMY_DATA_PIPELINE.md`](../../ALCHEMY_DATA_PIPELINE.md)
- [`../../ALCHEMY_GRAPH_SCHEMA.md`](../../ALCHEMY_GRAPH_SCHEMA.md)
- [`../../../services/alchemy-api/data/source-registry/taiwan-mohw.yaml`](../../../services/alchemy-api/data/source-registry/taiwan-mohw.yaml)
- [`../../../services/alchemy-api/data/manifests/releases/taiwan-mohw-thp4-2025-07-30.yaml`](../../../services/alchemy-api/data/manifests/releases/taiwan-mohw-thp4-2025-07-30.yaml)
