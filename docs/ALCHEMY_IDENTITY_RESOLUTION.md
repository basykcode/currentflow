# Alchemy identity resolution

Identity resolution is explicit, versioned, and reversible. Similar strings do not become the same
material, taxon, formula, preparation, compound, or disease by default.

## Mapping assertion

Each proposed crosswalk is a `MappingAssertion` with a stable ID, subject source record, target
canonical entity, relation, method, status, score when applicable, mapping version, reviewer
metadata, and provenance. Relations include exact, broad, narrow, and related. Statuses include
proposed, accepted, rejected, disputed, and superseded.

## Automatic acceptance

Only deterministic authoritative keys can be auto-accepted:

- an exact external identifier in a namespace governed for that entity type;
- an exact chemical InChIKey where the source semantics identify the same compound;
- an existing accepted mapping with the same mapping version.

Exact Disease Ontology IDs in the pinned source map to stable `disease:doid:<local-id>` entities.

## Entity-specific boundaries

- **Compounds:** prefer an exact Standard InChIKey and retain ChEBI/PubChem/source identifiers.
  Salt, stereochemistry, mixtures, and unspecified structures remain separate or unresolved.
- **Taxa:** use an authoritative taxon identifier and source release. Accepted scientific-name
  crosswalks still retain nomenclatural status; vernacular names are never sufficient.
- **Medicinal materials:** identity includes the referenced organism/mineral/animal, medicinal part,
  and preparation state when supplied. A botanical taxon is not itself a medicinal material.
- **Formulas:** `FormulaConcept` is a governed name identity. Each source occurrence remains a
  `FormulaWitness`; similarity of names or ingredients cannot overwrite or merge witnesses.

## Mandatory review

Name equality, transliteration, common names, abbreviations, fuzzy similarity, taxonomic proximity,
formula-name similarity, and inferred preparation equivalence remain review candidates. Scores help
order work but never grant acceptance. A common name shared by multiple botanical taxa must remain
ambiguous until stronger evidence exists.

## Source truth versus canonical identity

A source record always survives mapping. Rejection or remapping does not delete it. Original names,
definitions, synonyms, xrefs, citations, quotations, and raw record text remain on the evidence
side. Accepted mappings can be superseded while historical mapping versions and import runs remain
auditable.

## Conflict rules

- One source record may have multiple proposed candidates.
- Conflicting accepted exact mappings are a critical audit failure.
- Self-referential mapping cycles are prohibited.
- Broad/narrow/related mappings never masquerade as exact identity.
- Prepared materials remain distinct from their bases.
- Formula concepts do not absorb source-specific ingredient witnesses.
- Predictions never become observations.

Production projections use accepted mappings only and are rebuildable after review.
